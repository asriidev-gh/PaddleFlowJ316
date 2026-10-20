"use client";

import { MessageCircleQuestion, Send, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";

import { HelpCenterSheet } from "@/components/help/help-center-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthMe } from "@/hooks/use-auth-me";
import { isGameDashboardPath, isPublicAppPath } from "@/lib/app-shell";
import {
  getFaqById,
  getFeaturedFaqs,
  searchFaq,
  type FaqAction,
  type FaqEntry,
} from "@/lib/faq-data";
import { cn } from "@/lib/utils";

type ChatMessage = {
  id: number;
  role: "bot" | "user";
  text: string;
  action?: FaqAction;
  /** Follow-up FAQ ids rendered as chips under a bot message. */
  suggestionIds?: string[];
  offerFeedback?: boolean;
};

const GREETING: Omit<ChatMessage, "id"> = {
  role: "bot",
  text: "Hi! I can answer common questions about the app. Pick one below or type your own.",
  suggestionIds: getFeaturedFaqs().map((entry) => entry.id),
};

const MAX_QUESTION_LENGTH = 200;

function relatedIds(answered: FaqEntry, ranked: FaqEntry[]): string[] {
  const fromSearch = ranked.filter((entry) => entry.id !== answered.id).map((entry) => entry.id);
  const fallback = getFeaturedFaqs()
    .map((entry) => entry.id)
    .filter((id) => id !== answered.id);
  return [...new Set([...fromSearch, ...fallback])].slice(0, 3);
}

/** Gate: the chat only mounts for logged-in users, so its state resets on logout. */
export function FaqChatbot() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: authData } = useAuthMe();

  // Stay out of the way of public/player screens and the tablet queue dashboard.
  const hidden =
    !authData?.user ||
    isPublicAppPath(pathname, searchParams.get("from")) ||
    isGameDashboardPath(pathname) ||
    pathname.startsWith("/verify-email");

  return hidden ? null : <FaqChatWidget />;
}

function FaqChatWidget() {
  const [open, setOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([{ id: 0, ...GREETING }]);
  const nextId = useRef(1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, open]);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const push = (...incoming: Omit<ChatMessage, "id">[]) => {
    setMessages((current) => [
      ...current,
      ...incoming.map((message) => ({ ...message, id: nextId.current++ })),
    ]);
  };

  const answerEntry = (entry: FaqEntry, ranked: FaqEntry[] = []) => {
    push({
      role: "bot",
      text: entry.answer,
      action: entry.action,
      suggestionIds: relatedIds(entry, ranked),
      offerFeedback: entry.id === "report-bug",
    });
  };

  const askSuggestion = (entry: FaqEntry) => {
    push({ role: "user", text: entry.question });
    answerEntry(entry);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const question = draft.trim();
    if (!question) return;
    setDraft("");
    push({ role: "user", text: question });

    const ranked = searchFaq(question);
    if (ranked.length === 0) {
      push({
        role: "bot",
        text: "I couldn't find an answer to that. Try rephrasing, pick one of these, or send us a message and we'll get back to you.",
        suggestionIds: getFeaturedFaqs()
          .map((entry) => entry.id)
          .slice(0, 3),
        offerFeedback: true,
      });
      return;
    }
    answerEntry(
      ranked[0].entry,
      ranked.slice(1).map((match) => match.entry),
    );
  };

  return (
    <>
      <div
        className={cn(
          "fixed right-4 z-50 bottom-6",
          // Sit above the fixed mobile bottom nav when a page renders one.
          "[:root[data-mobile-bottom-nav]_&]:bottom-[calc(4.75rem+env(safe-area-inset-bottom)+0.75rem)]",
          "[:root[data-mobile-bottom-nav]_&]:lg:bottom-6",
        )}
      >
        {open ? (
          <section
            role="dialog"
            aria-label="Help chat"
            className="absolute bottom-14 right-0 flex h-[min(32rem,calc(100dvh-9rem))] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl"
          >
            <header className="flex items-center justify-between gap-2 border-b border-border/60 px-4 py-3">
              <div>
                <h2 className="text-sm font-semibold leading-tight">Help chat</h2>
                <p className="text-xs text-muted-foreground">Quick answers to common questions</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                aria-label="Close help chat"
                onClick={() => setOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </header>

            <div
              ref={scrollRef}
              role="log"
              aria-live="polite"
              className="flex-1 space-y-3 overflow-y-auto px-4 py-3"
            >
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn("flex flex-col gap-2", message.role === "user" && "items-end")}
                >
                  <p
                    className={cn(
                      "max-w-[88%] whitespace-pre-line rounded-2xl px-3 py-2 text-sm leading-relaxed",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground",
                    )}
                  >
                    {message.text}
                  </p>

                  {message.action ? (
                    <Link
                      href={message.action.href}
                      onClick={() => setOpen(false)}
                      className="text-sm font-medium text-primary underline-offset-2 hover:underline"
                    >
                      {message.action.label} →
                    </Link>
                  ) : null}

                  {message.offerFeedback ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setOpen(false);
                        setFeedbackOpen(true);
                      }}
                    >
                      <Send className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                      Send feedback
                    </Button>
                  ) : null}

                  {message.suggestionIds?.length ? (
                    <div className="flex flex-wrap gap-1.5">
                      {message.suggestionIds.map((id) => {
                        const entry = getFaqById(id);
                        if (!entry) return null;
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => askSuggestion(entry)}
                            className="rounded-full border border-border bg-background px-3 py-1 text-left text-xs transition-colors hover:bg-muted"
                          >
                            {entry.question}
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>

            <form onSubmit={submit} className="flex gap-2 border-t border-border/60 p-3">
              <Input
                ref={inputRef}
                value={draft}
                maxLength={MAX_QUESTION_LENGTH}
                placeholder="Type your question…"
                aria-label="Your question"
                className="h-10"
                onChange={(event) => setDraft(event.target.value)}
              />
              <Button
                type="submit"
                size="icon"
                className="h-10 w-10 shrink-0"
                disabled={!draft.trim()}
                aria-label="Send question"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </section>
        ) : null}

        <Button
          type="button"
          size="icon"
          aria-label={open ? "Close help chat" : "Open help chat"}
          aria-expanded={open}
          className="size-12 rounded-full shadow-lg"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X className="h-5 w-5" /> : <MessageCircleQuestion className="h-6 w-6" />}
        </Button>
      </div>

      <HelpCenterSheet open={feedbackOpen} onOpenChange={setFeedbackOpen} />
    </>
  );
}
