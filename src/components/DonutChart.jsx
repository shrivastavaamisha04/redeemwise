const SIZE = 140;
const STROKE = 18;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function DonutChart({ segments, centerLabel, centerValue }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  let offset = 0;

  return (
    <div className="flex items-center gap-5">
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="#EBEBEB"
            strokeWidth={STROKE}
          />
          {total > 0 &&
            segments.map((segment) => {
              const fraction = segment.value / total;
              const length = fraction * CIRCUMFERENCE;
              const dasharray = `${length} ${CIRCUMFERENCE - length}`;
              const dashoffset = -offset;
              offset += length;
              return (
                <circle
                  key={segment.label}
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={RADIUS}
                  fill="none"
                  stroke={segment.color}
                  strokeWidth={STROKE}
                  strokeDasharray={dasharray}
                  strokeDashoffset={dashoffset}
                  transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
                  strokeLinecap="butt"
                />
              );
            })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          {centerLabel && (
            <div className="text-[10px] font-semibold uppercase tracking-wide text-text-secondary">
              {centerLabel}
            </div>
          )}
          {centerValue && (
            <div className="text-base font-bold text-text-primary leading-tight mt-0.5">
              {centerValue}
            </div>
          )}
        </div>
      </div>
      <ul className="flex flex-col gap-2 text-sm">
        {segments.map((segment) => {
          const pct = total > 0 ? (segment.value / total) * 100 : 0;
          return (
            <li key={segment.label} className="flex items-center gap-2">
              <span
                className="inline-block w-3 h-3 rounded-sm"
                style={{ backgroundColor: segment.color }}
                aria-hidden
              />
              <span className="text-text-primary font-medium">{segment.label}</span>
              <span className="text-text-secondary text-xs">{pct.toFixed(0)}%</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
