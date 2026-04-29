const SEARCH_URL = 'https://api.mfapi.in/mf/search';
const SCHEME_URL = 'https://api.mfapi.in/mf';
const TIMEOUT_MS = 5000;

const searchCache = new Map();
const navCache = new Map();

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms);
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      }
    );
  });
}

export async function searchFunds(query) {
  const q = (query ?? '').trim();
  if (q.length < 3) return [];
  const cacheKey = q.toLowerCase();
  if (searchCache.has(cacheKey)) return searchCache.get(cacheKey);

  try {
    const res = await withTimeout(
      fetch(`${SEARCH_URL}?q=${encodeURIComponent(q)}`),
      TIMEOUT_MS
    );
    if (!res.ok) throw new Error(`status ${res.status}`);
    const data = await res.json();
    const normalized = Array.isArray(data)
      ? data
          .filter((d) => d && d.schemeCode && d.schemeName)
          .map((d) => ({
            schemeCode: String(d.schemeCode),
            schemeName: String(d.schemeName),
          }))
      : [];
    searchCache.set(cacheKey, normalized);
    return normalized;
  } catch {
    return [];
  }
}

function parseMfapiDate(str) {
  if (!str || typeof str !== 'string') return null;
  const [dd, mm, yyyy] = str.split('-');
  if (!dd || !mm || !yyyy) return null;
  return new Date(`${yyyy}-${mm}-${dd}`);
}

export async function getFundNAV(schemeCode) {
  if (!schemeCode) return null;
  const key = String(schemeCode);
  if (navCache.has(key)) return navCache.get(key);

  try {
    const res = await withTimeout(
      fetch(`${SCHEME_URL}/${encodeURIComponent(key)}`),
      TIMEOUT_MS
    );
    if (!res.ok) throw new Error(`status ${res.status}`);
    const data = await res.json();
    const latest = data?.data?.[0];
    if (!latest || !latest.nav) throw new Error('no nav');
    const navDate = parseMfapiDate(latest.date);
    const result = {
      currentNAV: Number(latest.nav),
      navDate,
      schemeName: data?.meta?.scheme_name ?? null,
    };
    navCache.set(key, result);
    return result;
  } catch {
    return null;
  }
}

export function detectFundType(name) {
  if (!name) return 'equity';
  const n = name.toLowerCase();
  if (n.includes('elss') || n.includes('tax saver')) return 'elss';
  if (n.includes('gold etf') || n.includes('gold exchange')) return 'gold_etf';
  if (n.includes('gold') || n.includes('silver')) return 'gold_mf';
  if (
    n.includes('balanced') ||
    n.includes('dynamic asset') ||
    n.includes('balanced advantage') ||
    n.includes(' baf') ||
    n.includes('multi asset')
  ) return 'hybrid';
  if (
    n.includes('bond') ||
    n.includes('debt') ||
    n.includes('liquid') ||
    n.includes('corporate') ||
    n.includes('gilt') ||
    n.includes('money market') ||
    n.includes('credit risk') ||
    n.includes('banking & psu') ||
    n.includes('banking and psu') ||
    n.includes('overnight') ||
    n.includes('ultra short') ||
    n.includes('short duration') ||
    n.includes('low duration') ||
    n.includes('income fund')
  ) {
    return 'debt';
  }
  return 'equity';
}

export function defaultExitLoad(type) {
  switch (type) {
    case 'elss':
      return { exitLoadPercent: 0, exitLoadPeriodMonths: 36 };
    case 'debt':
      return { exitLoadPercent: 0.5, exitLoadPeriodMonths: 6 };
    case 'gold_etf':
      return { exitLoadPercent: 0, exitLoadPeriodMonths: 0 };
    case 'gold_mf':
    case 'gold':
      return { exitLoadPercent: 0.5, exitLoadPeriodMonths: 12 };
    case 'hybrid':
    case 'equity':
    default:
      return { exitLoadPercent: 1, exitLoadPeriodMonths: 12 };
  }
}
