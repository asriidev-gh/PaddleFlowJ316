"use client";

import { cn } from "@/lib/utils";

const LAPTOP_DEMO_SRC =
  "/assets/videos/demo/game_dashboard_filling_court_shuffling_players_ending_game.webm";
const LAPTOP_POSTER = "/assets/videos/demo/poster-laptop.png";
const PHONE_DEMO_SRC = "/assets/videos/demo/leaderboard.webm";
const PHONE_POSTER = "/assets/videos/demo/poster-phone.png";

/** Skip Playwright cold-start / “Loading session…” frames at the head of each clip. */
const DEMO_START_SECONDS = 1.85;

type LandingDevicePreviewProps = {
  className?: string;
};

function DeviceVideo({
  src,
  poster,
  title,
  className,
  startAt = DEMO_START_SECONDS,
}: {
  src: string;
  poster?: string;
  title: string;
  className?: string;
  startAt?: number;
}) {
  return (
    <video
      className={cn("h-full w-full object-cover object-top", className)}
      autoPlay
      muted
      playsInline
      loop
      preload="metadata"
      poster={poster}
      aria-label={title}
      onLoadedMetadata={(event) => {
        const video = event.currentTarget;
        if (video.duration > startAt + 0.5) {
          video.currentTime = startAt;
        }
      }}
      onTimeUpdate={(event) => {
        const video = event.currentTarget;
        // When native loop restarts near 0, jump past the loading lead-in again.
        if (video.currentTime > 0 && video.currentTime < startAt * 0.45) {
          video.currentTime = startAt;
        }
      }}
    >
      <source src={src} type={src.endsWith(".webm") ? "video/webm" : "video/mp4"} />
    </video>
  );
}

export function LandingDevicePreview({ className }: LandingDevicePreviewProps) {
  return (
    <div
      className={cn("marketing-devices pointer-events-none select-none", className)}
      aria-hidden
    >
      <div className="marketing-devices__glow" />

      <div className="marketing-devices__stage">
        <div className="marketing-devices__laptop">
          <div className="marketing-devices__laptop-lid">
            <div className="marketing-devices__laptop-bezel">
              <div className="marketing-devices__laptop-camera" />
              <div className="marketing-devices__laptop-screen">
                <DeviceVideo
                  src={LAPTOP_DEMO_SRC}
                  poster={LAPTOP_POSTER}
                  title="Operator dashboard preview"
                />
              </div>
            </div>
          </div>
          <div className="marketing-devices__laptop-base">
            <div className="marketing-devices__laptop-notch" />
          </div>
          <div className="marketing-devices__laptop-shadow" />
        </div>

        <div className="marketing-devices__phone">
          <div className="marketing-devices__phone-frame">
            <div className="marketing-devices__phone-notch" />
            <div className="marketing-devices__phone-screen">
              <DeviceVideo
                src={PHONE_DEMO_SRC}
                poster={PHONE_POSTER}
                title="Leaderboard mobile preview"
                startAt={0.6}
              />
            </div>
            <div className="marketing-devices__phone-home" />
          </div>
        </div>
      </div>

      <div className="marketing-devices__caption">
        Live queue on tablet · Leaderboard on phone
      </div>
    </div>
  );
}
