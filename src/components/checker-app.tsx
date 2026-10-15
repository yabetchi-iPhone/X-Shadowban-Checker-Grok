import { useEffect, useState } from "react";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import { Toaster, toast } from "sonner";
import { BanStatusCards } from "@/components/ban-status-cards";
import { Footer } from "@/components/footer";
import { GrokDiagnosis } from "@/components/grok-diagnosis";
import { Header } from "@/components/header";
import { HistoryDrawer } from "@/components/history-drawer";
import { KnowledgeSection } from "@/components/knowledge-section";
import { ProfileCard } from "@/components/profile-card";
import { SearchBar } from "@/components/search-bar";
import { ThemeProvider, useTheme } from "@/components/theme";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import {
  checkAccount,
  clearCheckHistory,
  listCheckHistory,
  saveCheckHistory,
} from "@/lib/server-fns";
import type { CheckResult, HistoryItem } from "@/lib/types";
import { applySearchVerdict } from "@/lib/score";

const STEPS = [
  "1/3 公開プロフィールを取得しています…",
  "2/3 フォロワーとポスト数を照合しています…",
  "3/3 検索BANは別アカウントの最新タブで確定します…",
];

const HISTORY_KEY = "x_shadowban_history";

function toHistoryItem(data: CheckResult): HistoryItem {
  return {
    id: `${Date.now()}-${data.username}`,
    username: data.username,
    displayName: data.displayName,
    overallStatus: data.overallStatus,
    overallHealthScore: data.overallHealthScore,
    checkedAt: data.checkedAt,
  };
}

function CheckerInner() {
  const { theme } = useTheme();
  const { user, isPending } = useCurrentUserState();
  const [result, setResult] = useState<CheckResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(HISTORY_KEY);
      if (saved) setHistory(JSON.parse(saved) as HistoryItem[]);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch {
      /* ignore */
    }
  }, [history]);

  useEffect(() => {
    if (isPending || !user) return;
    void listCheckHistory()
      .then((rows) => {
        if (!rows?.length) return;
        setHistory((prev) => {
          const map = new Map<string, HistoryItem>();
          for (const item of [...rows, ...prev]) {
            if (!map.has(item.username)) map.set(item.username, item);
          }
          return [...map.values()]
            .sort((a, b) => +new Date(b.checkedAt) - +new Date(a.checkedAt))
            .slice(0, 20);
        });
      })
      .catch(() => {
        /* signed-out or db not ready */
      });
  }, [user, isPending]);

  const remember = (item: HistoryItem) => {
    setHistory((prev) => {
      const next = [item, ...prev.filter((h) => h.username !== item.username)].slice(0, 20);
      return next;
    });
    if (user) {
      void saveCheckHistory({ data: item }).catch(() => {
        /* local history still kept */
      });
    }
  };

  const handleSearch = async (username: string) => {
    setLoading(true);
    setError(null);
    setResult(null);
    let i = 0;
    setStep(STEPS[0]);
    const timer = window.setInterval(() => {
      i += 1;
      if (i < STEPS.length) setStep(STEPS[i] ?? STEPS[STEPS.length - 1]);
    }, 420);

    try {
      const data = await checkAccount({ data: { username } });
      setResult(data);
      remember(toHistoryItem(data));
      window.setTimeout(() => {
        document.getElementById("results")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    } catch (err) {
      const message = err instanceof Error ? err.message : "接続エラーが発生しました。";
      setError(message);
      toast.error(message);
    } finally {
      window.clearInterval(timer);
      setLoading(false);
    }
  };

  const handleSearchVerdict = (banned: boolean) => {
    if (!result) return;
    const next = applySearchVerdict(result, banned);
    setResult(next);
    remember(toHistoryItem(next));
    toast.success(banned ? "検索BANとして記録しました" : "検索OKとして記録しました");
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(HISTORY_KEY);
    if (user) void clearCheckHistory().catch(() => {});
  };

  return (
    <div className="flex min-h-dvh flex-col bg-bg text-fg">
      <Toaster theme={theme} position="bottom-center" />
      <Header
        onOpenHistory={() => setHistoryOpen(true)}
        onOpenHelp={() =>
          document.getElementById("knowledge-section")?.scrollIntoView({ behavior: "smooth" })
        }
      />

      <main className="flex-1 pb-12">
        <div className="mx-auto max-w-3xl space-y-3 px-4 pt-8 pb-5 text-center">
          <div className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <ShieldCheck className="size-3.5" />
            X シャドウバン判定 · Grok edition
          </div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            そのポスト、届いてますか？
          </h1>
          <p className="mx-auto max-w-xl text-sm text-muted">
            プロフィールは実測、診断は Grok 4.7。検索BANは別アカウントの最新タブで確定します。
          </p>
        </div>

        <SearchBar
          onSearch={(u) => void handleSearch(u)}
          isLoading={loading}
          loadingStep={step}
          history={history}
        />

        {error ? (
          <div className="mx-auto mt-4 max-w-3xl px-4">
            <div className="flex items-start gap-3 rounded-xl border border-ban/30 bg-ban/10 p-4 text-sm">
              <AlertTriangle className="mt-0.5 size-5 shrink-0 text-ban" />
              <span>{error}</span>
            </div>
          </div>
        ) : null}

        {result ? (
          <div id="results" className="mt-8 space-y-6 animate-fade-up">
            <ProfileCard result={result} />
            <BanStatusCards result={result} onSearchVerdict={handleSearchVerdict} />
            <GrokDiagnosis key={result.checkedAt} result={result} />
          </div>
        ) : null}

        <div className="mt-12">
          <KnowledgeSection />
        </div>
      </main>

      <HistoryDrawer
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        history={history}
        onSelect={(u) => void handleSearch(u)}
        onClear={clearHistory}
      />
      <Footer />
    </div>
  );
}

export function CheckerApp() {
  return (
    <ThemeProvider>
      <CheckerInner />
    </ThemeProvider>
  );
}
