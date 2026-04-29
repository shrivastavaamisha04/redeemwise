import { createContext, useContext, useMemo, useState } from 'react';

const ViewModeContext = createContext(null);

export function ViewModeProvider({ children }) {
  const [mode, setMode] = useState('simple');

  const value = useMemo(
    () => ({
      mode,
      isSimple: mode === 'simple',
      isExpert: mode === 'expert',
      setMode,
      toggle: () => setMode((m) => (m === 'simple' ? 'expert' : 'simple')),
    }),
    [mode]
  );

  return <ViewModeContext.Provider value={value}>{children}</ViewModeContext.Provider>;
}

export function useViewMode() {
  const ctx = useContext(ViewModeContext);
  if (!ctx) throw new Error('useViewMode must be used inside ViewModeProvider');
  return ctx;
}
