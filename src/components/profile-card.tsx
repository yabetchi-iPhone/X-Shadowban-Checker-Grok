import { useState } from "react";
import {
  AlertTriangle,
  Check,
  Clock,
  Copy,
  ExternalLink,
  Share2,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CheckResult, OverallStatus } from "@/lib/types";

function formatCount(n: number): string {
  if (n >= 100_000_000) {
    const v = n / 100_000_000;
    return `${(v >= 10 ? v.toFixed(0) : v.toFixed(1)).replace(/\.0$/, "")}億`;
  }
  if (n >= 10_000) {
    const v = n / 10_000;
    return `${(v >= 100 ? v.toFixed(0) : v.toFixed(1)).replace(/\.0$/, "")}万`;
  }
  return n.toLocaleString("ja-JP");
}

function formatTimestamp(iso: string) {
  try {
    const d = new Date(iso);
    return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  } catch {
    return iso;
  }
}

function statusBadge(status: OverallStatus) {
  switch (status) {
    case "ALL_CLEAR":
      return (
        <Badge tone="ok">
          <ShieldCheck className="size-3.5" />
          ALL CLEAR
        </Badge>
      );
    case "WARNING":
      return (
        <Badge tone="warn">
          <AlertTriangle className="size-3.5" />
          WARNING
        </Badge>
      );
    case "BAN_DETECTED":
      return (
        <Badge tone="ban">
          <XCircle className="size-3.5" />
          BAN DETECTED
        </Badge>
      );
    case "NEEDS_REVIEW":
      return (
        <Badge tone="warn">
          <AlertTriangle className="size-3.5" />
          要確認
        </Badge>
      );
    case "SUSPENDED":
      return (
        <Badge tone="neutral">
          <AlertTriangle className="size-3.5" />
          凍結の可能性
        </Badge>
      );
    default:
      return (
        <Badge tone="neutral">
          <AlertTriangle className="size-3.5" />
          未検出
        </Badge>
      );
  }
}

function barColor(score: number) {
  if (score >= 80) return "bg-ok";
  if (score >= 50) return "bg-warn";
  return "bg-ban";
}

export function ProfileCard({ result }: { result: CheckResult }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    const text = `【X シャドウバン結果】
アカウント: @${result.username}
判定: ${result.overallStatus}
健全度: ${result.overallHealthScore}/100
・プロフィール: ${result.checks.profileVisible.status}
・検索BAN: ${result.checks.searchBan.status}
・検索補完BAN: ${result.checks.searchSuggestionBan.status}
・ゴーストBAN: ${result.checks.ghostBan.status}
・リプライ降格: ${result.checks.replyDeboosting.status}
#Xシャドウバンチェッカー #Grok`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("結果をコピーしました");
    setTimeout(() => setCopied(false), 1800);
  };

  const share = () => {
    const label = result.overallStatus === "ALL_CLEAR" ? "正常" : "制限の可能性";
    const text = encodeURIComponent(
      `@${result.username} のシャドウバンチェック: ${label} / ${result.overallHealthScore}/100\n#Xシャドウバンチェッカー`,
    );
    window.open(`https://x.com/intent/post?text=${text}`, "_blank", "noopener,noreferrer");
  };

  return (
    <section className="mx-auto w-full max-w-3xl px-4">
      <div className="shadow-card overflow-hidden rounded-xl border border-border bg-surface">
        {result.bannerUrl ? (
          <div className="h-20 overflow-hidden bg-elevated sm:h-28">
            <img src={result.bannerUrl} alt="" className="h-full w-full object-cover" />
          </div>
        ) : null}

        <div className="space-y-5 p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <img
                src={result.avatarUrl}
                alt=""
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    `https://api.dicebear.com/9.x/identicon/svg?seed=${result.username}`;
                }}
                className="size-14 rounded-full border border-border bg-elevated object-cover"
              />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-lg font-semibold">{result.displayName}</h2>
                  {result.isVerified ? <Badge tone="primary">認証</Badge> : null}
                  {result.isProtected ? <Badge tone="warn">鍵垢</Badge> : null}
                </div>
                <p className="font-mono text-sm text-muted">@{result.username}</p>
              </div>
            </div>
            <div className="flex flex-col gap-1 sm:items-end">
              {statusBadge(result.overallStatus)}
              <p className="flex items-center gap-1 text-xs text-subtle">
                <Clock className="size-3" />
                {formatTimestamp(result.checkedAt)}
              </p>
            </div>
          </div>

          {result.bio ? (
            <p className="text-sm leading-relaxed text-muted">{result.bio}</p>
          ) : null}

          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              ["フォロワー", result.followersCount],
              ["フォロー", result.followingCount],
              ["ポスト", result.tweetCount],
            ].map(([label, n]) => (
              <div key={String(label)} className="rounded-lg bg-elevated px-2 py-3">
                <div className="font-mono text-sm font-medium tabular-nums">
                  {formatCount(Number(n))}
                </div>
                <div className="text-xs text-subtle">{label}</div>
              </div>
            ))}
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="font-medium text-muted">アカウント健全度</span>
              <span className="font-mono tabular-nums">{result.overallHealthScore} / 100</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-elevated">
              <div
                className={`h-full rounded-full transition-[width] duration-500 ${barColor(result.overallHealthScore)}`}
                style={{ width: `${result.overallHealthScore}%` }}
              />
            </div>
          </div>

          {result.signals.length > 0 ? (
            <ul className="space-y-2">
              {result.signals.map((s) => (
                <li
                  key={s.id}
                  className="rounded-lg border border-border bg-elevated/60 px-3 py-2 text-xs leading-relaxed text-muted"
                >
                  <span className="font-medium text-fg">{s.label}</span>
                  <span className="text-subtle"> — {s.detail}</span>
                </li>
              ))}
            </ul>
          ) : null}

          <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              <a
                href={`https://x.com/search?q=from%3A${result.username}&f=live`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 items-center gap-1 rounded-md bg-elevated px-3 text-xs font-medium hover:bg-elevated/80"
              >
                最新検索
                <ExternalLink className="size-3.5" />
              </a>
              <a
                href={`https://x.com/${result.username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 items-center gap-1 rounded-md bg-elevated px-3 text-xs font-medium hover:bg-elevated/80"
              >
                プロフィール
                <ExternalLink className="size-3.5" />
              </a>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" className="flex-1 sm:flex-none" onClick={() => void copy()}>
                {copied ? <Check className="size-3.5 text-ok" /> : <Copy className="size-3.5" />}
                {copied ? "コピー済" : "コピー"}
              </Button>
              <Button variant="inverse" size="sm" className="flex-1 sm:flex-none" onClick={share}>
                <Share2 className="size-3.5" />
                ポスト
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
