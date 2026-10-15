import { useState } from "react";
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  ExternalLink,
} from "lucide-react";
import { BAN_TYPE_GUIDES } from "@/lib/shadowban-knowledge";
import type { CheckItem, CheckResult } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

function StatusBadge({ status }: { status: CheckItem["status"] }) {
  if (status === "ok") {
    return (
      <Badge tone="ok">
        <CheckCircle2 className="size-3.5" />
        OK
      </Badge>
    );
  }
  if (status === "deboosted") {
    return (
      <Badge tone="warn">
        <AlertTriangle className="size-3.5" />
        DEBOOST
      </Badge>
    );
  }
  if (status === "unknown") {
    return (
      <Badge tone="neutral">
        <CircleHelp className="size-3.5" />
        要確認
      </Badge>
    );
  }
  return (
    <Badge tone="ban">
      <AlertOctagon className="size-3.5" />
      BAN
    </Badge>
  );
}

function methodLabel(method: CheckItem["method"]) {
  if (method === "observed") return "実測";
  if (method === "fixture") return "デモ";
  return "未測定";
}

export function BanStatusCards({
  result,
  onSearchVerdict,
}: {
  result: CheckResult;
  onSearchVerdict?: (banned: boolean) => void;
}) {
  const [open, setOpen] = useState<string | null>(null);

  const items = [
    {
      key: "profileVisible",
      subtitle: "公開プロフィールの取得",
      check: result.checks.profileVisible,
      testUrl: `https://x.com/${result.username}`,
      guide: null,
    },
    {
      key: "searchBan",
      subtitle: "話題・最新タブへの表示",
      check: result.checks.searchBan,
      testUrl: `https://x.com/search?q=from%3A${result.username}&f=live`,
      guide: BAN_TYPE_GUIDES.find((g) => g.key === "searchBan") ?? null,
    },
    {
      key: "searchSuggestionBan",
      subtitle: "検索サジェストへの表示",
      check: result.checks.searchSuggestionBan,
      testUrl: `https://x.com/search?q=${result.username}`,
      guide: BAN_TYPE_GUIDES.find((g) => g.key === "searchSuggestionBan") ?? null,
    },
    {
      key: "ghostBan",
      subtitle: "リプライの第三者公開",
      check: result.checks.ghostBan,
      testUrl: `https://x.com/${result.username}`,
      guide: BAN_TYPE_GUIDES.find((g) => g.key === "ghostBan") ?? null,
    },
    {
      key: "replyDeboosting",
      subtitle: "返信の折りたたみ・順位",
      check: result.checks.replyDeboosting,
      testUrl: `https://x.com/${result.username}`,
      guide: BAN_TYPE_GUIDES.find((g) => g.key === "replyDeboosting") ?? null,
    },
  ];

  return (
    <section className="mx-auto w-full max-w-3xl px-4">
      <div className="mb-3 flex items-end justify-between gap-3">
        <h3 className="text-base font-semibold">項目別診断</h3>
        <p className="text-xs text-subtle">実測と未測定を分けて表示</p>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {items.map((item) => {
          const expanded = open === item.key;
          const problem = item.check.status !== "ok" && item.check.status !== "unknown";
          const needsSearch =
            item.key === "searchBan" && item.check.status === "unknown" && onSearchVerdict;
          return (
            <article
              key={item.key}
              className={cn(
                "rounded-xl border bg-surface p-4",
                problem ? "border-ban/40" : "border-border",
                needsSearch && "border-warn/40",
              )}
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-sm font-semibold">{item.check.label}</h4>
                  <p className="mt-0.5 text-xs text-muted">{item.subtitle}</p>
                </div>
                <StatusBadge status={item.check.status} />
              </div>
              <p className="mb-3 text-xs leading-relaxed text-muted">{item.check.description}</p>
              {needsSearch ? (
                <div className="mb-3 space-y-2 rounded-lg border border-warn/25 bg-warn/10 p-3">
                  <p className="text-xs leading-relaxed text-fg">
                    別アカウントで最新タブ{" "}
                    <span className="font-mono">from:{result.username}</span>{" "}
                    を見て、結果を選んでください。
                  </p>
                  <div className="flex flex-col gap-2">
                    <Button type="button" size="sm" className="h-11" onClick={() => onSearchVerdict(true)}>
                      結果なし → 検索BAN
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="h-11"
                      onClick={() => onSearchVerdict(false)}
                    >
                      ポストが出た
                    </Button>
                  </div>
                </div>
              ) : null}
              <div className="flex items-center justify-between border-t border-border pt-3">
                <a
                  href={item.testUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  Xで確認
                  <ExternalLink className="size-3" />
                </a>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] tracking-wide text-subtle uppercase">
                    {methodLabel(item.check.method)}
                  </span>
                  {item.guide ? (
                    <button
                      type="button"
                      onClick={() => setOpen(expanded ? null : item.key)}
                      className="inline-flex items-center gap-1 text-xs text-muted hover:text-fg"
                    >
                      解説
                      <ChevronDown className={cn("size-3.5 transition-transform", expanded && "rotate-180")} />
                    </button>
                  ) : null}
                </div>
              </div>
              {expanded && item.guide ? (
                <div className="mt-3 space-y-2 rounded-lg bg-elevated p-3 text-xs">
                  <p className="font-medium text-fg">主な症状</p>
                  <ul className="list-disc space-y-1 pl-4 text-muted">
                    {item.guide.symptoms.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                  <p className="rounded-md border border-warn/20 bg-warn/10 p-2 text-fg">
                    {item.guide.quickFix}
                  </p>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
