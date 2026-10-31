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
  /** 本人が読み込んだ Under the Hood JSON。他人のアカウントには紐づかない。 */
  hood?: HoodReport;
}

export interface HoodLabel {
  scope: "post" | "account";
  code: string;
  about: string;
  effect: string;
  stat: string;
  postIds: string[];
  morePosts: number;
}

export interface HoodReport {
  startDate: string;
  endDate: string;
  generatedAt: string;
  postCount: number;
  labels: HoodLabel[];
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
