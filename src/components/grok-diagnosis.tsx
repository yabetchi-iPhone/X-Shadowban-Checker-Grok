import { useState } from "react";
import {
  AlertTriangle,
  Bot,
  CheckSquare,
  ChevronRight,
  Clock,
  Lightbulb,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";
import { diagnoseAccount } from "@/lib/server-fns";
import type { AIDiagnosis, CheckResult } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function riskTone(level: string): "ok" | "warn" | "ban" | "neutral" {
  if (level.includes("低") || /low/i.test(level)) return "ok";
  if (level.includes("極") || /critical/i.test(level)) return "ban";
  if (level.includes("高") || /high/i.test(level)) return "ban";
  if (level.includes("中") || /med/i.test(level)) return "warn";
  return "neutral";
}

export function GrokDiagnosis({ result }: { result: CheckResult }) {
  const [diagnosis, setDiagnosis] = useState<AIDiagnosis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [context, setContext] = useState("");
  const [showContext, setShowContext] = useState(false);

  const run = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await diagnoseAccount({
        data: {
          result,
          userContext: context.trim() || undefined,
        },
      });
      setDiagnosis(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Grok診断に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-3xl px-4">
      <div className="rounded-xl border border-primary/20 bg-surface p-5 sm:p-6">
        <div className="flex flex-col gap-4 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-fg">
              <Bot className="size-5" />
            </span>
            <div>
              <h3 className="flex items-center gap-2 text-base font-semibold">
                Grok 詳細診断
                <Badge tone="primary">grok-4.5</Badge>
              </h3>
              <p className="text-xs text-muted">原因仮説と、回復までの手順を日本語で組み立てます</p>
            </div>
          </div>
          {!diagnosis && !loading ? (
            <Button onClick={() => void run()} className="sm:w-auto">
              <Bot className="size-4" />
              診断を実行
            </Button>
          ) : null}
        </div>

        {!diagnosis && !loading ? (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setShowContext((v) => !v)}
              className="text-xs text-primary hover:underline"
            >
              補足（連投や外部ツールの有無）を追加して精度を上げる
            </button>
            {showContext ? (
              <textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                rows={3}
                placeholder="例: 昨日同じハッシュタグで連続投稿した、自動投稿ツールを使っている"
                className="mt-2 w-full rounded-md border border-border bg-elevated p-3 text-xs text-fg placeholder:text-subtle outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              />
            ) : null}
          </div>
        ) : null}

        {loading ? (
          <div className="space-y-3 py-10 text-center">
            <LoaderCircle className="mx-auto size-7 animate-spin text-primary" />
            <p className="text-sm font-medium">@{result.username} を解析しています</p>
            <p className="mx-auto max-w-md text-xs text-muted">
              公開プロフィールと制限サインを、Xの健全性ガイドラインと照合しています。
            </p>
          </div>
        ) : null}

        {error ? (
          <div className="mt-4 flex items-start gap-3 rounded-lg border border-ban/30 bg-ban/10 p-3 text-xs text-fg">
            <AlertTriangle className="size-4 shrink-0 text-ban" />
            <div>
              <p className="font-medium">Grok診断エラー</p>
              <p className="text-muted">{error}</p>
            </div>
          </div>
        ) : null}

        {diagnosis ? (
          <div className="mt-5 space-y-4 animate-fade-up">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-elevated p-3">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-subtle">リスク</span>
                <Badge tone={riskTone(diagnosis.riskLevel)}>{diagnosis.riskLevel}</Badge>
              </div>
              <p className="flex items-center gap-1.5 text-xs text-muted">
                <Clock className="size-3.5" />
                推定回復: <span className="text-fg">{diagnosis.estimatedRecoveryTime}</span>
              </p>
            </div>

            <div className="rounded-lg border border-border p-4 text-sm leading-relaxed text-muted">
              <p className="mb-1 text-xs font-medium text-primary">総合</p>
              {diagnosis.summary}
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-border p-4">
                <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-warn">
                  <AlertTriangle className="size-4" />
                  推測される原因
                </h4>
                <ul className="space-y-2 text-xs text-muted">
                  {diagnosis.possibleCauses.map((c) => (
                    <li key={c} className="flex gap-2">
                      <span className="text-warn">•</span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-lg border border-border p-4">
                <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-ok">
                  <CheckSquare className="size-4" />
                  回復プラン
                </h4>
                <ol className="space-y-2 text-xs text-muted">
                  {diagnosis.recoveryPlan.map((step, i) => (
                    <li key={step} className="flex gap-2 rounded-md bg-elevated p-2">
                      <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-ok/15 font-mono text-[10px] text-ok">
                        {i + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
              <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-primary">
                <Lightbulb className="size-4" />
                再発防止
              </h4>
              <ul className="grid grid-cols-1 gap-2 text-xs text-muted sm:grid-cols-2">
                {diagnosis.preventionTips.map((tip) => (
                  <li key={tip} className="flex gap-2">
                    <ChevronRight className="mt-0.5 size-3.5 shrink-0 text-primary" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex justify-end">
              <Button variant="secondary" size="sm" onClick={() => void run()}>
                <RefreshCw className="size-3.5" />
                再実行
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
