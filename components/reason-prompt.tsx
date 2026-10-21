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
    <>
      {!open ? (
        <div
          className={cn(
            "rounded-2xl border-2 border-[#2a1c04] bg-[#fffdf8] p-1.5 shadow-[0_4px_0_#2a1c04] transition-opacity duration-300 sm:p-2",
            placement === "fixed" &&
              "fixed right-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-[100] w-auto shadow-[0_6px_0_#2a1c04] sm:right-5 sm:bottom-5",
            placement === "inline" && "w-auto max-w-full",
            fading && "pointer-events-none opacity-0",
          )}
        >
          <button
            type="button"
            className="flex h-8 items-center justify-center gap-2 px-1 sm:h-9 sm:min-w-0"
            onClick={() => {
              setFading(false);
              setOpen(true);
            }}
          >
            <span className="hidden min-w-0 truncate text-xs font-extrabold sm:inline">{line}</span>
            <span className="shrink-0 rounded-lg bg-[#2a1c04] px-2.5 py-1 text-[11px] font-extrabold text-[#ffe08a] sm:py-1.5">
              Give Reason
            </span>
          </button>
        </div>
      ) : null}

      {open ? (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-[#2a1c04]/45 p-4"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) onDismiss();
          }}
        >
          <form
            className="grid w-full max-w-sm gap-3 rounded-3xl border-4 border-[#2a1c04] bg-[#fffdf8] p-4 shadow-[0_10px_0_#2a1c04]"
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
            <div>
              <p className="text-[11px] font-extrabold tracking-[0.18em] text-ink-gold uppercase">
                Give a reason
              </p>
              <p className="mt-1 text-sm font-bold text-muted-foreground">{line}</p>
            </div>
            <label className="grid gap-1.5">
              <span className="sr-only">Reason for the points</span>
              <input
                autoFocus
                maxLength={80}
                value={reason}
                placeholder="keeping the toilets so clean"
                aria-label="Reason for the points"
                onChange={(event) => setReason(event.target.value)}
                className="h-12 w-full rounded-xl border-2 border-[#2a1c04]/20 bg-white px-3 text-base font-bold"
              />
            </label>
            {error ? <p className="text-sm font-bold text-[#8d1f1f]">{error}</p> : null}
            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant="outline" className="h-11 rounded-xl text-sm" onClick={onDismiss}>
                Skip
              </Button>
              <Button
                type="submit"
                className="h-11 rounded-xl text-sm"
                disabled={saving || reason.trim().length === 0}
              >
                Save
              </Button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
