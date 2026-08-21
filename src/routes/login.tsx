import { createFileRoute, Link } from "@tanstack/react-router";
import { GROK_PROVIDERS, authEnabled, signIn } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/login")({ component: Login });

function XMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden>
      <path d="M17.3 3H20.2L13.7 10.4 21.5 21h-6.3l-4.5-6.3L5.7 21H2.8l7-8.9L2.5 3h6.4l4.1 5.8L17.3 3Zm-1.1 16.2h1.6L7.9 4.7H6.2l10 14.5Z" />
    </svg>
  );
}

function Login() {
  const ordered = [...GROK_PROVIDERS].sort((a, b) =>
    a.idp === "twitter" ? -1 : b.idp === "twitter" ? 1 : 0,
  );

  return (
    <main className="grid min-h-dvh place-items-center bg-bg px-5 py-12 text-fg">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-3">
          <div className="flex size-11 items-center justify-center rounded-lg bg-primary text-primary-fg">
            <ShieldCheck className="size-5" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">サインイン</h1>
          <p className="text-sm leading-relaxed text-muted">
            履歴の同期に使います。アカウント診断そのものはログインなしで実行できます。
          </p>
        </div>

        {authEnabled ? (
          <div className="space-y-2">
            {ordered.map((p) => (
              <Button
                key={p.providerId}
                type="button"
                variant={p.idp === "twitter" ? "inverse" : "secondary"}
                className="w-full"
                onClick={() => signIn(p.providerId, { callbackURL: "/" })}
              >
                {p.idp === "twitter" ? <XMark /> : null}
                {p.label} で続ける
              </Button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">サインインは無効です。</p>
        )}

        <Link to="/" className="block text-sm text-muted underline-offset-4 hover:text-fg hover:underline">
          ログインせずにチェッカーへ戻る
        </Link>
      </div>
    </main>
  );
}
