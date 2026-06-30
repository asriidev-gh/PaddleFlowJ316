"use client";

import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { LoginAlternateAuth } from "@/components/login/login-alternate-auth";
import { LoginVideoIntro } from "@/components/login/login-video-intro";
import { DeveloperCreditLink } from "@/components/developer-credit-link";
import { WatchDemoButton } from "@/components/watch-demo-button";
import { APP_NAME } from "@/lib/app-config";
import { isLoginExtrasEnabled } from "@/lib/google-auth-config";
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
import { safeRouterPush, safeRouterReplace } from "@/lib/safe-router";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const loginExtrasEnabled = isLoginExtrasEnabled();
  const skipIntro =
    searchParams.get("saveQuickPlay") === "1" || !loginExtrasEnabled;
  const [introPlayed, setIntroPlayed] = useState(false);
  const introDone = skipIntro || introPlayed;

  const handleIntroComplete = useCallback(() => {
    setIntroPlayed(true);
  }, []);

  useEffect(() => {
    const error = searchParams.get("error");
    if (error) {
      toast.error(error);
      safeRouterReplace(router, "/login");
    }
  }, [searchParams, router]);

  useEffect(() => {
    const requestedMode = searchParams.get("mode");
    if (requestedMode === "register" || searchParams.get("saveQuickPlay") === "1") {
      setMode("register");
    }
  }, [searchParams]);

  useEffect(() => {
    if (searchParams.get("loggedOut") !== "1") return;
    queryClient.setQueryData(["auth-me"], { user: null });
    safeRouterReplace(router, "/login");
  }, [queryClient, router, searchParams]);

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
          const destination = resolvePostAuthDestination({
            saveQuickPlay: isSaveQuickPlaySearchParam(searchParams),
          });
          safeRouterPush(router, destination);
          router.refresh();
          return;
        }
      }

      toast.success(mode === "login" ? "Welcome back!" : "Account created. Check your email to verify your account.");

      safeRouterPush(
        router,
        resolvePostAuthDestination({
          saveQuickPlay: isSaveQuickPlaySearchParam(searchParams),
          returnTo: searchParams.get("returnTo"),
        }),
      );
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {loginExtrasEnabled ? (
        <div className="login-page__bg" aria-hidden="true">
          <Image
            src="/assets/images/login_logo.jpeg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
        </div>
      ) : null}

      <header className="login-page-header absolute inset-x-0 top-0 z-20 border-b border-border/60 bg-background/85 py-3 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-6">
          <span className="app-brand">{APP_NAME}</span>
          {loginExtrasEnabled ? <WatchDemoButton /> : null}
        </div>
      </header>

      <main
        className={cn(
          "login-page relative isolate z-10 flex min-h-[100dvh] flex-col items-center justify-center p-6",
          loginExtrasEnabled && "overflow-hidden",
        )}
      >
        {loginExtrasEnabled && !introDone && !skipIntro ? (
          <LoginVideoIntro onComplete={handleIntroComplete} />
        ) : null}

        <div
          className={cn(
            "relative z-10 flex w-full max-w-md flex-col items-center gap-6",
            loginExtrasEnabled &&
              "transition-all duration-700 ease-out",
            loginExtrasEnabled
              ? introDone
                ? "-translate-y-[60px] opacity-100"
                : "pointer-events-none translate-y-4 opacity-0"
              : "opacity-100",
          )}
          aria-hidden={loginExtrasEnabled ? !introDone : false}
        >
          <Card className="glass-panel w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle className="section-title">
                {mode === "login" ? "Login" : "Create Account"}
              </CardTitle>
              {searchParams.get("saveQuickPlay") === "1" ? (
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
              <Button className="w-full" onClick={submit} disabled={loading || (loginExtrasEnabled && !introDone)}>
                {loading ? "Please wait..." : mode === "login" ? "Login" : "Create Account"}
              </Button>

              <LoginAlternateAuth
                disabled={loading || (loginExtrasEnabled && !introDone)}
                mode={mode}
                onToggleMode={() => setMode((prev) => (prev === "login" ? "register" : "login"))}
              />
            </CardContent>
          </Card>
          <p className="text-center text-xs text-muted-foreground">
            <DeveloperCreditLink />
          </p>
        </div>
      </main>
    </>
  );
}
