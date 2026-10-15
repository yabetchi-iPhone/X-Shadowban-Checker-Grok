import type { CheckItemStatus, CheckResult, OverallStatus } from "./types";

export function summarizeChecks(opts: {
  exists: boolean;
  isSuspended: boolean;
  search: CheckItemStatus;
  suggestion: CheckItemStatus;
  ghost: CheckItemStatus;
  deboost: CheckItemStatus;
}): { score: number; status: OverallStatus } {
  if (!opts.exists && !opts.isSuspended) {
    return { score: 0, status: "NOT_FOUND" };
  }
  if (opts.isSuspended) return { score: 0, status: "SUSPENDED" };

  let score = 100;
  if (opts.search === "ban") score -= 40;
  else if (opts.search === "unknown") score -= 15;
  if (opts.ghost === "ban") score -= 35;
  else if (opts.ghost === "unknown") score -= 10;
  if (opts.suggestion === "ban") score -= 15;
  else if (opts.suggestion === "unknown") score -= 5;
  if (opts.deboost === "deboosted") score -= 10;
  else if (opts.deboost === "unknown") score -= 5;

  if (opts.search === "ban" || opts.ghost === "ban") {
    return { score: Math.max(0, score), status: "BAN_DETECTED" };
  }
  if (opts.suggestion === "ban" || opts.deboost === "deboosted") {
    return { score: Math.max(0, score), status: "WARNING" };
  }
  if (
    opts.search === "unknown" ||
    opts.ghost === "unknown" ||
    opts.suggestion === "unknown" ||
    opts.deboost === "unknown"
  ) {
    return { score: Math.max(0, score), status: "NEEDS_REVIEW" };
  }
  return { score: Math.max(0, score), status: "ALL_CLEAR" };
}

export function applySearchVerdict(result: CheckResult, banned: boolean): CheckResult {
  const searchBan = {
    ...result.checks.searchBan,
    status: (banned ? "ban" : "ok") as CheckItemStatus,
    method: "observed" as const,
    description: banned
      ? "別アカウントの最新タブで from: の結果がゼロでした。検索BANです。"
      : "別アカウントの最新タブにポストが出ました。検索BANではありません。",
  };
  const checks = { ...result.checks, searchBan };
  const { score, status } = summarizeChecks({
    exists: result.exists,
    isSuspended: result.isSuspended,
    search: checks.searchBan.status,
    suggestion: checks.searchSuggestionBan.status,
    ghost: checks.ghostBan.status,
    deboost: checks.replyDeboosting.status,
  });
  return {
    ...result,
    checks,
    overallHealthScore: score,
    overallStatus: status,
    checkedAt: new Date().toISOString(),
  };
}
