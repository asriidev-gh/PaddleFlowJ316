"use client";

import { useMutation } from "@tanstack/react-query";
import { Camera, ImagePlus, Loader2, Mail, Send, X } from "lucide-react";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import {
  compressRegistrationPhoto,
  shouldCompressRegistrationPhoto,
} from "@/lib/compress-registration-photo";
import {
  isAcceptedRegistrationPhotoType,
  MAX_REGISTRATION_PHOTO_BYTES,
} from "@/lib/registration-photo";
import { MAX_FEEDBACK_MESSAGE_LENGTH } from "@/lib/support-config-shared";

const publicSupportEmail =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || "";

type HelpCenterSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

async function submitFeedback(input: {
  message: string;
  imageFile: File | null;
}) {
  const formData = new FormData();
  formData.set("message", input.message);
  formData.set("pagePath", window.location.pathname);
  formData.set("userAgent", navigator.userAgent.slice(0, 500));
  if (input.imageFile) {
    formData.set("image", input.imageFile);
  }

  const response = await fetch("/api/feedback", {
    method: "POST",
    body: formData,
  });
  const payload = (await response.json()) as { message?: string };
  if (!response.ok) {
    throw new Error(payload.message ?? "Could not send feedback.");
  }
  return payload;
}

export function HelpCenterSheet({ open, onOpenChange }: HelpCenterSheetProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [processingPhoto, setProcessingPhoto] = useState(false);

  useEffect(() => {
    if (!open) {
      setMessage("");
      setImageFile(null);
      setProcessingPhoto(false);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      if (cameraInputRef.current) cameraInputRef.current.value = "";
      if (galleryInputRef.current) galleryInputRef.current.value = "";
    }
    // Only reset when the sheet closes / opens — previewUrl is cleaned inside.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const applyFile = (file: File | null) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (!file) {
      setPreviewUrl(null);
      setImageFile(null);
      return;
    }
    setPreviewUrl(URL.createObjectURL(file));
    setImageFile(file);
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!isAcceptedRegistrationPhotoType(file.type)) {
      toast.error("Please use a JPG, PNG, WebP, or GIF image.");
      return;
    }

    setProcessingPhoto(true);
    try {
      let processed = file;
      if (shouldCompressRegistrationPhoto(file)) {
        processed = await compressRegistrationPhoto(file);
      }
      if (processed.size > MAX_REGISTRATION_PHOTO_BYTES) {
        toast.error("Image is too large. Try a different picture.");
        return;
      }
      applyFile(processed);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not process this image.",
      );
    } finally {
      setProcessingPhoto(false);
    }
  };

  const clearImage = () => {
    applyFile(null);
    if (cameraInputRef.current) cameraInputRef.current.value = "";
    if (galleryInputRef.current) galleryInputRef.current.value = "";
  };

  const submitMutation = useMutation({
    mutationFn: () => submitFeedback({ message: message.trim(), imageFile }),
    onSuccess: () => {
      toast.success("Thanks — we received your feedback.");
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Could not send feedback.");
    },
  });

  const canSubmit =
    message.trim().length > 0 && !submitMutation.isPending && !processingPhoto;
  const inputsDisabled = submitMutation.isPending || processingPhoto;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton
        className="max-h-[min(92vh,40rem)] gap-0 overflow-y-auto rounded-t-2xl border-border p-0 sm:mx-auto sm:max-w-lg"
      >
        <SheetHeader className="gap-1.5 border-b border-border/60 px-5 pb-4 pt-5 pr-14 text-left">
          <SheetTitle className="text-xl font-semibold tracking-tight">Help center</SheetTitle>
          <SheetDescription className="text-sm leading-relaxed">
            Spotted a bug, missing something, or have an idea? Tell us and we&apos;ll take a look.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 px-5 py-4">
          <div className="space-y-2">
            <Label htmlFor="help-center-message">What would you like to share?</Label>
            <Textarea
              id="help-center-message"
              value={message}
              maxLength={MAX_FEEDBACK_MESSAGE_LENGTH}
              disabled={inputsDisabled}
              placeholder="e.g. Could you add a rest-day reminder? · The app froze when I saved my log…"
              className="min-h-28 resize-y"
              onChange={(event) => setMessage(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Attach a screenshot or photo (optional)</Label>
            {previewUrl ? (
              <div className="relative overflow-hidden rounded-xl border border-border/70 bg-muted/15">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="Feedback attachment preview"
                  className="max-h-48 w-full object-contain"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-2 h-8 w-8 rounded-full bg-background/80 backdrop-blur"
                  disabled={inputsDisabled}
                  aria-label="Remove attachment"
                  onClick={clearImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : null}
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={inputsDisabled}
                onClick={() => cameraInputRef.current?.click()}
              >
                {processingPhoto ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <Camera className="mr-2 h-4 w-4" aria-hidden />
                )}
                Camera
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={inputsDisabled}
                onClick={() => galleryInputRef.current?.click()}
              >
                <ImagePlus className="mr-2 h-4 w-4" aria-hidden />
                Gallery
              </Button>
            </div>
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              tabIndex={-1}
              disabled={inputsDisabled}
              onChange={handleFileChange}
            />
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="sr-only"
              tabIndex={-1}
              disabled={inputsDisabled}
              onChange={handleFileChange}
            />
          </div>

          {publicSupportEmail ? (
            <p className="flex items-start gap-2 text-sm text-muted-foreground">
              <Mail className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <span>
                Prefer email? Reach us at{" "}
                <a
                  href={`mailto:${publicSupportEmail}`}
                  className="font-medium text-primary underline-offset-2 hover:underline"
                >
                  {publicSupportEmail}
                </a>
              </span>
            </p>
          ) : null}
        </div>

        <SheetFooter className="flex-row gap-2 border-t border-border/60 px-5 py-4 sm:justify-stretch">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            disabled={submitMutation.isPending}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="flex-1"
            disabled={!canSubmit}
            onClick={() => submitMutation.mutate()}
          >
            {submitMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                Sending…
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" aria-hidden />
                Send feedback
              </>
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
