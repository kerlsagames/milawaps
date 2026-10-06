const DAY = 86_400_000;
const HOUR = 3_600_000;
const MINUTE = 60_000;

export type RemainParts = {
  days: number;
  hours: number;
  minutes: number;
};

export function remainParts(remain: number): RemainParts {
  const safe = Math.max(0, remain);
  return {
    days: Math.floor(safe / DAY),
    hours: Math.floor((safe % DAY) / HOUR),
    minutes: Math.floor((safe % HOUR) / MINUTE),
  };
}

export function remainLabel(parts: RemainParts) {
  const day = parts.days === 1 ? "day" : "days";
  const hour = parts.hours === 1 ? "hour" : "hours";
  const minute = parts.minutes === 1 ? "minute" : "minutes";
  return `${parts.days} ${day}, ${parts.hours} ${hour}, ${parts.minutes} ${minute}`;
}
