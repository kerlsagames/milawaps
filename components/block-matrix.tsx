import { Trophy } from "lucide-react";
import { CLASS_MILESTONES, UNIT_MAX } from "@/lib/game";
import { cn } from "@/lib/utils";

export function BlockMatrix({
  score,
  crosses,
  color,
  label,
}: {
  score: number;
  crosses: number;
  color: string;
  label: string;
}) {
  const crossCount = Math.max(0, Math.min(UNIT_MAX, crosses));
  const earned = Math.max(0, Math.min(UNIT_MAX, score + crossCount));
  const crossFrom = UNIT_MAX - crossCount;
  const trophies = new Map<number, (typeof CLASS_MILESTONES)[number]>();
  for (const milestone of CLASS_MILESTONES) {
    const shifted = Math.min(UNIT_MAX, milestone.points + crossCount);
    const square = shifted > crossFrom ? crossFrom : shifted;
    if (square >= 1 && !trophies.has(square)) trophies.set(square, milestone);
  }

  return (
    <div
      role="img"
      aria-label={`${label}: tally ${score}. ${earned} ticks on the sheet, ${crossCount} crosses. A cross does not erase a tick.`}
      className="grid gap-1"
      style={{ gridTemplateColumns: "repeat(10, minmax(0, 1fr))" }}
    >
      {Array.from({ length: UNIT_MAX }, (_, index) => {
        const square = index + 1;
        const crossed = crossCount > 0 && index >= crossFrom;
        const filled = index < earned;
        const milestone = trophies.get(square);
        const won = Boolean(milestone && score >= milestone.points);
        const marker = trophies.has(square);
        return (
          <span
            key={index}
            title={milestone ? `${milestone.points} ${milestone.title}` : undefined}
            className={cn(
              "relative aspect-square rounded-md border",
              filled && "border-transparent",
              !filled && !crossed && "border-black/10 bg-black/5",
              crossed && !filled && "border-[#c23b3b]/50 bg-[#c23b3b]/15",
              crossed && filled && "border-[#9b1c1c]",
              marker && !filled && !crossed && "border-dashed",
            )}
            style={{
              backgroundColor: filled ? color : undefined,
              borderColor: marker && !filled && !crossed ? color : undefined,
            }}
          >
            {milestone && !crossed && (
              <Trophy
                aria-hidden="true"
                className="absolute inset-[16%]"
                strokeWidth={2.4}
                style={{ color: won ? (filled ? "#2a1c04" : "#f5b942") : "#c8b89a" }}
              />
            )}
            {crossed && (
              <svg viewBox="0 0 10 10" className="absolute inset-[12%]" aria-hidden="true">
                <path
                  d="M1.2 1.2 L8.8 8.8 M8.8 1.2 L1.2 8.8"
                  stroke="#9b1c1c"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                />
              </svg>
            )}
          </span>
        );
      })}
    </div>
  );
}
