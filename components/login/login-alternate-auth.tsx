"use client";

import { GoogleAuthButton } from "@/components/login/google-auth-button";
import { Button } from "@/components/ui/button";
import { isLoginExtrasEnabled } from "@/lib/google-auth-config";

type LoginAlternateAuthProps = {
  disabled?: boolean;
  mode: "login" | "register";
  onToggleMode: () => void;
  signUpLabel?: string;
  logInLabel?: string;
};

export function LoginAlternateAuth({
  disabled = false,
  mode,
  onToggleMode,
  signUpLabel = "Need an account? Sign up",
  logInLabel = "Already have an account? Log in",
}: LoginAlternateAuthProps) {
  if (!isLoginExtrasEnabled()) return null;

  return (
    <>
      <GoogleAuthButton disabled={disabled} />

      <Button
        type="button"
        variant="ghost"
        className="w-full"
        disabled={disabled}
        onClick={onToggleMode}
      >
        {mode === "login" ? signUpLabel : logInLabel}
      </Button>
    </>
  );
}
