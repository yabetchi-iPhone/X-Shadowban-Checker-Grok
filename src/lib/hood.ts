import { summarizeChecks } from "./score";
import type { CheckResult, HoodLabel, HoodReport } from "./types";

const MAX_CHARS = 1_500_000;
const MAX_IDS = 20;

function record(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function count(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return 0;
}

function ids(value: unknown): { shown: string[]; more: number } {
  if (!Array.isArray(value)) return { shown: [], more: 0 };
  const all = value.filter((id): id is string => typeof id === "string" && /^\d{5,25}$/.test(id));
  return { shown: all.slice(0, MAX_IDS), more: Math.max(0, all.length - MAX_IDS) };
}

function labelFrom(value: unknown, scope: HoodLabel["scope"]): HoodLabel | null {
  const row = record(value);
  if (!row) return null;
  const code = text(row.label).slice(0, 80);
  if (!code) return null;
  const posts = count(row.posts);
  const total = count(row.totalPostsInMonth);
  const days = count(row.days);
  const daysInPeriod = count(row.daysInPeriod);
  const stat =
    scope === "post"
      ? `${posts} / ${total} 件 · ${text(row.percentageOfPosts) || "—"}`
      : `${days} / ${daysInPeriod} 日 · ${text(row.percentageOfDays) || "—"}`;
  const parsedIds = scope === "post" ? ids(row.postIds) : { shown: [], more: 0 };
  return {
    scope,
    code,
    about: text(row.about).slice(0, 240),
    effect: text(row.effect).slice(0, 240),
    stat,
    postIds: parsedIds.shown,
    morePosts: parsedIds.more,
  };
}

export function parseHoodJson(raw: string): HoodReport {
  const trimmed = raw.trim();
  if (!trimmed) throw new Error("JSONが空です。");
  if (trimmed.length > MAX_CHARS) throw new Error("ファイルが大きすぎます。");
  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    throw new Error("JSONとして読めません。Under the Hood のダウンロードファイルを選んでください。");
  }
  const body = record(parsed);
  const period = body ? record(body.period) : null;
  if (!body || !period) {
    throw new Error("Under the Hood のレポートではありません。");
  }
  const postLabels = Array.isArray(body.postLabels) ? body.postLabels : [];
  const accountLabels = Array.isArray(body.accountLabels) ? body.accountLabels : [];
  const labels = [
    ...postLabels.map((row) => labelFrom(row, "post")),
    ...accountLabels.map((row) => labelFrom(row, "account")),
  ].filter((row): row is HoodLabel => row !== null);
  return {
    startDate: text(period.startDate),
    endDate: text(period.endDate),
    generatedAt: text(body.generatedAt),
    postCount: count(body.postCount),
    labels: labels.slice(0, 40),
  };
}

export function applyHoodReport(result: CheckResult, hood: HoodReport): CheckResult {
  const period =
    hood.startDate && hood.endDate ? `${hood.startDate}〜${hood.endDate}` : "対象期間";
  const codes = hood.labels.map((label) => label.code).join("、");
  const reply = hood.labels.length
    ? {
        ...result.checks.replyDeboosting,
        status: "deboosted" as const,
        method: "observed" as const,
        description: `公式レポート（${period}）に表示制限ラベルがあります: ${codes}。おすすめ非表示などの制限で、検索BANとは別です。`,
      }
    : {
        ...result.checks.replyDeboosting,
        status: "ok" as const,
        method: "observed" as const,
        description: `公式レポート（${period}）に表示制限ラベルはありませんでした。検索BANはこのファイルでは分かりません。`,
      };
  const checks = { ...result.checks, replyDeboosting: reply };
  const { score, status } = summarizeChecks({
    exists: result.exists,
    isSuspended: result.isSuspended,
    search: checks.searchBan.status,
    suggestion: checks.searchSuggestionBan.status,
    ghost: checks.ghostBan.status,
    deboost: checks.replyDeboosting.status,
  });
  const detail = hood.labels.length
    ? hood.labels
        .map((label) => `${label.code}（${label.stat}）${label.effect ? `: ${label.effect}` : ""}`)
        .join(" / ")
    : `${period} は表示制限ラベルなし`;
  return {
    ...result,
    checks,
    hood,
    signals: [
      ...result.signals.filter((signal) => signal.id !== "under-the-hood"),
      {
        id: "under-the-hood",
        label: "Under the Hood",
        detail,
        tone: hood.labels.length ? "warn" : "ok",
      },
    ],
    overallHealthScore: score,
    overallStatus: status,
    checkedAt: new Date().toISOString(),
  };
}
