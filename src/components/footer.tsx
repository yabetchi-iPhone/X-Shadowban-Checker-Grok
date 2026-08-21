import { ShieldCheck } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border py-10">
      <div className="mx-auto max-w-3xl space-y-3 px-4 text-center">
        <p className="inline-flex items-center gap-2 text-sm font-medium">
          <ShieldCheck className="size-4 text-primary" />
          X Shadowban Checker
        </p>
        <p className="text-xs leading-relaxed text-muted">
          X Corp. の公式サービスではありません。公開データと推定モデルに基づく診断であり、アルゴリズム更新で結果は変わります。
        </p>
        <p className="font-mono text-[11px] text-subtle">
          © {new Date().getFullYear()} · Grok edition
        </p>
      </div>
    </footer>
  );
}
