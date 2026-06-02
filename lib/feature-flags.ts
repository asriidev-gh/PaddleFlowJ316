import { isDemoOpenPlayTitle } from "@/lib/demo-open-play";

function parseEnvFlag(value: string | undefined): boolean {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "on" || normalized === "yes";
}

export function isGameResetEnabled(): boolean {
  return (
    parseEnvFlag(process.env.NEXT_PUBLIC_ENABLE_GAME_RESET) ||
    parseEnvFlag(process.env.ENABLE_GAME_RESET)
  );
}

export function isLocalEnvironment(): boolean {
  return process.env.NODE_ENV !== "production";
}

export function canResetGame(title: string): boolean {
  return isDemoOpenPlayTitle(title) || isLocalEnvironment() || isGameResetEnabled();
}
