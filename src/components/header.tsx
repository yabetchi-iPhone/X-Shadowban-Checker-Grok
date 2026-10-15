import { Link } from "@tanstack/react-router";
import { HelpCircle, History, Moon, ShieldCheck, Sun } from "lucide-react";
import { signOut } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme";

export function Header({
  onOpenHistory,
  onOpenHelp,
}: {
  onOpenHistory: () => void;
  onOpenHelp: () => void;
}) {
  const { theme, toggle } = useTheme();
  const { user, isPending } = useCurrentUserState();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4">
        <Link to="/" className="flex min-w-0 items-center gap-3 text-fg">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-fg">
            <ShieldCheck className="size-5" />
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-sm font-semibold tracking-tight sm:text-base">
              X Shadowban Checker
            </span>
            <span className="hidden text-xs text-muted sm:block">Grok 4.7 による可視化診断</span>
          </span>
        </Link>

        <div className="flex shrink-0 items-center gap-1">
          <Button variant="ghost" size="sm" onClick={onOpenHelp} className="hidden sm:inline-flex">
            <HelpCircle className="size-4" />
            FAQ
          </Button>
          <Button variant="ghost" size="icon" onClick={onOpenHelp} className="sm:hidden" aria-label="解説">
            <HelpCircle className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onOpenHistory} aria-label="履歴">
            <History className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            aria-label={theme === "dark" ? "ライトモード" : "ダークモード"}
          >
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </Button>
          {isPending ? (
            <div className="size-8 animate-pulse rounded-full bg-elevated" />
          ) : user ? (
            <div className="flex items-center gap-2 pl-1">
              {user.profileImageUrl ? (
                <img
                  src={user.profileImageUrl}
                  alt=""
                  className="size-8 rounded-full object-cover"
                />
              ) : (
                <span className="grid size-8 place-items-center rounded-full bg-elevated text-xs font-medium">
                  {(user.displayName ?? "U").charAt(0).toUpperCase()}
                </span>
              )}
              <button
                type="button"
                onClick={() => void signOut()}
                className="text-xs text-muted underline-offset-4 hover:text-fg hover:underline"
              >
                サインアウト
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="inline-flex h-9 items-center rounded-md px-3 text-xs font-medium text-muted hover:bg-elevated hover:text-fg"
            >
              サインイン
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
