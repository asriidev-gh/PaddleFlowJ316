import { cn } from "@/lib/utils";

const LAPTOP_DEMO_SRC =
  "/assets/videos/demo/game_dashboard_filling_court_shuffling_players_ending_game.webm";
const PHONE_DEMO_SRC = "/assets/videos/demo/leaderboard.webm";

type LandingDevicePreviewProps = {
  className?: string;
};

function DeviceVideo({
  src,
  title,
  className,
}: {
  src: string;
  title: string;
  className?: string;
}) {
  return (
    <video
      className={cn("h-full w-full object-cover object-top", className)}
      autoPlay
      loop
      muted
      playsInline
      preload="metadata"
      aria-label={title}
    >
      <source src={src} type={src.endsWith(".webm") ? "video/webm" : "video/mp4"} />
    </video>
  );
}

export function LandingDevicePreview({ className }: LandingDevicePreviewProps) {
  return (
    <div className={cn("marketing-devices pointer-events-none select-none", className)} aria-hidden>
      <div className="marketing-devices__laptop" aria-hidden>
        <div className="marketing-devices__laptop-lid">
          <div className="marketing-devices__laptop-camera" />
          <div className="marketing-devices__laptop-screen">
            <DeviceVideo
              src={LAPTOP_DEMO_SRC}
              title="Operator dashboard preview"
            />
          </div>
        </div>
        <div className="marketing-devices__laptop-base" />
      </div>

      <div className="marketing-devices__phone" aria-hidden>
        <div className="marketing-devices__phone-notch" />
        <div className="marketing-devices__phone-screen">
          <DeviceVideo src={PHONE_DEMO_SRC} title="Leaderboard mobile preview" />
        </div>
        <div className="marketing-devices__phone-home" />
      </div>
    </div>
  );
}
