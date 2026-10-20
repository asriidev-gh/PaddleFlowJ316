export type FaqAction = {
  label: string;
  href: string;
};

export type FaqEntry = {
  id: string;
  question: string;
  answer: string;
  /** Extra words/phrases users might type that the question text doesn't contain. */
  keywords: string[];
  action?: FaqAction;
  /** Show as a suggestion chip when the chat opens. */
  featured?: boolean;
};

export const FAQ_ENTRIES: FaqEntry[] = [
  {
    id: "quick-vs-live",
    question: "What's the difference between a Quick Game and a Live Queueing game?",
    answer:
      "Quick Games run in your browser with live queuing off. You manage the queue and courts yourself, and the session is saved to your account when you end it. Live Queueing games use a server-backed queue so players can join by QR code and follow along on their phones. Live Queueing is a Premium feature.",
    keywords: ["quick", "live", "queueing", "queuing", "difference", "types", "game types"],
    featured: true,
  },
  {
    id: "start-quick-game",
    question: "How do I start a Quick Game?",
    answer:
      "Open Quick Play, add your players and courts, and start the session. You can save it to your account when you finish so it shows up in My Games with its leaderboard and match history.",
    keywords: ["start", "create", "new game", "begin", "set up", "setup", "quick play"],
    action: { label: "Open Quick Play", href: "/play" },
    featured: true,
  },
  {
    id: "premium",
    question: "What does Premium unlock?",
    answer:
      "Premium unlocks Live Queueing games, QR player registration, Registered Players, My Club, the Marketplace, roster check-in, session insights, and full match history with exports. Free accounts still get Quick Games, My Games, leaderboards, and per-game match history.",
    keywords: ["premium", "upgrade", "paid", "free", "plan", "pricing", "features", "locked"],
    action: { label: "See Premium", href: "/premium" },
    featured: true,
  },
  {
    id: "qr-registration",
    question: "How do players register with a QR code?",
    answer:
      "In a Live Queueing game, show the registration QR code. Players scan it with their phone to join the queue — new players, returning players, and volunteers each have their own flow. QR registration is a Premium feature.",
    keywords: ["qr", "scan", "register", "registration", "join", "sign up", "players join", "volunteer"],
    featured: true,
  },
  {
    id: "leaderboard",
    question: "Where can I see the leaderboard and match history?",
    answer:
      "Every game has its own leaderboard and match history. Open the game from My Games, then use the leaderboard in the navigation. If a match is removed from the history, the leaderboard updates to match.",
    keywords: ["leaderboard", "standings", "ranking", "history", "matches", "scores", "results", "delete match"],
    action: { label: "Go to My Games", href: "/my-games" },
  },
  {
    id: "past-sessions",
    question: "Where are my past sessions?",
    answer:
      "Ended sessions are saved to your account and listed under My Games, alongside any active ones.",
    keywords: ["past", "old", "ended", "previous", "history", "sessions", "saved", "find game"],
    action: { label: "Go to My Games", href: "/my-games" },
  },
  {
    id: "registered-players",
    question: "How do I manage my player roster?",
    answer:
      "Registered Players lists everyone in your club with their profiles and check-in history, and lets you export player data. You can also check roster players into a session instead of typing names by hand. This is a Premium feature.",
    keywords: ["roster", "players", "registered", "members", "club members", "export", "check-in", "check in"],
    action: { label: "Registered Players", href: "/users" },
  },
  {
    id: "my-club",
    question: "What is My Club?",
    answer:
      "My Club is your club's hub: its profile, community posts, prayer requests, and player follow-ups. It's a Premium feature.",
    keywords: ["club", "profile", "community", "posts", "prayer", "branding", "logo"],
    action: { label: "Open My Club", href: "/my-club" },
  },
  {
    id: "marketplace",
    question: "How does the Marketplace work?",
    answer:
      "The Marketplace lets you list gear and items for your club, with GCash, Maya, or bank transfer payment options. It's a Premium feature.",
    keywords: ["marketplace", "sell", "listing", "gear", "paddle", "gcash", "maya", "bank", "payment", "shop"],
    action: { label: "Open Marketplace", href: "/marketplace" },
  },
  {
    id: "spectator",
    question: "Can players follow the game on their phones?",
    answer:
      "Yes. Spectator views share live standings, match history, and court action with players on their own phones, so they don't need to crowd around your tablet.",
    keywords: ["spectator", "spectate", "watch", "phone", "follow", "view", "share", "live"],
  },
  {
    id: "verify-email",
    question: "I didn't get my verification email.",
    answer:
      "Check your spam or junk folder first. If it still isn't there, send us a message and we'll help you get verified.",
    keywords: ["verify", "verification", "email", "confirm", "code", "link", "spam", "not received"],
  },
  {
    id: "settings",
    question: "Where are my settings?",
    answer:
      "Tap the account icon in the top-right corner and choose Settings. The same menu has Help center, theme options, and Logout.",
    keywords: ["settings", "account", "profile", "theme", "dark", "light", "logout", "log out", "password"],
  },
  {
    id: "report-bug",
    question: "How do I report a bug or suggest a feature?",
    answer:
      "Use the Send feedback button below, or open Help center from the account menu. You can attach a screenshot, and we'll email you a confirmation.",
    keywords: ["bug", "problem", "issue", "error", "broken", "feedback", "suggest", "idea", "feature request", "contact", "support", "help"],
    featured: true,
  },
];

const STOP_WORDS = new Set([
  "a", "an", "the", "i", "me", "my", "we", "you", "your", "is", "are", "was", "do", "does", "did",
  "how", "what", "where", "when", "why", "can", "could", "should", "to", "of", "in", "on", "for",
  "and", "or", "it", "this", "that", "with", "about", "get", "have", "has", "there", "any",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 1 && !STOP_WORDS.has(word));
}

/** Crude plural/suffix folding so "players" matches "player", "queuing" matches "queue". */
function stem(word: string): string {
  return word.replace(/(ing|es|s)$/, "");
}

export type FaqMatch = {
  entry: FaqEntry;
  score: number;
};

/**
 * Rank FAQ entries against a free-text question. Phrase keywords weigh more than
 * single-word overlap; entries scoring below `minScore` are dropped.
 */
export function searchFaq(query: string, minScore = 3): FaqMatch[] {
  const normalized = query.toLowerCase();
  const queryTokens = new Set(tokenize(query).map(stem));
  if (queryTokens.size === 0) return [];

  const matches: FaqMatch[] = [];
  for (const entry of FAQ_ENTRIES) {
    let score = 0;

    for (const keyword of entry.keywords) {
      if (keyword.includes(" ")) {
        if (normalized.includes(keyword)) score += 3;
      } else if (queryTokens.has(stem(keyword))) {
        score += 2;
      }
    }

    for (const token of new Set(tokenize(entry.question).map(stem))) {
      if (queryTokens.has(token)) score += 1;
    }

    if (score >= minScore) matches.push({ entry, score });
  }

  return matches.sort((a, b) => b.score - a.score);
}

export function getFeaturedFaqs(): FaqEntry[] {
  return FAQ_ENTRIES.filter((entry) => entry.featured);
}

export function getFaqById(id: string): FaqEntry | undefined {
  return FAQ_ENTRIES.find((entry) => entry.id === id);
}
