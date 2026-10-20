"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const OFFER_MS = 6_000;

export function ReasonPrompt({
  id,
  line,
  onSave,
  onDismiss,
  placement = "fixed",
}: {
  id: string;
  line: string;
  onSave: (reason: string) => Promise<string | null>;
  onDismiss: () => void;
  /** `inline` sits in the desk bar under the class cards. */
  placement?: "fixed" | "inline";
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [fading, setFading] = useState(false);
  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;

  useEffect(() => {
    if (open) return;
    const fadeAt = window.setTimeout(() => setFading(true), OFFER_MS - 400);
    const goneAt = window.setTimeout(() => dismissRef.current(), OFFER_MS);
    return () => {
      window.clearTimeout(fadeAt);
      window.clearTimeout(goneAt);
    };
  }, [id, open]);

  return (
    <div
      className={cn(
        "rounded-2xl border-2 border-[#2a1c04] bg-[#fffdf8] p-2 shadow-[0_4px_0_#2a1c04] transition-opacity duration-300",
        placement === "fixed" &&
          "fixed right-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-[100] max-w-[min(18rem,calc(100%-7.5rem))] p-2.5 shadow-[0_6px_0_#2a1c04] sm:right-5 sm:bottom-5 sm:max-w-[18rem]",
        placement === "inline" && "w-full max-w-[12rem] p-1.5 sm:max-w-[18rem] sm:p-2",
        placement === "fixed" && (open ? "w-[min(18rem,calc(100%-7.5rem))] sm:w-[18rem]" : "w-auto"),
        fading && !open && "pointer-events-none opacity-0",
      )}
    >
      {open ? (
        <form
          className="grid gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (saving) return;
            setSaving(true);
            void onSave(reason).then((message) => {
              setSaving(false);
              if (message) setError(message);
            });
          }}
        >
          <label className="grid gap-1">
            <span className="text-[10px] font-extrabold tracking-wide text-ink-gold uppercase">
              Reason
            </span>
            <input
              autoFocus
              maxLength={80}
              value={reason}
              placeholder="keeping the toilets so clean"
              aria-label="Reason for the points"
              onChange={(event) => setReason(event.target.value)}
              className="h-10 rounded-xl border border-input bg-transparent px-3 text-sm font-bold"
            />
          </label>
          <p className="truncate text-[11px] font-bold text-muted-foreground">{line}</p>
          {error ? <p className="text-xs font-bold text-[#8d1f1f]">{error}</p> : null}
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant="outline" className="h-9 rounded-xl text-sm" onClick={onDismiss}>
              Skip
            </Button>
            <Button
              type="submit"
              className="h-9 rounded-xl text-sm"
              disabled={saving || reason.trim().length === 0}
            >
              Save
            </Button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          className="flex h-full min-h-8 w-full items-center justify-end gap-2 text-left sm:min-h-9"
          onClick={() => {
            setFading(false);
            setOpen(true);
          }}
        >
          <span className="hidden min-w-0 truncate text-xs font-extrabold sm:inline">{line}</span>
          <span className="shrink-0 rounded-lg bg-[#2a1c04] px-2.5 py-1 text-[11px] font-extrabold text-[#ffe08a] sm:py-1.5">
            Reason?
          </span>
        </button>
      )}
    </div>
  );
}
