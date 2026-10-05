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
  const markers = new Set(CLASS_MILESTONES.map((milestone) => milestone.points));
  const crossCount = Math.max(0, Math.min(UNIT_MAX, crosses));
  const earned = Math.max(0, Math.min(UNIT_MAX, score + crossCount));
  const crossFrom = UNIT_MAX - crossCount;

  return (
    <div
      role="img"
      aria-label={`${label}: tally ${score}. ${earned} ticks on the sheet, ${crossCount} crosses. A cross does not erase a tick.`}
      className="grid gap-0.5"
      style={{ gridTemplateColumns: "repeat(15, minmax(0, 1fr))" }}
    >
      {Array.from({ length: UNIT_MAX }, (_, index) => {
        const crossed = crossCount > 0 && index >= crossFrom;
        const filled = index < earned;
        const marker = markers.has(index + 1);
        return (
          <span
            key={index}
            className={cn(
              "relative aspect-square rounded-[3px] border",
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
