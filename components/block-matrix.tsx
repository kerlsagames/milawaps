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
      aria-label={`${label}: ${score} of ${UNIT_MAX} spaces filled`}
      className="grid grid-cols-11 gap-1"
    >
      {Array.from({ length: UNIT_MAX }, (_, index) => {
        const filled = index < score;
        const marker = markers.has(index + 1);
        return (
          <span
            key={index}
            className={cn(
              "aspect-square rounded-[3px] border transition-all duration-300",
              filled ? "scale-100 border-transparent" : "scale-90 border-white/10 bg-white/5",
              marker && !filled && "border-dashed",
            )}
            style={{
              backgroundColor: filled ? color : undefined,
              borderColor: marker && !filled ? color : undefined,
              boxShadow: filled ? `0 0 10px ${color}88` : undefined,
              transitionDelay: filled ? `${(index % 11) * 10}ms` : "0ms",
            }}
          />
        );
      })}
    </div>
  );
}
