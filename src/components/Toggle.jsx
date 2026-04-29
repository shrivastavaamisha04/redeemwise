export default function Toggle({ options, value, onChange, ariaLabel }) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="inline-flex items-center bg-bg-surface rounded-full p-1 gap-1"
    >
      {options.map((opt) => {
        const isActive = opt.value === value;
        return (
          <button
            key={opt.value}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(opt.value)}
            className={[
              'px-3 py-1.5 text-xs font-semibold rounded-full transition-all',
              isActive
                ? 'bg-white text-text-primary shadow-card'
                : 'text-text-secondary hover:text-text-primary',
            ].join(' ')}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
