const VARIANTS = {
  equity: 'bg-primary-green/15 text-primary-green',
  debt: 'bg-brand-blue/15 text-brand-blue',
  gold: 'bg-warning/15 text-warning',
  gold_mf: 'bg-warning/15 text-warning',
  gold_etf: 'bg-warning/20 text-warning',
  hybrid: 'bg-accent-blue-lightest text-brand-blue',
  elss: 'bg-primary-green/15 text-primary-green',
  positive: 'bg-positive/15 text-positive',
  negative: 'bg-negative/15 text-negative',
  warning: 'bg-warning/15 text-warning',
  info: 'bg-accent-blue-lightest text-brand-blue',
  neutral: 'bg-bg-surface-dark text-text-secondary',
};

export default function Badge({ variant = 'neutral', children, className = '' }) {
  const styles = VARIANTS[variant] ?? VARIANTS.neutral;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold leading-5 ${styles} ${className}`}
    >
      {children}
    </span>
  );
}
