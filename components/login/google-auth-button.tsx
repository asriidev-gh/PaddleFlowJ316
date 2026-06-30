"use client";

import { GoogleAuthIcon } from "@/components/login/google-auth-icon";
import { Button } from "@/components/ui/button";
import { isGoogleAuthEnabled } from "@/lib/google-auth-config";
import { WIZARD_OUTLINE_BUTTON_BORDER } from "@/lib/wizard-field-styles";
import { cn } from "@/lib/utils";

type GoogleAuthButtonProps = {
  disabled?: boolean;
  className?: string;
};

export function GoogleAuthButton({ disabled = false, className }: GoogleAuthButtonProps) {
  if (!isGoogleAuthEnabled()) return null;

  return (
    <>
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">or</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <Button
        type="button"
        variant="outline"
        className={cn("w-full", WIZARD_OUTLINE_BUTTON_BORDER, className)}
        disabled={disabled}
        onClick={() => {
          window.location.href = "/api/auth/google";
        }}
      >
        <GoogleAuthIcon />
        Continue with Google
      </Button>
    </>
  );
}
