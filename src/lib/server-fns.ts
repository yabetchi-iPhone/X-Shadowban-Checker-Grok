import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import type { AIDiagnosis, CheckResult, HistoryItem } from "./types";

const aiWindow = new Map<string, number[]>();

function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const hits = (aiWindow.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    throw new Error("リクエストが集中しています。少し待ってから再実行してください。");
  }
  hits.push(now);
  aiWindow.set(key, hits);
}

export const checkAccount = createServerFn({ method: "POST" })
  .validator((input: { username: string }) => {
    if (!input?.username || typeof input.username !== "string") {
      throw new Error("ユーザー名を入力してください。");
    }
    return { username: input.username };
  })
  .handler(async ({ data }) => {
    const { performXCheck } = await import("./x-check.server");
    return performXCheck(data.username);
  });

function asStringArray(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;
  const items = value.filter((v): v is string => typeof v === "string" && v.trim().length > 0);
  return items.length ? items : fallback;
}

function parseDiagnosis(text: string): AIDiagnosis {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced?.[1] ?? trimmed;
  const parsed = JSON.parse(raw) as Partial<AIDiagnosis>;
  return {
    riskLevel: typeof parsed.riskLevel === "string" ? parsed.riskLevel : "中",
    summary:
      typeof parsed.summary === "string"
        ? parsed.summary
        : "診断結果を生成できませんでした。",
    possibleCauses: asStringArray(parsed.possibleCauses, ["情報不足のため原因を特定できません。"]),
    recoveryPlan: asStringArray(parsed.recoveryPlan, ["24時間投稿を停止し、Xの検索で再確認してください。"]),
    estimatedRecoveryTime:
      typeof parsed.estimatedRecoveryTime === "string"
        ? parsed.estimatedRecoveryTime
        : "24〜72時間",
    preventionTips: asStringArray(parsed.preventionTips, ["短時間の連投と自動ツールを避ける。"]),
  };
}

export const diagnoseAccount = createServerFn({ method: "POST" })
  .validator((input: { result: CheckResult; userContext?: string }) => {
    if (!input?.result?.username) throw new Error("診断データが不十分です。");
    return {
      result: input.result,
      userContext: input.userContext?.slice(0, 500) ?? "",
    };
  })
  .handler(async ({ data }) => {
    rateLimit("ai", 6, 60_000);
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      throw new Error("Grok 診断は現在この環境では利用できません。");
    }

    const r = data.result;
    const prompt = `あなたはX (旧Twitter) のアルゴリズムとシャドウバン対策の専門家です。
公開データとチェッカー結果だけを根拠に、日本語で具体的な診断を出してください。断定しすぎず、推定と実測を分けて書いてください。

【対象】@${r.username}（表示名: ${r.displayName}）
【総合】${r.overallStatus} / 健全度 ${r.overallHealthScore}/100
【公開状態】exists=${r.exists} protected=${r.isProtected} suspended=${r.isSuspended} verified=${r.isVerified}
【数字】followers=${r.followersCount} following=${r.followingCount} tweets=${r.tweetCount} joined=${r.joined ?? "unknown"}
【bio】${r.bio || "（空）"}
【検索BAN】${r.checks.searchBan.status} (${r.checks.searchBan.method})
【補完BAN】${r.checks.searchSuggestionBan.status} (${r.checks.searchSuggestionBan.method})
【ゴーストBAN】${r.checks.ghostBan.status} (${r.checks.ghostBan.method})
【リプライ降格】${r.checks.replyDeboosting.status} (${r.checks.replyDeboosting.method})
※ status が unknown の項目は未測定です。ok と書かないでください。from:検索が空なら検索BANです。自分のログイン画面の検索は信用しないでください。
【Under the Hood】${
      r.hood
        ? `${r.hood.startDate}〜${r.hood.endDate} / ラベル ${r.hood.labels.map((label) => label.code).join(",") || "なし"}。本人の先月レポートであり、検索BANの判定には使わない。`
        : "未読込"
    }
【シグナル】${r.signals.map((s) => `${s.label}: ${s.detail}`).join(" / ") || "なし"}
${data.userContext ? `【ユーザー補足】${data.userContext}` : ""}

JSONのみで回答:
{
  "riskLevel": "低" | "中" | "高" | "極高",
  "summary": "100〜180字の現状解説",
  "possibleCauses": ["3〜5個"],
  "recoveryPlan": ["4〜6個の具体的ステップ"],
  "estimatedRecoveryTime": "短い期間表現",
  "preventionTips": ["3〜5個"]
}`;

    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4.7",
        temperature: 0.4,
        max_tokens: 900,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You are an X shadowban recovery specialist. Reply with JSON only, in Japanese.",
          },
          { role: "user", content: prompt },
        ],
      }),
      signal: AbortSignal.timeout(45000),
    });

    if (!res.ok) {
      throw new Error(`Grok API error ${res.status}`);
    }
    const body = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = body.choices?.[0]?.message?.content ?? "";
    if (!text) throw new Error("Grok からの応答を取得できませんでした。");
    return parseDiagnosis(text);
  });

export const listCheckHistory = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    return sql<HistoryItem>`
      select id, username, display_name as "displayName", overall_status as "overallStatus",
             health_score as "overallHealthScore", checked_at as "checkedAt"
      from check_history
      where user_id = ${context.userId}
      order by checked_at desc
      limit 20
    `;
  });

export const saveCheckHistory = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: HistoryItem) => input)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await sql`
      insert into check_history (id, user_id, username, display_name, overall_status, health_score, checked_at)
      values (
        ${data.id},
        ${context.userId},
        ${data.username},
        ${data.displayName},
        ${data.overallStatus},
        ${data.overallHealthScore},
        ${data.checkedAt}
      )
      on conflict (id) do nothing
    `;
    await sql`
      delete from check_history
      where user_id = ${context.userId}
        and checked_at < coalesce(
          (
            select checked_at from check_history
            where user_id = ${context.userId}
            order by checked_at desc
            offset 19
            limit 1
          ),
          'epoch'::timestamptz
        )
    `;
  });

export const clearCheckHistory = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    await sql`delete from check_history where user_id = ${context.userId}`;
  });
