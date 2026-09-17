/**
 * Capture marketing device-preview demos with Playwright.
 *
 * Prerequisites: `npm run dev` on BASE_URL (default http://localhost:3000)
 *
 * Usage: npm run capture:marketing-demos
 */
import { mkdir, copyFile, rm } from "node:fs/promises";
import path from "node:path";
import { chromium, type Page } from "playwright";

import type { PlayerPhotoRef } from "../components/game/player-avatar";
import { createEphemeralQuickGameId } from "../lib/local-game-id";
import { createLocalLiveQueueSession } from "../lib/local-game-session";
import type { OperatorFullPayload } from "../lib/operator-payload";
import { getTodayOpenPlayDateInputValue } from "../lib/open-play-time-range";
import { resolvePlayerId } from "../components/game/player-avatar";

const BASE_URL = process.env.MARKETING_DEMO_BASE_URL ?? "http://localhost:3000";
const OUT_DIR = path.join(process.cwd(), "public", "assets", "videos", "demo");
const TMP_DIR = path.join(process.cwd(), ".tmp", "marketing-demo");
const THEME = "cupertino";

const DEMO_PLAYERS = [
  { displayName: "Maya Santos", gender: "female" as const },
  { displayName: "Daniel Reyes", gender: "male" as const },
  { displayName: "Grace Cruz", gender: "female" as const },
  { displayName: "Mark Gonzales", gender: "male" as const },
  { displayName: "Sofia Lim", gender: "female" as const },
  { displayName: "James Aquino", gender: "male" as const },
  { displayName: "Hannah Torres", gender: "female" as const },
  { displayName: "Carlo Mendoza", gender: "male" as const },
  { displayName: "Priya Navarro", gender: "female" as const },
  { displayName: "Noah Castillo", gender: "male" as const },
  { displayName: "Elena Flores", gender: "female" as const },
  { displayName: "Gabriel Ramos", gender: "male" as const },
];

/** Wins / losses pairs for a believable standings board (sorted later by wins). */
const DEMO_STATS: Array<{ wins: number; losses: number }> = [
  { wins: 4, losses: 0 },
  { wins: 3, losses: 1 },
  { wins: 3, losses: 1 },
  { wins: 2, losses: 1 },
  { wins: 2, losses: 2 },
  { wins: 2, losses: 2 },
  { wins: 1, losses: 2 },
  { wins: 1, losses: 2 },
  { wins: 1, losses: 3 },
  { wins: 0, losses: 2 },
  { wins: 0, losses: 1 },
  { wins: 0, losses: 1 },
];

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function rosterPlayers(payload: OperatorFullPayload): PlayerPhotoRef[] {
  return payload.queue.map((entry) => entry.playerId);
}

function withDemoLeaderboard(payload: OperatorFullPayload): OperatorFullPayload {
  const players = rosterPlayers(payload);
  const leaderboard = players.map((player, index) => {
    const stats = DEMO_STATS[index] ?? { wins: 0, losses: 0 };
    return {
      playerId: player,
      wins: stats.wins,
      losses: stats.losses,
      gamesPlayed: stats.wins + stats.losses,
    };
  });

  // A couple of finished matches so session awards / insights have substance
  const [a1, a2, b1, b2, c1, c2, d1, d2] = players;
  const now = Date.now();
  const matches =
    a1 && a2 && b1 && b2
      ? [
          {
            _id: "local-match-demo-1",
            courtNumber: 1,
            endedAt: new Date(now - 20 * 60_000).toISOString(),
            teamAPlayerIds: [a1, a2],
            teamBPlayerIds: [b1, b2],
            winnerTeam: "A" as const,
            teamAScore: 11,
            teamBScore: 6,
            durationSeconds: 14 * 60,
          },
          ...(c1 && c2 && d1 && d2
            ? [
                {
                  _id: "local-match-demo-2",
                  courtNumber: 2,
                  endedAt: new Date(now - 8 * 60_000).toISOString(),
                  teamAPlayerIds: [c1, c2],
                  teamBPlayerIds: [d1, d2],
                  winnerTeam: "B" as const,
                  teamAScore: 9,
                  teamBScore: 11,
                  durationSeconds: 16 * 60,
                },
              ]
            : []),
        ]
      : [];

  return { ...payload, leaderboard, matches };
}

function buildDemoSession(gameId: string) {
  const base = createLocalLiveQueueSession({
    gameId,
    title: "Open Play Night",
    openPlayType: "Intermediate",
    openPlayDate: getTodayOpenPlayDateInputValue(),
    openPlayTimeRange: "18:00 - 21:00",
    venueName: "",
    venueAddress: "",
    venueGoogleMapEmbedUrl: "",
    courtCount: 2,
    expectedPlayers: DEMO_PLAYERS.length,
    allowQrRegistration: false,
    allowManualPlayerAdd: true,
    allowManualCourtAdd: true,
    players: DEMO_PLAYERS,
    checkInAllPlayers: true,
    gameMode: "doubles",
    matchingType: "auto-balanced",
  });
  return withDemoLeaderboard(base);
}

async function hideChromeNoise(page: Page) {
  await page.addStyleTag({
    content: `
      [data-sonner-toaster],
      .Toaster,
      [role="status"].toast,
      #vercel-live-feedback,
      nextjs-portal {
        display: none !important;
      }
    `,
  });
}

async function seedSession(page: Page, gameId: string, payload: OperatorFullPayload) {
  await page.addInitScript(
    ({ storeKey, themeKey, theme, gameId: id, session }) => {
      window.sessionStorage.setItem(
        storeKey,
        JSON.stringify({ state: { sessions: { [id]: session } }, version: 0 }),
      );
      window.localStorage.setItem(themeKey, theme);
      document.documentElement.setAttribute("data-theme", theme);
    },
    {
      storeKey: "ccf-ephemeral-quick-games",
      themeKey: "ccf-theme",
      theme: THEME,
      gameId,
      session: payload,
    },
  );
}

async function captureLaptopDemo(gameId: string, payload: OperatorFullPayload) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    recordVideo: {
      dir: path.join(TMP_DIR, "laptop"),
      size: { width: 1440, height: 900 },
    },
  });
  const page = await context.newPage();
  await seedSession(page, gameId, payload);
  // Land on a blank document first so the WebM lead-in is mostly idle chrome,
  // then jump into the ready dashboard before the main actions.
  await page.goto("about:blank");
  await sleep(400);
  await page.goto(`${BASE_URL}/play/${gameId}`, { waitUntil: "networkidle" });
  await hideChromeNoise(page);
  await page.waitForSelector('button:has-text("Fill this court")', { timeout: 30_000 });
  await sleep(1600);

  await page.getByRole("button", { name: "Fill this court" }).first().click();
  await page.waitForSelector(".fill-court-confirm-dialog", { timeout: 15_000 });
  await sleep(900);

  const shuffle = page.getByRole("button", { name: "Shuffle players into new teams" });
  if (await shuffle.count()) {
    await shuffle.first().click({ timeout: 8_000 }).catch(() => undefined);
    await sleep(2400);
    await shuffle.first().click({ timeout: 8_000 }).catch(() => undefined);
    await sleep(2000);
  }

  await sleep(700);
  const confirm = page.getByRole("button", { name: "Confirm" });
  if (await confirm.count()) {
    await confirm.first().click({ timeout: 8_000 }).catch(() => undefined);
    await sleep(1600);
  }

  await sleep(1400);
  const video = page.video();
  await context.close();
  await browser.close();

  if (!video) throw new Error("Laptop recording missing");
  const src = await video.path();
  const dest = path.join(OUT_DIR, "game_dashboard_filling_court_shuffling_players_ending_game.webm");
  await copyFile(src, dest);
  console.log(`Wrote ${dest}`);
}

async function capturePhoneDemo(gameId: string, payload: OperatorFullPayload) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    recordVideo: {
      dir: path.join(TMP_DIR, "phone"),
      size: { width: 390, height: 844 },
    },
  });
  const page = await context.newPage();
  await seedSession(page, gameId, payload);
  await page.goto(`${BASE_URL}/leaderboard/${gameId}`, { waitUntil: "networkidle" });
  await hideChromeNoise(page);

  // Collapse awards if present so standings dominate the clip
  const collapse = page.getByRole("button", { name: /Collapse/i });
  if (await collapse.isVisible().catch(() => false)) {
    await collapse.click();
    await sleep(400);
  }

  await page.waitForSelector('text=Standings', { timeout: 15_000 });
  await sleep(1600);
  await page.mouse.wheel(0, 220);
  await sleep(1100);
  await page.mouse.wheel(0, 280);
  await sleep(1400);
  await page.mouse.wheel(0, -180);
  await sleep(1200);

  const video = page.video();
  await context.close();
  await browser.close();

  if (!video) throw new Error("Phone recording missing");
  const src = await video.path();
  const dest = path.join(OUT_DIR, "leaderboard.webm");
  await copyFile(src, dest);
  console.log(`Wrote ${dest}`);
}

async function captureStillPosters(gameId: string, payload: OperatorFullPayload) {
  const browser = await chromium.launch({ headless: true });

  const desktop = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  const desktopPage = await desktop.newPage();
  await seedSession(desktopPage, gameId, payload);
  await desktopPage.goto(`${BASE_URL}/play/${gameId}`, { waitUntil: "networkidle" });
  await hideChromeNoise(desktopPage);
  await desktopPage.waitForSelector('button:has-text("Fill this court")', { timeout: 30_000 });
  await desktopPage.getByRole("button", { name: "Fill this court" }).first().click();
  await desktopPage.waitForSelector(".fill-court-confirm-dialog", { timeout: 15_000 });
  await sleep(700);
  await desktopPage.screenshot({
    path: path.join(OUT_DIR, "poster-laptop.png"),
    type: "png",
  });
  await desktop.close();

  const phone = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const phonePage = await phone.newPage();
  await seedSession(phonePage, gameId, payload);
  await phonePage.goto(`${BASE_URL}/leaderboard/${gameId}`, { waitUntil: "networkidle" });
  await hideChromeNoise(phonePage);
  const collapse = phonePage.getByRole("button", { name: /Collapse/i });
  if (await collapse.isVisible().catch(() => false)) {
    await collapse.click();
    await sleep(300);
  }
  await sleep(900);
  await phonePage.screenshot({
    path: path.join(OUT_DIR, "poster-phone.png"),
    type: "png",
  });
  await phone.close();
  await browser.close();
  console.log("Wrote poster-laptop.png and poster-phone.png");
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  await mkdir(TMP_DIR, { recursive: true });

  const gameId = createEphemeralQuickGameId();
  const payload = buildDemoSession(gameId);
  const top = payload.leaderboard?.[0];
  const topId =
    top && typeof top.playerId === "object"
      ? resolvePlayerId(top.playerId as PlayerPhotoRef)
      : null;
  console.log(
    `Capturing demos against ${BASE_URL} (game ${gameId}, theme ${THEME}, top=${topId ?? "?"})`,
  );

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const res = await page.goto(BASE_URL, { waitUntil: "domcontentloaded", timeout: 15_000 });
  await browser.close();
  if (!res || !res.ok()) {
    throw new Error(`Dev server not reachable at ${BASE_URL}. Run npm run dev first.`);
  }

  await captureLaptopDemo(gameId, payload);
  await capturePhoneDemo(gameId, payload);
  await captureStillPosters(gameId, payload);

  await rm(TMP_DIR, { recursive: true, force: true });
  console.log("Done.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
