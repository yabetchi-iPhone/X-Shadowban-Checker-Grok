import type {
  CheckItem,
  CheckItemStatus,
  CheckResult,
  ProfileSignal,
} from "./types";
import { summarizeChecks } from "./score";

const FX_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

interface FxUser {
  screen_name: string;
  name: string;
  description?: string;
  avatar_url?: string;
  banner_url?: string;
  followers?: number;
  following?: number;
  tweets?: number;
  joined?: string;
  protected?: boolean;
  verification?: { verified?: boolean };
}

const checkCache = new Map<string, { at: number; data: CheckResult }>();
const CACHE_MS = 45_000;

export function normalizeHandle(input: string): string {
  let s = input.trim();
  s = s.replace(/^https?:\/\/(www\.)?(x\.com|twitter\.com)\//i, "");
  s = s.replace(/^@/, "");
  s = s.split(/[/?#]/)[0] ?? s;
  return s.trim();
}

function item(
  status: CheckItem["status"],
  label: string,
  description: string,
  method: CheckItem["method"],
): CheckItem {
  return { status, label, description, method };
}

function fixtureResult(handle: string): CheckResult | null {
  const key = handle.toLowerCase();
  let searchBan = false;
  let suggestionBan = false;
  let ghostBan = false;
  let deboost = false;
  let suspended = false;

  if (key.includes("test_searchban") || key.includes("test_ban")) {
    searchBan = true;
    ghostBan = true;
  } else if (key.includes("test_deboost") || key.includes("test_warn")) {
    suggestionBan = true;
    deboost = true;
  } else if (key.includes("test_ghost")) {
    ghostBan = true;
  } else if (key.includes("test_suspended")) {
    searchBan = true;
    suggestionBan = true;
    ghostBan = true;
    deboost = true;
    suspended = true;
  } else {
    return null;
  }

  return buildResult({
    username: handle,
    exists: !suspended,
    isProtected: false,
    isSuspended: suspended,
    isVerified: false,
    displayName: handle,
    bio: "フィクスチャアカウント（UI確認用）",
    avatarUrl: `https://api.dicebear.com/9.x/identicon/svg?seed=${encodeURIComponent(handle)}`,
    bannerUrl: null,
    followersCount: 0,
    followingCount: 0,
    tweetCount: 0,
    joined: null,
    searchBan,
    suggestionBan,
    ghostBan,
    deboost,
    source: "fixture",
    method: "fixture",
    signals: [
      {
        id: "fixture",
        label: "テスト用ハンドル",
        detail: "実在アカウントではなく、BAN状態のUIを確認するための入力です。",
        tone: "info",
      },
    ],
  });
}

function flagStatus(
  flag: boolean | null,
  exists: boolean,
  suspended: boolean,
): CheckItemStatus {
  if (flag === true) return "ban";
  if (flag === false && exists && !suspended) return "ok";
  return "unknown";
}

function buildResult(input: {
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
  searchBan: boolean | null;
  suggestionBan: boolean | null;
  ghostBan: boolean | null;
  deboost: boolean | null;
  source: CheckResult["source"];
  method: CheckItem["method"];
  signals: ProfileSignal[];
}): CheckResult {
  const searchStatus = flagStatus(input.searchBan, input.exists, input.isSuspended);
  const suggestionStatus = flagStatus(input.suggestionBan, input.exists, input.isSuspended);
  const ghostStatus = flagStatus(input.ghostBan, input.exists, input.isSuspended);
  const deboostStatus: CheckItemStatus =
    input.deboost === true
      ? "deboosted"
      : input.deboost === false && input.exists && !input.isSuspended
        ? "ok"
        : "unknown";
  const { score, status } = summarizeChecks({
    exists: input.exists,
    isSuspended: input.isSuspended,
    search: searchStatus,
    suggestion: suggestionStatus,
    ghost: ghostStatus,
    deboost: deboostStatus,
  });
  const searchUnknown =
    input.tweetCount > 0
      ? `ポストは${input.tweetCount.toLocaleString()}件あります。自分のログインではBANでも自分のポストが見えます。フォローしていない別アカウントで最新タブ from:${input.username} を開き、結果がゼロなら検索BANです。`
      : "ポストが確認できないため、検索面は未確定です。";

  return {
    username: input.username,
    exists: input.exists,
    isProtected: input.isProtected,
    isSuspended: input.isSuspended,
    isVerified: input.isVerified,
    displayName: input.displayName,
    bio: input.bio,
    avatarUrl: input.avatarUrl,
    bannerUrl: input.bannerUrl,
    followersCount: input.followersCount,
    followingCount: input.followingCount,
    tweetCount: input.tweetCount,
    joined: input.joined,
    signals: input.signals,
    overallHealthScore: score,
    overallStatus: status,
    checkedAt: new Date().toISOString(),
    source: input.source,
    checks: {
      profileVisible: item(
        !input.exists
          ? "ban"
          : input.isSuspended
            ? "ban"
            : input.isProtected
              ? "unknown"
              : "ok",
        "プロフィール公開",
        !input.exists
          ? "アカウントが見つかりませんでした。"
          : input.isSuspended
            ? "凍結、または公開タイムラインを取得できません。"
            : input.isProtected
              ? "鍵アカウントです。第三者からの検索・リプライ確認は限定されます。"
              : "公開プロフィールを確認できました。",
        input.source === "fxtwitter" ? "observed" : input.method,
      ),
      searchBan: item(
        searchStatus,
        "検索BAN (Search Ban)",
        searchStatus === "ban"
          ? "検索結果（話題・最新）にポストが出ない状態です。"
          : searchStatus === "ok"
            ? "別アカウントの最新タブにポストが出ています。"
            : searchUnknown,
        searchStatus === "unknown" ? "estimated" : input.method,
      ),
      searchSuggestionBan: item(
        suggestionStatus,
        "検索補完BAN (Suggestion Ban)",
        suggestionStatus === "ban"
          ? "検索窓のサジェスト候補に表示されません。"
          : suggestionStatus === "ok"
            ? "検索候補にアカウントが出ます。"
            : "サジェストは別アカウントの検索窓で確認してください。途中までIDを入れて候補に出なければ補完BANです。",
        suggestionStatus === "unknown" ? "estimated" : input.method,
      ),
      ghostBan: item(
        ghostStatus,
        "ゴーストBAN (Ghost / Thread Ban)",
        ghostStatus === "ban"
          ? "リプライが第三者から完全に非表示になっている状態です。"
          : ghostStatus === "ok"
            ? "リプライは第三者にも見えています。"
            : "ゴーストBANは、フォローしていない第三者にリプライが見えるかで判定します。自動では確定できません。",
        ghostStatus === "unknown" ? "estimated" : input.method,
      ),
      replyDeboosting: item(
        deboostStatus,
        "リプライ降格 (Reply Deboosting)",
        deboostStatus === "deboosted"
          ? "リプライが「さらに表示」や不適切折りたたみへ押し込まれています。"
          : deboostStatus === "ok"
            ? "リプライ降格の強い兆候はありません。"
            : "リプライが「さらに表示」の中に埋まっていないかは、相手の投稿を別アカウントで開いて確認してください。",
        deboostStatus === "unknown" ? "estimated" : input.method,
      ),
    },
  };
}

function collectSignals(user: FxUser): ProfileSignal[] {
  const signals: ProfileSignal[] = [];
  const bio = user.description ?? "";
  const hashCount = (bio.match(/#/g) ?? []).length;
  const followers = user.followers ?? 0;
  const following = user.following ?? 0;
  const tweets = user.tweets ?? 0;

  if (user.verification?.verified) {
    signals.push({
      id: "verified",
      label: "認証済み",
      detail: "認証バッジのある公開アカウントです。",
      tone: "ok",
    });
  }
  if (user.protected) {
    signals.push({
      id: "protected",
      label: "鍵アカウント",
      detail: "非公開のため検索・リプライ面の外部検証は限定されます。",
      tone: "warn",
    });
  }
  if (hashCount >= 4) {
    signals.push({
      id: "bio-hashtags",
      label: "bioのハッシュタグが多い",
      detail: `プロフィールにハッシュタグが${hashCount}個あります。補完BANの誤判定材料になることがあります。`,
      tone: "warn",
    });
  }
  if (following >= 400 && followers > 0 && following > followers * 2.5) {
    signals.push({
      id: "follow-ratio",
      label: "フォロー比が高い",
      detail: `フォロー ${following.toLocaleString()} / フォロワー ${followers.toLocaleString()}。短期間の大量フォローは制限の典型因です。`,
      tone: "warn",
    });
  }
  if (tweets === 0) {
    signals.push({
      id: "no-tweets",
      label: "ポストが確認できない",
      detail: "ポスト数が0、または取得できませんでした。",
      tone: "info",
    });
  }
  if (tweets > 0 && followers < 20 && tweets > 400) {
    signals.push({
      id: "high-volume-new",
      label: "フォロワーに対して投稿が多い",
      detail: "初期〜小規模アカウントの高頻度投稿はスパムフィルターに引っかかりやすいです。",
      tone: "warn",
    });
  }
  if (signals.length === 0) {
    signals.push({
      id: "clean",
      label: "公開シグナルは安定",
      detail: "bio・フォロー比・公開状態に目立った危険サインはありません。",
      tone: "ok",
    });
  }
  return signals;
}

function upgradeAvatar(url: string | undefined, handle: string): string {
  if (!url) {
    return `https://unavatar.io/twitter/${encodeURIComponent(handle)}`;
  }
  return url.replace("_normal.", "_400x400.");
}

async function fetchFxUser(handle: string): Promise<FxUser | null> {
  const res = await fetch(
    `https://api.fxtwitter.com/${encodeURIComponent(handle)}`,
    {
      headers: {
        "User-Agent": FX_UA,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(8000),
      redirect: "follow",
    },
  );
  if (!res.ok) return null;
  const body = (await res.json()) as {
    code?: number;
    user?: FxUser;
  };
  if (body.code !== 200 || !body.user?.screen_name) return null;
  if (body.user.screen_name.toLowerCase() !== handle.toLowerCase()) return null;
  return body.user;
}

export async function performXCheck(raw: string): Promise<CheckResult> {
  const handle = normalizeHandle(raw);
  if (!handle || !/^[a-zA-Z0-9_]{1,15}$/.test(handle)) {
    throw new Error(
      "有効なXユーザー名を入力してください（@なし、1〜15文字の英数字とアンダースコア）。URLの貼り付けも可。",
    );
  }

  const cached = checkCache.get(handle.toLowerCase());
  if (cached && Date.now() - cached.at < CACHE_MS) {
    return cached.data;
  }

  const fixture = fixtureResult(handle);
  if (fixture) {
    checkCache.set(handle.toLowerCase(), { at: Date.now(), data: fixture });
    return fixture;
  }

  let user: FxUser | null = null;
  try {
    user = await fetchFxUser(handle);
  } catch (err) {
    console.warn("fxtwitter fetch failed:", err);
  }

  if (!user) {
    const missing = buildResult({
      username: handle,
      exists: false,
      isProtected: false,
      isSuspended: false,
      isVerified: false,
      displayName: handle,
      bio: "",
      avatarUrl: `https://api.dicebear.com/9.x/identicon/svg?seed=${encodeURIComponent(handle)}`,
      bannerUrl: null,
      followersCount: 0,
      followingCount: 0,
      tweetCount: 0,
      joined: null,
      searchBan: false,
      suggestionBan: false,
      ghostBan: false,
      deboost: false,
      source: "limited",
      method: "estimated",
      signals: [
        {
          id: "not-found",
          label: "プロフィール未検出",
          detail: "公開APIからアカウントを取得できませんでした。存在しない、凍結、または一時的な取得失敗の可能性があります。",
          tone: "warn",
        },
      ],
    });
    checkCache.set(handle.toLowerCase(), { at: Date.now(), data: missing });
    return missing;
  }

  const result = buildResult({
    username: user.screen_name,
    exists: true,
    isProtected: Boolean(user.protected),
    isSuspended: false,
    isVerified: Boolean(user.verification?.verified),
    displayName: user.name || user.screen_name,
    bio: user.description ?? "",
    avatarUrl: upgradeAvatar(user.avatar_url, user.screen_name),
    bannerUrl: user.banner_url ?? null,
    followersCount: user.followers ?? 0,
    followingCount: user.following ?? 0,
    tweetCount: user.tweets ?? 0,
    joined: user.joined ?? null,
    searchBan: null,
    suggestionBan: null,
    ghostBan: null,
    deboost: null,
    source: "fxtwitter",
    method: "estimated",
    signals: collectSignals(user),
  });

  checkCache.set(handle.toLowerCase(), { at: Date.now(), data: result });
  return result;
}
