import { useRef, useState } from "react";
import { ExternalLink, FileJson } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { applyHoodReport, parseHoodJson } from "@/lib/hood";
import type { CheckResult, HoodLabel } from "@/lib/types";

function postDate(id: string): string {
  try {
    const ms = Number((BigInt(id) >> 22n) + 1288834974657n);
    if (!Number.isFinite(ms)) return "";
    return new Intl.DateTimeFormat("ja-JP", {
      month: "numeric",
      day: "numeric",
      timeZone: "UTC",
    }).format(new Date(ms));
  } catch {
    return "";
  }
}

function LabelRow({ label }: { label: HoodLabel }) {
  return (
    <li className="rounded-lg border border-border bg-bg p-3">
      <div className="flex items-start justify-between gap-3">
        <p className="font-mono text-xs font-medium">{label.code}</p>
        <p className="shrink-0 text-xs text-muted">{label.stat}</p>
      </div>
      {label.effect ? <p className="mt-2 text-xs leading-relaxed text-muted">{label.effect}</p> : null}
      {label.postIds.length ? (
        <ul className="mt-2 space-y-1">
          {label.postIds.map((id) => (
            <li key={id}>
              <a
                href={`https://x.com/i/status/${id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-mono text-xs text-primary hover:underline"
              >
                {postDate(id) ? `${postDate(id)} ` : ""}
                {id}
                <ExternalLink className="size-3" />
              </a>
            </li>
          ))}
          {label.morePosts ? (
            <li className="text-xs text-subtle">ほか {label.morePosts} 件</li>
          ) : null}
        </ul>
      ) : null}
    </li>
  );
}

export function HoodImport({
  result,
  onApply,
}: {
  result: CheckResult;
  onApply: (next: CheckResult) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [paste, setPaste] = useState("");
  const [openPaste, setOpenPaste] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const read = (raw: string) => {
    try {
      const hood = parseHoodJson(raw);
      onApply(applyHoodReport(result, hood));
      setError(null);
      setPaste("");
      toast.success(
        hood.labels.length
          ? `公式ラベル ${hood.labels.length} 件を反映しました`
          : "先月は表示制限ラベルなし、と反映しました",
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "読み込めませんでした。";
      setError(message);
      toast.error(message);
    }
  };

  const period = result.hood
    ? `${result.hood.startDate || "?"}〜${result.hood.endDate || "?"}`
    : null;

  return (
    <section className="mx-auto w-full max-w-3xl px-4">
      <div className="rounded-xl border border-border bg-surface p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <FileJson className="size-5" />
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold">公式レポートを足す</h3>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              自分の Under the Hood だけ使えます。JSON はこの端末の中で読み、サーバーには送りません。検索BANは分かりません。
            </p>
          </div>
        </div>

        <ol className="mt-4 space-y-2 text-xs leading-relaxed text-muted">
          <li>1. X にログインした状態でレポートを開く（1年以上、かつ先月10ポスト以上）</li>
          <li>2. 「Download this report (JSON)」を保存する</li>
          <li>3. 下のボタンで、今見ている @{result.username} の本人ファイルを選ぶ</li>
        </ol>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <a
            href="https://x.com/i/jf/under_the_hood"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-border bg-elevated px-4 text-sm font-medium"
          >
            レポートを開く
            <ExternalLink className="size-4" />
          </a>
          <Button type="button" className="sm:flex-1" onClick={() => fileRef.current?.click()}>
            JSONを選ぶ
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json,text/plain"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (!file) return;
              void file.text().then(read);
            }}
          />
        </div>

        <button
          type="button"
          className="mt-3 text-xs text-primary hover:underline"
          onClick={() => setOpenPaste((value) => !value)}
        >
          {openPaste ? "貼り付けを閉じる" : "ファイルが選べないときは貼り付け"}
        </button>
        {openPaste ? (
          <div className="mt-2 space-y-2">
            <textarea
              value={paste}
              onChange={(event) => setPaste(event.target.value)}
              rows={4}
              placeholder='{"period": ... }'
              className="w-full resize-y rounded-lg border border-border bg-bg px-3 py-2 font-mono text-xs"
            />
            <Button type="button" variant="secondary" className="w-full" onClick={() => read(paste)}>
              貼り付けたJSONを反映
            </Button>
          </div>
        ) : null}

        {error ? <p className="mt-3 text-xs text-ban">{error}</p> : null}

        {result.hood ? (
          <div className="mt-4 border-t border-border pt-4">
            <p className="text-xs text-muted">
              反映済み · {period} · ポスト {result.hood.postCount.toLocaleString()} 件
              {result.hood.labels.length ? "" : " · ラベルなし"}
            </p>
            {result.hood.labels.length ? (
              <ul className="mt-3 space-y-2">
                {result.hood.labels.map((label) => (
                  <LabelRow key={`${label.scope}-${label.code}`} label={label} />
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm">この期間の表示制限ラベルはありません。</p>
            )}
          </div>
        ) : null}
      </div>
    </section>
  );
}
