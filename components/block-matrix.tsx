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
  const crossFrom = UNIT_MAX - crossCount;

  return (
    <div
      role="img"
      aria-label={`${label}: ${score} of ${UNIT_MAX} ticks, ${crossCount} crosses`}
      className="grid gap-0.5"
      style={{ gridTemplateColumns: "repeat(15, minmax(0, 1fr))" }}
    >
      {Array.from({ length: UNIT_MAX }, (_, index) => {
        const crossed = index >= crossFrom;
        const filled = index < score;
        const marker = markers.has(index + 1);
        return (
          <span
            key={index}
            className={cn(
              "relative aspect-square rounded-[3px] border",
              filled && !crossed && "border-transparent",
              !filled && !crossed && "border-black/10 bg-black/5",
              crossed && "border-[#c23b3b]/50 bg-[#c23b3b]/15",
              marker && !filled && !crossed && "border-dashed",
            )}
            style={{
              backgroundColor: filled && !crossed ? color : undefined,
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
