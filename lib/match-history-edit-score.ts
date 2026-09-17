import { Types } from "mongoose";

import { resolveWinnerTeamFromScores } from "@/lib/match-score-validation";
import { LeaderboardStats } from "@/models/LeaderboardStats";
import { MatchHistory } from "@/models/MatchHistory";

async function recalculateWinRates(gameId: string) {
  const allStats = await LeaderboardStats.find({ gameId });
  await Promise.all(
    allStats.map(async (stat) => {
      stat.gamesPlayed = Math.max(0, stat.gamesPlayed);
      stat.wins = Math.max(0, stat.wins);
      stat.losses = Math.max(0, stat.losses);
      stat.winRate =
        stat.gamesPlayed > 0 ? Math.round((stat.wins / stat.gamesPlayed) * 100) : 0;
      await stat.save();
    }),
  );
}

/**
 * Flip win/loss on the session leaderboard when an edited score changes the winner.
 * Games played stay the same; streak is adjusted like match delete (local undo + apply).
 */
async function applyWinnerFlipToLeaderboard(input: {
  gameId: string;
  teamAPlayerIds: Types.ObjectId[];
  teamBPlayerIds: Types.ObjectId[];
  previousWinner: "A" | "B";
  nextWinner: "A" | "B";
}) {
  if (input.previousWinner === input.nextWinner) return;

  const nextWinnerSet = new Set(
    (input.nextWinner === "A" ? input.teamAPlayerIds : input.teamBPlayerIds).map((id) =>
      id.toString(),
    ),
  );
  const allPlayers = [...input.teamAPlayerIds, ...input.teamBPlayerIds];

  await Promise.all(
    allPlayers.map(async (playerId) => {
      const isWinner = nextWinnerSet.has(playerId.toString());
      await LeaderboardStats.findOneAndUpdate(
        { gameId: input.gameId, playerId },
        {
          $inc: {
            wins: isWinner ? 1 : -1,
            losses: isWinner ? -1 : 1,
            // Undo prior outcome (+1 win or -1 loss on streak) then apply the flip.
            currentStreak: isWinner ? 2 : -2,
          },
        },
      );
    }),
  );

  await recalculateWinRates(input.gameId);
}

export async function updateMatchScoreInHistory(input: {
  gameId: string;
  matchId: string;
  teamAScore: number;
  teamBScore: number;
}) {
  const nextWinner = resolveWinnerTeamFromScores(input.teamAScore, input.teamBScore);
  if (!nextWinner) {
    throw new Error("Scores cannot be tied — one team must have more points.");
  }

  const existing = await MatchHistory.findOne({
    _id: input.matchId,
    gameId: input.gameId,
  }).select("winnerTeam teamAPlayerIds teamBPlayerIds");
  if (!existing) throw new Error("Match not found.");

  const previousWinner = existing.winnerTeam as "A" | "B";

  const match = await MatchHistory.findOneAndUpdate(
    { _id: input.matchId, gameId: input.gameId },
    {
      $set: {
        teamAScore: input.teamAScore,
        teamBScore: input.teamBScore,
        winnerTeam: nextWinner,
      },
    },
    { returnDocument: "after" },
  );
  if (!match) throw new Error("Match not found.");

  if (previousWinner !== nextWinner) {
    await applyWinnerFlipToLeaderboard({
      gameId: input.gameId,
      teamAPlayerIds: existing.teamAPlayerIds,
      teamBPlayerIds: existing.teamBPlayerIds,
      previousWinner,
      nextWinner,
    });
  }

  return { match, previousWinner, nextWinner };
}
