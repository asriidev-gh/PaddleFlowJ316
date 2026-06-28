import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Building2,
  History,
  LayoutGrid,
  QrCode,
  Radio,
  Store,
  Trophy,
  UserCheck,
  Users,
} from "lucide-react";

export type PremiumFeature = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export const PREMIUM_FEATURES: PremiumFeature[] = [
  {
    icon: Radio,
    title: "Live Queueing Games",
    description:
      "Create full open-play sessions with a live server-backed queue — not limited to browser-only quick games.",
  },
  {
    icon: LayoutGrid,
    title: "Active & past sessions",
    description:
      "Manage live and ended open play from your dashboard and My Games, with courts view across multiple sessions.",
  },
  {
    icon: QrCode,
    title: "QR player registration",
    description:
      "Players scan a code to join the queue. Volunteers can help at the door without learning a complex system.",
  },
  {
    icon: Users,
    title: "Registered players",
    description:
      "View and manage your club roster, player profiles, check-in history, and exports in one place.",
  },
  {
    icon: Building2,
    title: "My Club",
    description:
      "Run your club hub — profile, community posts, prayer requests, and player follow-ups.",
  },
  {
    icon: Store,
    title: "Marketplace",
    description:
      "List gear and items for your club with GCash, Maya, or bank transfer payment options.",
  },
  {
    icon: UserCheck,
    title: "Roster check-in",
    description:
      "Check registered players into a session from your club roster instead of typing names by hand.",
  },
  {
    icon: Trophy,
    title: "Spectator views & leaderboards",
    description:
      "Share live standings, match history, and court action with players and spectators on their phones.",
  },
  {
    icon: BarChart3,
    title: "Session insights",
    description:
      "Dashboard charts summarize court activity and session trends so you can spot busy nights at a glance.",
  },
  {
    icon: History,
    title: "Full match history & exports",
    description:
      "Review every match from a session, reactivate ended games when needed, and export player data.",
  },
];

export const FREE_TIER_HIGHLIGHTS = [
  "Quick Games with live queuing off",
  "My Games — create and manage quick sessions",
  "Queue and courts in your browser",
  "Sessions saved to your account when you end open play",
  "Leaderboard and match history per quick game",
];
