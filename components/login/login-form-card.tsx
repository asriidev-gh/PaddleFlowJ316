"use client";

import { Eye, EyeOff } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { LoginAlternateAuth } from "@/components/login/login-alternate-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { readPendingEphemeralQuickGameTransfer } from "@/lib/ephemeral-quick-game-transfer-pending";
import {
  isSaveQuickPlaySearchParam,
  resolvePostAuthDestination,
} from "@/lib/post-auth-redirect";
import {
  WIZARD_PRIMARY_FIELD_BORDER,
  WIZARD_PRIMARY_FIELDS_SCOPE,
} from "@/lib/wizard-field-styles";
import { hardNavigate } from "@/lib/safe-router";
import { cn } from "@/lib/utils";

type LoginFormCardProps = {
  mode: "login" | "register";
  onModeChange: (mode: "login" | "register") => void;
  saveQuickPlayHint?: boolean;
  onSuccess?: () => void;
  className?: string;
};

export function LoginFormCard({
  mode,
  onModeChange,
  saveQuickPlayHint = false,
  onSuccess,
  className,
}: LoginFormCardProps) {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);

  const submit = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      void queryClient.invalidateQueries({ queryKey: ["auth-me"] });

      if (readPendingEphemeralQuickGameTransfer()) {
        const { completePendingEphemeralQuickGameTransfer } = await import(
          "@/lib/ephemeral-quick-game-transfer"
        );
        const newGameId = await completePendingEphemeralQuickGameTransfer(queryClient);
        if (newGameId) {
          toast.success("Your public session has been saved in your account.");
          onSuccess?.();
          const destination = resolvePostAuthDestination({
            saveQuickPlay: saveQuickPlayHint || isSaveQuickPlaySearchParam(searchParams),
          });
          hardNavigate(destination);
          return;
        }
      }

      toast.success(
        mode === "login"
          ? "Welcome back!"
          : "Account created. Check your email to verify your account.",
      );

      onSuccess?.();
      hardNavigate(
        resolvePostAuthDestination({
          saveQuickPlay: saveQuickPlayHint || isSaveQuickPlaySearchParam(searchParams),
          returnTo: searchParams.get("returnTo"),
        }),
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className={cn("w-full border-border/80 bg-card shadow-lg", className)}>
      <CardHeader className="text-center">
        <CardTitle className="section-title">
          {mode === "login" ? "Sign in" : "Create account"}
        </CardTitle>
        {saveQuickPlayHint ? (
          <p className="text-sm text-muted-foreground">
            Sign up to save your open play session to your account.
          </p>
        ) : null}
      </CardHeader>
      <CardContent className={cn("space-y-4", WIZARD_PRIMARY_FIELDS_SCOPE)}>
        {mode === "register" ? (
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              className={cn("h-11 text-base", WIZARD_PRIMARY_FIELD_BORDER)}
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
          </div>
        ) : null}
        <div className="space-y-2">
          <Label>Email</Label>
          <Input
            type="email"
            className={cn("h-11 text-base", WIZARD_PRIMARY_FIELD_BORDER)}
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Password</Label>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              className={cn("h-11 pr-9 text-base", WIZARD_PRIMARY_FIELD_BORDER)}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
            <button
              type="button"
              className="absolute top-1/2 right-1 z-10 flex size-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" aria-hidden />
              ) : (
                <Eye className="h-4 w-4" aria-hidden />
              )}
            </button>
          </div>
        </div>
        <Button className="w-full" onClick={() => void submit()} disabled={loading}>
          {loading ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}
        </Button>

        <LoginAlternateAuth
          disabled={loading}
          mode={mode}
          onToggleMode={() => onModeChange(mode === "login" ? "register" : "login")}
          logInLabel="Already have an account? Sign in"
        />
      </CardContent>
    </Card>
  );
}
