export type CheckItemStatus = "ok" | "ban" | "deboosted" | "unknown";
export type CheckMethod = "observed" | "estimated" | "fixture";

export interface CheckItem {
  status: CheckItemStatus;
  label: string;
  description: string;
  method: CheckMethod;
}

export type OverallStatus =
  | "ALL_CLEAR"
  | "WARNING"
  | "BAN_DETECTED"
  | "SUSPENDED"
  | "NOT_FOUND"
  | "NEEDS_REVIEW";

export interface ProfileSignal {
  id: string;
  label: string;
  detail: string;
  tone: "info" | "warn" | "ok";
}

export interface CheckResult {
  username: string;
  exists: boolean;
  isProtected: boolean;
  isSuspended: boolean;
  isVerified: boolean;
  displayName: string;
  bio: string;
  avatarUrl: string;
  bannerUrl: string | null;
  followersCount: number;
  followingCount: number;
  tweetCount: number;
  joined: string | null;
  checks: {
    profileVisible: CheckItem;
    searchBan: CheckItem;
    searchSuggestionBan: CheckItem;
    ghostBan: CheckItem;
    replyDeboosting: CheckItem;
  };
  signals: ProfileSignal[];
  overallHealthScore: number;
  overallStatus: OverallStatus;
  checkedAt: string;
  source: "fxtwitter" | "fixture" | "limited";
}

export interface AIDiagnosis {
  riskLevel: string;
  summary: string;
  possibleCauses: string[];
  recoveryPlan: string[];
  estimatedRecoveryTime: string;
  preventionTips: string[];
}

export interface HistoryItem {
  id: string;
  username: string;
  displayName: string;
  overallStatus: OverallStatus;
  overallHealthScore: number;
  checkedAt: string;
}
