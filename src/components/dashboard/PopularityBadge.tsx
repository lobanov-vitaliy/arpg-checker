interface PopularityBadgeProps {
  score: number;
  glowColor: string;
  tooltip: string;
}

function getTier(score: number): string {
  if (score >= 80) return "S";
  if (score >= 60) return "A";
  if (score >= 40) return "B";
  if (score >= 20) return "C";
  return "D";
}

export function PopularityBadge({ score, glowColor, tooltip }: PopularityBadgeProps) {
  const tier = getTier(score);
  const filled = Math.round((score / 100) * 5);

  return (
    <div className="relative group flex items-center gap-1.5 shrink-0 cursor-default">
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }, (_, i) => (
          <div
            key={i}
            className="w-1.5 h-3 rounded-sm"
            style={{
              backgroundColor: i < filled ? glowColor : `${glowColor}25`,
            }}
          />
        ))}
      </div>
      <span
        className="text-xs font-bold w-4 text-center"
        style={{ color: glowColor }}
      >
        {tier}
      </span>

      {/* Tooltip */}
      <div className="absolute bottom-full right-0 mb-1.5 w-56 z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        <div className="bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-xs text-gray-300 leading-snug shadow-xl">
          {tooltip}
        </div>
      </div>
    </div>
  );
}
