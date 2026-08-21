import { useState } from "react";
import { BookOpen, ChevronDown, HelpCircle, Search, ShieldAlert } from "lucide-react";
import { BAN_TYPE_GUIDES, FAQ_LIST } from "@/lib/shadowban-knowledge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";

export function KnowledgeSection() {
  const [tab, setTab] = useState<"guides" | "faq">("guides");
  const [openId, setOpenId] = useState<string | null>("1");
  const [query, setQuery] = useState("");

  const faqs = FAQ_LIST.filter(
    (item) =>
      item.question.toLowerCase().includes(query.toLowerCase()) ||
      item.answer.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <section id="knowledge-section" className="mx-auto w-full max-w-3xl px-4">
      <div className="shadow-card rounded-xl border border-border bg-surface p-5 sm:p-6">
        <div className="flex flex-col gap-4 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-lg bg-elevated text-primary">
              <BookOpen className="size-4" />
            </span>
            <div>
              <h3 className="font-semibold">ナレッジ / FAQ</h3>
              <p className="text-xs text-muted">4種の制限の仕組みと、自分でできる確認方法</p>
            </div>
          </div>
          <div className="flex rounded-lg bg-elevated p-1">
            <button
              type="button"
              onClick={() => setTab("guides")}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium",
                tab === "guides" ? "bg-surface text-fg shadow-sm" : "text-muted",
              )}
            >
              4種の解説
            </button>
            <button
              type="button"
              onClick={() => setTab("faq")}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium",
                tab === "faq" ? "bg-surface text-fg shadow-sm" : "text-muted",
              )}
            >
              FAQ
            </button>
          </div>
        </div>

        {tab === "guides" ? (
          <div className="mt-5 space-y-4">
            {BAN_TYPE_GUIDES.map((guide) => (
              <article key={guide.key} className="space-y-3 rounded-lg border border-border bg-elevated/40 p-4">
                <div className="flex items-center justify-between gap-3">
                  <h4 className="flex items-center gap-2 text-sm font-semibold">
                    <ShieldAlert className="size-4 text-primary" />
                    {guide.japaneseTitle}
                  </h4>
                  <span className="rounded-full bg-elevated px-2 py-0.5 text-[10px] font-medium text-muted">
                    制限レベル {guide.severity}
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-muted">{guide.description}</p>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="rounded-md border border-border bg-surface p-3 text-xs">
                    <p className="mb-1 font-medium text-ban">主な症状</p>
                    <ul className="list-disc space-y-1 pl-4 text-muted">
                      {guide.symptoms.map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-md border border-border bg-surface p-3 text-xs">
                    <p className="mb-1 font-medium text-warn">解除アクション</p>
                    <p className="text-muted">{guide.quickFix}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="キーワードで検索"
                className="pl-9"
              />
            </div>
            {faqs.map((faq) => {
              const open = openId === faq.id;
              return (
                <div key={faq.id} className="overflow-hidden rounded-lg border border-border">
                  <button
                    type="button"
                    onClick={() => setOpenId(open ? null : faq.id)}
                    className="flex w-full items-center justify-between gap-3 bg-elevated/50 px-4 py-3 text-left text-sm font-medium"
                  >
                    <span className="flex items-start gap-2">
                      <HelpCircle className="mt-0.5 size-4 shrink-0 text-primary" />
                      {faq.question}
                    </span>
                    <ChevronDown className={cn("size-4 shrink-0 text-subtle transition-transform", open && "rotate-180")} />
                  </button>
                  {open ? (
                    <div className="whitespace-pre-line border-t border-border px-4 py-3 text-xs leading-relaxed text-muted">
                      {faq.answer}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
