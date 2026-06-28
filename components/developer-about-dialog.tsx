"use client";

import { useEffect, useRef, useState } from "react";
import { Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/app-config";

const DEVELOPER_PHOTO = "/assets/images/andyradam.jpeg";
const DEVELOPER_PHONE = "+63 947-512-7884";
const DEVELOPER_PHONE_TEL = "+639475127884";
const GOALS = [
  "Fair and transparent player rotations",
  "Faster court assignments",
  "Easier player check-ins",
  "Better experience for clubs, organizers, and players",
];

type DeveloperAboutDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  marketingLight?: boolean;
};

export function DeveloperAboutDialog({
  open,
  onOpenChange,
  marketingLight = false,
}: DeveloperAboutDialogProps) {
  const [showPhone, setShowPhone] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      setShowPhone(false);
      return;
    }

    const resetScroll = () => {
      const node = scrollRef.current;
      if (!node) return;
      node.scrollTop = 0;
    };

    resetScroll();
    const frame = requestAnimationFrame(resetScroll);
    const timer = window.setTimeout(resetScroll, 50);

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "developer-about-dialog flex max-h-[min(90vh,44rem)] max-w-[min(96vw,32rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg",
          marketingLight && "developer-about-dialog--marketing",
        )}
      >
        <DialogHeader className="shrink-0 items-center px-4 pt-4 pb-3 text-center sm:items-center sm:text-center">
          <div
            className={cn(
              "developer-about-photo mx-auto overflow-hidden rounded-full ring-2",
              marketingLight ? "ring-emerald-200" : "ring-border",
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={DEVELOPER_PHOTO}
              alt="ASRII"
              className="size-28 object-cover sm:size-32"
            />
          </div>
          <DialogTitle
            className={cn(
              "text-lg sm:text-xl",
              marketingLight ? "text-emerald-950" : undefined,
            )}
          >
            Welcome to {APP_NAME} 🏓
          </DialogTitle>
          <p
            className={cn(
              "text-sm font-medium",
              marketingLight ? "text-emerald-950" : "text-foreground",
            )}
          >
            Thank you for using {APP_NAME}!
          </p>
        </DialogHeader>

        <div
          ref={scrollRef}
          className="developer-about-body min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 pb-4"
        >
          <div className="space-y-4 text-sm leading-relaxed">
          <p className={marketingLight ? "text-emerald-900/80" : "text-muted-foreground"}>
            {APP_NAME} &nbsp; was created to help pickleball enthusiasts manage courts, player
            rotations, and queues more efficiently. Whether you&apos;re participating in open play,
            organizing club sessions, or running tournaments, {APP_NAME} aims to create a fairer,
            smoother, and more enjoyable experience for everyone on the court.
          </p>

          <div>
            <h3 className={cn("mb-2 font-semibold", marketingLight ? "text-emerald-950" : "text-foreground")}>
              Our Goal
            </h3>
            <ul className={cn("list-disc space-y-1 pl-5", marketingLight ? "text-emerald-900/80" : "text-muted-foreground")}>
              {GOALS.map((goal) => (
                <li key={goal}>{goal}</li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className={cn("mb-2 font-semibold", marketingLight ? "text-emerald-950" : "text-foreground")}>
              For the Pickleball Community
            </h3>
            <p className={marketingLight ? "text-emerald-900/80" : "text-muted-foreground"}>
              Pickleball continues to bring people together through sportsmanship, friendship, and
              healthy competition. {APP_NAME} is built to support that growing community and help
              every session run smoothly.
            </p>
          </div>

          <p className={marketingLight ? "text-emerald-900/80" : "text-muted-foreground"}>
            Your feedback, suggestions, and ideas are always welcome. Every improvement to Paddle
            Flow starts with input from players like you.
          </p>

          <p className={cn("font-medium", marketingLight ? "text-emerald-950" : "text-foreground")}>
            Play fair. Stay active. Have fun.
          </p>

          <p className={marketingLight ? "text-emerald-900/80" : "text-muted-foreground"}>
            Thank you for being part of the {APP_NAME} community!
          </p>

          <div className={cn("border-t pt-4", marketingLight ? "border-emerald-200" : "border-border/60")}>
            <p className={cn("font-medium", marketingLight ? "text-emerald-950" : "text-foreground")}>
              — ASRII, Creator of {APP_NAME} 🏓
            </p>
            <p className={cn("mt-2 italic", marketingLight ? "text-emerald-800/70" : "text-muted-foreground")}>
              All glory to God.
            </p>
            <div className="mt-3">
              {showPhone ? (
                <a
                  href={`tel:${DEVELOPER_PHONE_TEL}`}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    marketingLight
                      ? "border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100"
                      : "border-border bg-muted/60 text-foreground hover:bg-muted",
                  )}
                >
                  <Phone className="h-3 w-3" aria-hidden />
                  {DEVELOPER_PHONE}
                </a>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className={cn(
                    "h-7 rounded-full px-3 text-xs",
                    marketingLight &&
                      "border-emerald-300 bg-white text-emerald-900 hover:bg-emerald-50",
                  )}
                  onClick={() => setShowPhone(true)}
                >
                  Contact Me
                </Button>
              )}
            </div>
          </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
