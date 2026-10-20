import { DEFAULT_SHOWN, SCREEN_IDS, type ShownMap } from "@/lib/reveals";

export type SiteDisplay = {
  shown: ShownMap;
  cricketCode: string;
  /** 0 means nobody has saved shared TV pages yet. */
  updatedAt: number;
};

export function emptySiteDisplay(): SiteDisplay {
  return {
    shown: { ...DEFAULT_SHOWN },
    cricketCode: "",
    updatedAt: 0,
  };
}

export function sanitizeSiteDisplay(raw: unknown): SiteDisplay {
  const base = emptySiteDisplay();
  if (!raw || typeof raw !== "object") return base;
  const record = raw as { shown?: unknown; cricketCode?: unknown; updatedAt?: unknown };
  const shown = { ...DEFAULT_SHOWN };
  if (record.shown && typeof record.shown === "object") {
    const saved = record.shown as Record<string, unknown>;
    for (const id of SCREEN_IDS) {
      if (typeof saved[id] === "boolean") shown[id] = saved[id];
    }
  }
  const cricketCode =
    typeof record.cricketCode === "string" ? record.cricketCode.trim().slice(0, 300) : "";
  if (!cricketCode) shown.cricket = false;
  const updatedAt =
    typeof record.updatedAt === "number" && Number.isFinite(record.updatedAt) && record.updatedAt > 0
      ? Math.floor(record.updatedAt)
      : 0;
  return { shown, cricketCode, updatedAt };
}

/** Merge a partial admin patch into the current display settings. */
export function siteDisplayFromInput(raw: unknown, current: SiteDisplay): SiteDisplay {
  if (!raw || typeof raw !== "object") return current;
  const record = raw as { shown?: unknown; cricketCode?: unknown };
  const nextShown = { ...current.shown };
  let cricketCode = current.cricketCode;

  if (typeof record.cricketCode === "string") {
    cricketCode = record.cricketCode.trim().slice(0, 300);
  }
  if (record.shown && typeof record.shown === "object") {
    const saved = record.shown as Record<string, unknown>;
    for (const id of SCREEN_IDS) {
      if (typeof saved[id] === "boolean") nextShown[id] = saved[id];
    }
  }

  const cricketPatched =
    record.shown &&
    typeof record.shown === "object" &&
    typeof (record.shown as { cricket?: unknown }).cricket === "boolean";

  // A new code turns cricket on unless the patch also sets cricket explicitly.
  if (cricketCode && !current.cricketCode && !cricketPatched) {
    nextShown.cricket = true;
  }
  if (!cricketCode) nextShown.cricket = false;

  return sanitizeSiteDisplay({
    shown: nextShown,
    cricketCode,
    updatedAt: Date.now(),
  });
}
