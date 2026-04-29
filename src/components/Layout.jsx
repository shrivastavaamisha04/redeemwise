import Toggle from './Toggle.jsx';
import { useViewMode } from '../context/ViewModeContext.jsx';

const MODE_OPTIONS = [
  { label: 'Simple', value: 'simple' },
  { label: 'Expert', value: 'expert' },
];

export default function Layout({ children }) {
  const { mode, setMode } = useViewMode();

  return (
    <div className="min-h-screen bg-bg-white flex flex-col">
      <header className="sticky top-0 z-30 bg-bg-white/85 backdrop-blur border-b border-bg-surface">
        <div className="mx-auto w-full max-w-app px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary-green text-white font-bold shrink-0"
              aria-hidden
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="4 16 10 9 14 13 20 6" />
              </svg>
            </span>
            <div className="leading-tight min-w-0">
              <div className="text-base font-bold text-text-primary tracking-tight">
                RedeemWise
              </div>
              <div className="text-[10px] uppercase tracking-wider text-text-secondary font-semibold">
                Smart MF redemption
              </div>
            </div>
          </div>
          <Toggle
            options={MODE_OPTIONS}
            value={mode}
            onChange={setMode}
            ariaLabel="View mode"
          />
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-app px-4 sm:px-6 py-5 pb-32 sm:pb-10">
        {children}
      </main>
    </div>
  );
}
