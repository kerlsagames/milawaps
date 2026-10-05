import { CLASS_MILESTONES, UNIT_MAX } from "@/lib/game";
import { cn } from "@/lib/utils";

export function BlockMatrix({
  score,
  color,
  label,
}: {
  score: number;
  color: string;
  label: string;
}) {
  const markers = new Set(CLASS_MILESTONES.map((milestone) => milestone.points));

  return (
    <div
      role="img"
      aria-label={`${label}: ${score} of ${UNIT_MAX} ticks filled`}
      className="grid grid-cols-10 gap-1"
    >
      {Array.from({ length: UNIT_MAX }, (_, index) => {
        const filled = index < score;
        const marker = markers.has(index + 1);
        return (
          <span
            key={index}
            className={cn(
              "aspect-square rounded-[4px] border transition-all duration-300",
              filled ? "scale-100 border-transparent" : "scale-95 border-black/10 bg-black/5",
              marker && !filled && "border-dashed",
            )}
            style={{
              backgroundColor: filled ? color : undefined,
              borderColor: marker && !filled ? color : undefined,
              boxShadow: filled ? `0 0 8px ${color}66` : undefined,
              transitionDelay: filled ? `${(index % 10) * 12}ms` : "0ms",
            }}
          />
        );
      })}
    </div>
  );
}
