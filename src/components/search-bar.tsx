import { useState, type FormEvent } from "react";
import { ArrowRight, AtSign, LoaderCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { HistoryItem } from "@/lib/types";

const SAMPLE_HANDLES = ["XDevelopers", "elonmusk", "yabetchi_iPhone"];
const TEST_HANDLES = ["test_ban", "test_deboost", "test_ghost"];

export function SearchBar({
  onSearch,
  isLoading,
  loadingStep,
  history,
}: {
  onSearch: (username: string) => void;
  isLoading: boolean;
  loadingStep: string;
  history: HistoryItem[];
}) {
  const [value, setValue] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!value.trim() || isLoading) return;
    onSearch(value);
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4">
      <form
        onSubmit={submit}
        className="shadow-card space-y-4 rounded-xl border border-border bg-surface p-5 sm:p-6"
      >
        <label htmlFor="x-handle" className="block text-sm font-medium text-fg">
          X ユーザー名
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <AtSign className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-primary" />
            <Input
              id="x-handle"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="ユーザー名、または x.com のURL"
              disabled={isLoading}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              className="h-12 pr-10 pl-10 font-mono"
            />
            {value && !isLoading ? (
              <button
                type="button"
                onClick={() => setValue("")}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-subtle hover:text-fg"
                aria-label="クリア"
              >
                <X className="size-4" />
              </button>
            ) : null}
          </div>
          <Button type="submit" disabled={!value.trim() || isLoading} className="h-12 sm:w-36">
            {isLoading ? (
              <>
                <LoaderCircle className="size-4 animate-spin" />
                診断中
              </>
            ) : (
              <>
                チェック
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-3 py-3">
            <LoaderCircle className="size-4 shrink-0 animate-spin text-primary" />
            <div>
              <p className="text-xs font-medium text-fg">{loadingStep}</p>
              <p className="mt-0.5 text-xs text-muted">
                公開プロフィールを取得し、4項目の制限サインを照合しています
              </p>
            </div>
          </div>
        ) : null}

        <div className="space-y-2 border-t border-border pt-3 text-xs">
          <div className="flex flex-wrap items-center gap-1.5 text-muted">
            <span className="text-subtle">サンプル</span>
            {SAMPLE_HANDLES.map((handle) => (
              <button
                key={handle}
                type="button"
                disabled={isLoading}
                onClick={() => {
                  setValue(handle);
                  onSearch(handle);
                }}
                className="rounded-md bg-elevated px-2.5 py-1 font-mono text-fg hover:bg-elevated/80 disabled:opacity-50"
              >
                @{handle}
              </button>
            ))}
          </div>
          {history.length > 0 ? (
            <div className="flex flex-wrap items-center gap-1.5 text-muted">
              <span className="text-subtle">最近</span>
              {history.slice(0, 3).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  disabled={isLoading}
                  onClick={() => onSearch(item.username)}
                  className="rounded-md bg-elevated px-2 py-1 font-mono hover:bg-elevated/80"
                >
                  @{item.username}
                </button>
              ))}
            </div>
          ) : null}
          <div className="flex flex-wrap items-center gap-1.5 text-muted">
            <span className="text-subtle">BAN状態のデモ</span>
            {TEST_HANDLES.map((handle) => (
              <button
                key={handle}
                type="button"
                disabled={isLoading}
                onClick={() => {
                  setValue(handle);
                  onSearch(handle);
                }}
                className="rounded-md border border-ban/20 bg-ban/10 px-2 py-1 font-mono text-ban hover:bg-ban/15"
              >
                @{handle}
              </button>
            ))}
          </div>
        </div>
      </form>
    </div>
  );
}
