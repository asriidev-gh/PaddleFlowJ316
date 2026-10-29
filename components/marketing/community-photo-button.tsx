"use client";

import { useState, type ReactNode } from "react";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

/** Wraps an avatar so tapping it opens the full-size photo in a modal. */
export function CommunityPhotoButton({
  name,
  photoUrl,
  children,
}: {
  name: string;
  photoUrl?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  if (!photoUrl) return <>{children}</>;

  return (
    <>
      <button
        type="button"
        className="standings-photo-button"
        onClick={() => setOpen(true)}
        aria-label={`View ${name}'s photo`}
      >
        {children}
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[min(96vw,40rem)] gap-3 p-3 sm:p-4">
          <DialogHeader className="pr-8">
            <DialogTitle>{name}</DialogTitle>
          </DialogHeader>
          <div className="flex max-h-[min(85vh,44rem)] w-full items-center justify-center overflow-hidden rounded-lg bg-muted/40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoUrl}
              alt={`${name} — full size`}
              className="max-h-[min(85vh,44rem)] w-full object-contain"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
