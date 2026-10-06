"use client";

import { useEffect, useState } from "react";
import { Gift, Lock, LockOpen, Map, PartyPopper, Sparkles, Trophy } from "lucide-react";
import { KioskSettings } from "@/components/kiosk-settings";
import type { ScreenId } from "@/lib/reveals";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const icons = {
  board: Trophy,
  prizes: Gift,
  yard: Map,
} as const;

export function SiteHeader({
  view,
  tabs,
  onView,
  authed,
  dutyName,
  onLockClick,
  live,
  onStartKiosk,
}: {
  view: ScreenId;
  tabs: { id: ScreenId; label: string; short: string }[];
  onView: (view: ScreenId) => void;
  authed: boolean;
  dutyName: string | null;
  onLockClick: () => void;
  live: "loading" | "live" | "offline";
  onStartKiosk: () => void;
}) {
  const [clock, setClock] = useState("");

  useEffect(() => {
    const tick = () => {
      setClock(
        new Intl.DateTimeFormat("en-AU", {
          weekday: "short",
          hour: "numeric",
          minute: "2-digit",
        }).format(new Date()),
      );
    };
    tick();
    const id = window.setInterval(tick, 10_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <header className="z-30 shrink-0 border-b border-black/10 bg-[#fff8ec]/90 backdrop-blur-md">
      <div className="flex items-center gap-2 px-3 py-1.5 sm:gap-3 sm:px-4">
        <div className="grid size-9 shrink-0 place-items-center rounded-2xl bg-gold text-[#2a1c04] shadow-[0_3px_0_#c48a16]">
          <PartyPopper className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-extrabold tracking-[0.22em] text-ink-gold uppercase">
            Milawa Primary
          </p>
          <h1 className="truncate font-display text-[15px] leading-tight sm:text-xl">
            Term 4 Tidy Challenge
          </h1>
        </div>
        <p className="hidden text-sm font-bold text-muted-foreground md:block">{clock}</p>
        <span className="hidden items-center gap-1.5 rounded-full border border-black/10 bg-white/70 px-2.5 py-1 text-xs font-bold sm:inline-flex">
          <span
            className={cn(
              "size-2 rounded-full",
              live === "live" && "bg-[#2ec9a0] shadow-[0_0_8px_#2ec9a0]",
              live === "loading" && "bg-gold",
              live === "offline" && "bg-[#ff8b8b]",
            )}
          />
          {live === "live" ? "Live" : live === "loading" ? "Linking" : "Offline"}
        </span>
        <KioskSettings onPreview={onView} />
        <Button type="button" className="h-10 rounded-xl px-2.5 text-sm sm:px-3" onClick={onStartKiosk}>
          Start Kiosk
        </Button>
        <Button
          variant={authed ? "default" : "outline"}
          aria-label={dutyName ? `Open yard duty desk for ${dutyName}` : "Unlock yard duty desk"}
          onClick={onLockClick}
          className="h-10 rounded-xl px-3"
        >
          {authed ? <LockOpen /> : <Lock />}
          {dutyName && <span className="hidden sm:inline">{dutyName}</span>}
        </Button>
      </div>

      <div className="flex gap-1 overflow-x-auto px-3 pb-2 sm:px-5" role="tablist" aria-label="Board views">
        {tabs.map((item) => {
          const Icon = item.id in icons ? icons[item.id as keyof typeof icons] : Sparkles;
          const selected = item.id === view;
          return (
            <Button
              key={item.id}
              role="tab"
              aria-selected={selected}
              variant={selected ? "default" : "ghost"}
              onClick={() => onView(item.id)}
              className="h-8 shrink-0 rounded-xl px-3"
            >
              <Icon />
              <span className="sm:hidden">{item.short}</span>
              <span className="hidden sm:inline">{item.label}</span>
            </Button>
          );
        })}
      </div>

    </header>
  );
}
