"use client";

import { LoginFormCard } from "@/components/login/login-form-card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type LoginAuthDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "login" | "register";
  onModeChange: (mode: "login" | "register") => void;
  saveQuickPlayHint?: boolean;
};

export function LoginAuthDialog({
  open,
  onOpenChange,
  mode,
  onModeChange,
  saveQuickPlayHint = false,
}: LoginAuthDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-0 border-border/80 bg-card p-0 sm:max-w-md">
        <DialogHeader className="sr-only">
          <DialogTitle>{mode === "login" ? "Sign in" : "Create account"}</DialogTitle>
        </DialogHeader>
        <LoginFormCard
          mode={mode}
          onModeChange={onModeChange}
          saveQuickPlayHint={saveQuickPlayHint}
          onSuccess={() => onOpenChange(false)}
          className="border-0 bg-transparent shadow-none"
        />
      </DialogContent>
    </Dialog>
  );
}
