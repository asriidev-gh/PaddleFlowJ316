import { CommunityPlayerGrid } from "@/components/marketing/community-player-grid";
import { fetchCommunityPlayers } from "@/lib/community-players";

/** Enough to fill the widest layout and keep swapping, without shipping the whole roster. */
const SPOTLIGHT_COUNT = 60;

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export async function LandingCommunityPlayers() {
  const players = shuffle(await fetchCommunityPlayers()).slice(0, SPOTLIGHT_COUNT);
  if (players.length === 0) return null;

  return (
    <section id="community" className="marketing-landing__section marketing-landing__section--muted">
      <div className="marketing-landing__container">
        <p className="marketing-landing__eyebrow">The community</p>
        <h2 className="marketing-landing__section-title">Meet the players</h2>
        <CommunityPlayerGrid players={players} />
      </div>
    </section>
  );
}
