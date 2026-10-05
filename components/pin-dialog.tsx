"use client";

import { useEffect, useRef, useState } from "react";
import { Delete } from "lucide-react";
import { playError, playUnlock } from "@/lib/audio";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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

  function pushDigit(digit: string) {
    if (busy || lockedFor > 0) return;
    setMessage("");
    const next = (pin + digit).slice(0, 4);
    setPin(next);
    if (next.length === 4) void submit(next);
  }

  async function submit(next: string) {
    if (sending.current || next.length !== 4 || lockedFor > 0) return;
    sending.current = true;
    setBusy(true);
    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: next }),
      });
      const body = (await response.json().catch(() => ({}))) as {
        token?: string;
        expiresAt?: number;
        error?: string;
        retryAfter?: number;
      };
      if (!response.ok || !body.token || !body.expiresAt) {
        playError();
        setShake(true);
        window.setTimeout(() => setShake(false), 450);
        setPin("");
        setMessage(body.error ?? "Try the PIN again.");
        if (response.status === 429 && body.retryAfter) setLockedFor(body.retryAfter);
        return;
      }
      playUnlock();
      setPin("");
      onSuccess(body.token, body.expiresAt);
    } catch {
      playError();
      setMessage("The desk did not answer. Try again.");
      setPin("");
    } finally {
      sending.current = false;
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setPin("");
          setMessage("");
          setShake(false);
        }
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-[380px]">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Yard duty desk</DialogTitle>
          <DialogDescription>Four digits. Staff only. The board stays up for the school.</DialogDescription>
        </DialogHeader>
        <div className={cn("flex flex-col gap-4", shake && "pin-shake")}>
          <Input
            value={pin}
            onValueChange={(value) => {
              const next = value.replace(/\D/g, "").slice(0, 4);
              setPin(next);
              setMessage("");
              if (next.length === 4) void submit(next);
            }}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={4}
            type="password"
            aria-label="Four digit staff PIN"
            disabled={busy || lockedFor > 0}
            className="h-14 text-center font-display text-2xl tracking-[0.55em]"
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
            <span />
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
          <p className="min-h-5 text-center text-sm font-semibold text-[#ff8b8b]" role="status">
            {lockedFor > 0 ? `Pad resting · ${lockedFor}s` : message}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
