"use client";

import { useEffect, useRef, useState } from "react";
import { Delete } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PIN_LENGTH, STAFF, staffName, type StaffId } from "@/lib/game";
import { cn } from "@/lib/utils";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"] as const;

export function PinDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (token: string, expiresAt: number) => void;
}) {
  const [staffId, setStaffId] = useState<StaffId | null>(null);
  const [pin, setPin] = useState("");
  const [message, setMessage] = useState("");
  const [shake, setShake] = useState(false);
  const [busy, setBusy] = useState(false);
  const [lockedFor, setLockedFor] = useState(0);
  const sending = useRef(false);

  useEffect(() => {
    if (lockedFor <= 0) return;
    const id = window.setInterval(() => {
      setLockedFor((seconds) => Math.max(0, seconds - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [lockedFor]);

  function resetPad() {
    setPin("");
    setMessage("");
    setShake(false);
    setStaffId(null);
  }

  function pushDigit(digit: string) {
    if (busy || lockedFor > 0 || !staffId) return;
    setMessage("");
    const next = (pin + digit).slice(0, PIN_LENGTH);
    setPin(next);
    if (next.length === PIN_LENGTH) void submit(next, staffId);
  }

  async function submit(next: string, who: StaffId) {
    if (sending.current || next.length !== PIN_LENGTH || lockedFor > 0) return;
    sending.current = true;
    setBusy(true);
    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: next, staffId: who }),
      });
      const body = (await response.json().catch(() => ({}))) as {
        token?: string;
        expiresAt?: number;
        error?: string;
        retryAfter?: number;
      };
      if (!response.ok || !body.token || !body.expiresAt) {
        setShake(true);
        window.setTimeout(() => setShake(false), 450);
        setPin("");
        setMessage(body.error ?? "Try the code again.");
        if (response.status === 429 && body.retryAfter) setLockedFor(body.retryAfter);
        return;
      }
      resetPad();
      onSuccess(body.token, body.expiresAt);
    } catch {
      setMessage("The desk did not answer. Try again.");
      setPin("");
    } finally {
      sending.current = false;
      setBusy(false);
    }
  }

  const who = staffName(staffId);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) resetPad();
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            {who ? `Hi ${who}` : "Who's on yard duty?"}
          </DialogTitle>
          <DialogDescription>
            {who
              ? "Enter the staff code. This device stays signed in as you until you lock the desk."
              : "Tap your name, then the staff code. This device stays signed in as you."}
          </DialogDescription>
        </DialogHeader>

        {!who && (
          <div className="grid grid-cols-2 gap-2">
            {STAFF.map((person) => (
              <Button
                key={person.id}
                type="button"
                variant="secondary"
                className="h-12 rounded-xl font-display text-lg"
                onClick={() => {
                  setStaffId(person.id);
                  setMessage("");
                  setPin("");
                }}
              >
                {person.name}
              </Button>
            ))}
          </div>
        )}

        {who && staffId && (
          <div className={cn("flex flex-col gap-4", shake && "pin-shake")}>
            <Input
              value={pin}
              onValueChange={(value) => {
                const next = value.replace(/\D/g, "").slice(0, PIN_LENGTH);
                setPin(next);
                setMessage("");
                if (next.length === PIN_LENGTH) void submit(next, staffId);
              }}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={PIN_LENGTH}
              type="password"
              aria-label="Six digit staff code"
              disabled={busy || lockedFor > 0}
              className="h-14 text-center font-display text-2xl tracking-[0.35em]"
            />
            <div className="grid grid-cols-3 gap-2">
              {KEYS.slice(0, 9).map((digit) => (
                <Button
                  key={digit}
                  type="button"
                  variant="secondary"
                  className="h-14 font-display text-2xl"
                  disabled={busy || lockedFor > 0}
                  onClick={() => pushDigit(digit)}
                >
                  {digit}
                </Button>
              ))}
              <Button
                type="button"
                variant="outline"
                className="h-14"
                disabled={busy}
                onClick={() => {
                  setStaffId(null);
                  setPin("");
                  setMessage("");
                }}
              >
                Back
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="h-14 font-display text-2xl"
                disabled={busy || lockedFor > 0}
                onClick={() => pushDigit("0")}
              >
                0
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-14"
                aria-label="Delete digit"
                disabled={busy || pin.length === 0}
                onClick={() => setPin((current) => current.slice(0, -1))}
              >
                <Delete />
              </Button>
            </div>
            <p className="min-h-5 text-center text-sm font-semibold text-[#c23b3b]" role="status">
              {lockedFor > 0 ? `Pad resting · ${lockedFor}s` : message}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
