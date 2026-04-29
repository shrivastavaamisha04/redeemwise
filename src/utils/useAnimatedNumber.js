import { useEffect, useRef, useState } from 'react';

const DEFAULT_DURATION = 320;

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

export function useAnimatedNumber(target, { duration = DEFAULT_DURATION } = {}) {
  const [value, setValue] = useState(target);
  const fromRef = useRef(target);
  const startRef = useRef(performance.now());
  const rafRef = useRef(null);

  useEffect(() => {
    if (target === value) return;
    fromRef.current = value;
    startRef.current = performance.now();
    cancelAnimationFrame(rafRef.current);

    const tick = (now) => {
      const elapsed = now - startRef.current;
      const t = Math.min(1, elapsed / duration);
      const eased = easeOutCubic(t);
      const next = fromRef.current + (target - fromRef.current) * eased;
      setValue(t === 1 ? target : next);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration]);

  return value;
}
