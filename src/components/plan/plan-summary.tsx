export function PlanSummary({
  areaLabel,
  min,
  max,
  duration,
}: {
  areaLabel: string | null;
  min: number;
  max: number | null;
  duration: number;
}) {
  return (
    <div className="mt-3 flex flex-wrap gap-2 text-sm text-ink/70">
      <span className="rounded-full bg-ink/5 px-3 py-1.5">{min} mín.</span>
      {max && (
        <span className="rounded-full bg-ink/5 px-3 py-1.5">{max} máx.</span>
      )}
      <span className="rounded-full bg-ink/5 px-3 py-1.5">{duration} min</span>
      {areaLabel && (
        <span className="rounded-full bg-ink/5 px-3 py-1.5">
          📍 {areaLabel}
        </span>
      )}
    </div>
  );
}
