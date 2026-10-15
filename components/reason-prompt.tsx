"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

export function ReasonPrompt({
  id,
  line,
  onSave,
  onDismiss,
}: {
  id: string;
  line: string;
  onSave: (reason: string) => Promise<string | null>;
  onDismiss: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;

  useEffect(() => {
    const timer = window.setTimeout(() => dismissRef.current(), 25_000);
    return () => window.clearTimeout(timer);
  }, [id]);

  return (
    <div className="fixed top-20 left-1/2 z-[70] w-[min(26rem,calc(100%-1.5rem))] -translate-x-1/2 rounded-2xl border-2 border-[#2a1c04] bg-[#fffdf8] p-3 shadow-[0_6px_0_#2a1c04]">
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
            <span className="text-xs font-extrabold tracking-wide text-ink-gold uppercase">Reason</span>
            <input
              autoFocus
              maxLength={80}
              value={reason}
              placeholder="keeping the toilets so clean"
              aria-label="Reason for the points"
              onChange={(event) => setReason(event.target.value)}
              className="h-11 rounded-xl border border-input bg-transparent px-3 text-base font-bold"
            />
          </label>
          <p className="text-xs font-bold text-muted-foreground">{line}</p>
          {error ? <p className="text-xs font-bold text-[#8d1f1f]">{error}</p> : null}
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant="outline" className="h-10 rounded-xl" onClick={onDismiss}>
              No reason
            </Button>
            <Button type="submit" className="h-10 rounded-xl" disabled={saving || reason.trim().length === 0}>
              Save
            </Button>
          </div>
        </form>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <p className="min-w-0 truncate text-sm font-extrabold">{line}</p>
          <Button type="button" className="h-10 shrink-0 rounded-xl" onClick={() => setOpen(true)}>
            Give reason
          </Button>
        </div>
      )}
    </div>
  );
}
