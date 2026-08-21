import { ArrowRight, Clock, Trash2, X } from "lucide-react";
import type { HistoryItem, OverallStatus } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function pill(status: OverallStatus) {
  if (status === "ALL_CLEAR") return <Badge tone="ok">ALL CLEAR</Badge>;
  if (status === "WARNING") return <Badge tone="warn">WARNING</Badge>;
  if (status === "BAN_DETECTED") return <Badge tone="ban">BAN</Badge>;
  return <Badge tone="neutral">{status}</Badge>;
}

export function HistoryDrawer({
  isOpen,
  onClose,
  history,
  onSelect,
  onClear,
}: {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  onSelect: (username: string) => void;
  onClear: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-bg/50 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="flex h-full w-full max-w-md flex-col border-l border-border bg-surface"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="診断履歴"
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-4">
          <div className="flex items-center gap-2">
            <Clock className="size-4 text-primary" />
            <h3 className="font-semibold">診断履歴</h3>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="閉じる">
            <X className="size-4" />
          </Button>
        </div>
        <div className="flex-1 space-y-2 overflow-y-auto p-4">
          {history.length === 0 ? (
            <p className="py-12 text-center text-xs text-muted">まだ履歴はありません。</p>
          ) : (
            history.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelect(item.username);
                  onClose();
                }}
                className="flex w-full items-center justify-between gap-3 rounded-lg border border-border bg-elevated/40 p-3 text-left hover:bg-elevated"
              >
                <div>
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-medium">@{item.username}</span>
                    {pill(item.overallStatus)}
                  </div>
                  <p className="text-[11px] text-subtle">
                    {item.overallHealthScore}/100 · {new Date(item.checkedAt).toLocaleDateString()}
                  </p>
                </div>
                <ArrowRight className="size-4 text-subtle" />
              </button>
            ))
          )}
        </div>
        {history.length > 0 ? (
          <div className="flex items-center justify-between border-t border-border p-4">
            <button
              type="button"
              onClick={onClear}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-ban hover:underline"
            >
              <Trash2 className="size-4" />
              すべて削除
            </button>
            <Button variant="secondary" size="sm" onClick={onClose}>
              閉じる
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
