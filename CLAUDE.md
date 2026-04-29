# RedeemWise

PWA that helps Indian mutual fund investors decide which funds to redeem when they need money. Calculates tax impact, exit loads, and opportunity cost across the portfolio, then recommends the optimal redemption strategy. Built for a Groww PM case study.

## Modes
- `/` — playground: bring your own funds (MFAPI search, manual entry, localStorage-persisted)
- `/recommend` — playground recommendations (accordion layout, inline insights, Simple/Expert differences)
- `/shanaya` — pre-filled demo with Shanaya's 6 funds, ₹30L portfolio, ₹10L car goal
- `/shanaya/recommend` — Shanaya recommendations dashboard (accordion layout, inline insights)

## Tech stack
- React 18 + React Router v6
- Vite 5 (no TypeScript — plain JSX)
- Tailwind CSS 3 (config-extended; no plugins)
- Client-only, no backend

## Commands
- `npm run dev` — Vite dev server at http://localhost:5173
- `npm run build` — production build to `dist/`
- `npm run preview` — preview the production build

## Project layout
```
src/
├── App.jsx                            # Router + ViewModeProvider; routes /, /recommend, /shanaya, /shanaya/recommend, /how-we-calculate
├── main.jsx                           # Entry, BrowserRouter
├── index.css                          # Tailwind layers + .card / .btn-primary / .btn-secondary + .goal-slider / .whatif-slider / .scrollbar-none
├── context/ViewModeContext.jsx        # Simple/Expert toggle (mode, isSimple, isExpert, setMode, toggle)
├── data/shanaya.js                    # SHANAYA_PORTFOLIO (6 funds, SBI Gold = gold_mf), SHANAYA_PROFILE, GOAL_PURPOSES, TAX_SLABS
├── hooks/
│   └── usePortfolio.js                # localStorage CRUD (add/update/remove/clear), 15-fund cap, derives holdingMonths/totalGains/annualizedReturn from inputs; key: redeemwise.playground.portfolio.v1
├── services/
│   └── mfapi.js                       # searchFunds(query), getFundNAV(schemeCode) — 5s timeout, session-Map cache, swallow errors → []. detectFundType(name) handles equity/elss/hybrid/debt/gold_etf/gold_mf. defaultExitLoad(type) per type.
├── utils/
│   ├── formatCurrency.js              # formatCurrency, formatCurrencyShort, formatPercent, formatHoldingPeriod (Indian comma format)
│   └── useAnimatedNumber.js           # rAF tween hook, 320ms ease-out cubic; drives all currency counters
├── engine/
│   ├── taxCalculator.js               # calculateTax, classifyTax, taxPerRupee, effectiveTaxRate, gainsRatio, LTCG_EXEMPTION_LIMIT, TAX_TYPE_LABELS. No cess — base rates only.
│   ├── exitLoadCalculator.js          # calculateExitLoad, exitLoadRate
│   └── strategies.js                  # runStrategy, runAllStrategies, compareStrategies, STRATEGY_KEYS, STRATEGY_LABELS, STRATEGY_SHORT
├── components/
│   ├── Layout.jsx                     # Sticky brand header + Simple/Expert toggle only. No pill nav — navigation is contextual via text links in each screen.
│   ├── Toggle.jsx                     # Pill toggle (used for view mode)
│   ├── Badge.jsx                      # Variants: equity, elss, debt, hybrid, gold, gold_mf, gold_etf, positive, negative, warning, info, neutral
│   ├── DonutChart.jsx                 # SVG donut + legend, 140×140, stroke 18
│   ├── PortfolioSummary.jsx           # Value, gains, allocation donut (groups elss into equity)
│   ├── FundCard.jsx                   # Compact card: 3px left border in type accent color, subtle gradient tint, 12px/14px padding. Row 1: name + exit load badge + edit/delete. Row 2: type/category badges + holding period. Row 3: gains + current value. Expert adds divider row: annualised return + tax classification. Delete opens in-card confirm overlay (fund name wraps 2 lines).
│   ├── AddFundForm.jsx                # Bottom-sheet modal: 300ms-debounced MFAPI search, type options (equity/elss/hybrid/debt/gold_etf/gold_mf), NAV-based "from units" mode, exit-load defaults (override-aware), inline validation. Legacy 'gold' type migrated to 'gold_mf' on edit.
│   ├── GoalInput.jsx                  # Modal: amount, purpose pills, slab pills. Props: redirectTo (default /shanaya/recommend), highlightSlab (adds Simple/Expert helper copy + tinted bg, used by playground)
│   ├── StrategyAccordionItem.jsx      # Accordion item. Collapsed: name + cost + badges. Expanded: action headline, cost summary (Simple: cost+received; Expert: tax+load=cost), fund rows (Simple: name+amount; Expert: name+amount+full-width progress bar+tax label+% of fund), explanation, inline insights, "Read less" collapse button.
│   ├── GoalAdjuster.jsx               # ₹1L–₹30L slider + ± buttons, ₹50K step; reused inside GoalEditPopover
│   ├── GoalEditPopover.jsx            # Modal sheet hosting GoalAdjuster + slab pills; opened by edit icon in sticky toolbar
│   ├── WhatIfSlider.jsx               # 0–12 month holding-period slider; shifts funds, surfaces threshold crossings, explains zero-savings case
│   └── SmartSuggestions.jsx           # Cross-FY split, wait-to-save, tax-loss-harvest, SIP FIFO note (conditional, except SIP)
└── screens/
    ├── Playground.jsx                 # Empty state (+ Add Fund CTA, two text links: sample portfolio + how we calculate). Portfolio grid: FundCard with edit/delete, "+ Add fund" dashed button above grid, clear-all confirm. Simple mode shows tax info banner. Sticky "I need to withdraw money" → GoalInput → /recommend.
    ├── Shanaya.jsx                    # Greeting, summary, fund grid, "Build your own →" link, sticky CTA. Simple mode shows tax info banner. Consumes location.state.reopenGoal once.
    ├── Recommendations.jsx            # source="shanaya"|"playground" prop. Accordion strategy list (all start collapsed, tap to expand, tap again to collapse, "Read less" at bottom of expanded card). Non-active cards dim to opacity-60 (still clickable). Disclaimer line + "What's included and excluded?" link to /how-we-calculate at bottom.
    └── HowWeCalculate.jsx             # Four sections (Simple/Expert variants): What this tool does, How tax is calculated (Expert: full tax table), Important limitations, Recommendation logic (Expert: score formula). Footer disclaimer. Back arrow navigates -1.
```

## Design system (Tailwind config)
Colors are extended in `tailwind.config.js`. Use these tokens, not hex:
- `primary-green` `#00D09C` — CTAs, gains, positive
- `logo-green` `#08F6B6` — accents
- `brand-blue` `#5367F5` — secondary, links, Recommended badge
- `accent-blue-light` / `accent-blue-lightest` — info badges / tints
- `bg-white` / `bg-surface` / `bg-surface-dark` — bg, cards, hover
- `text-primary` / `text-secondary`
- `positive` / `negative` / `warning`

Typography: DM Sans (Google Fonts, loaded in `index.html`).
Cards: `rounded-card` (12px) + `shadow-card` (subtle), or `.card` utility.
Layout: mobile-first, container `max-w-app` (1000px), sticky CTA on `<sm`.
Animation: `animate-fade-in` keyframe (220ms ease-out, 4px translateY) is set on the strategy detail card and accordion bodies.

## Indian formatting
- Currency uses `Intl.NumberFormat('en-IN')` → `₹10,00,000` (not `₹1,000,000`).
- `formatCurrencyShort` rolls into `K / L / Cr`.
- Percentages are 1 decimal place by default.
- All currency rounds to whole rupees in user-facing strings.

## Phased build plan
- **Phase 1 — DONE**: Foundation, Groww design system, Shanaya portfolio display, summary card with donut, goal input modal, Simple/Expert toggle (UI only).
- **Phase 2 — DONE**: Tax engine, exit load calculator, 4 strategies, Recommendations screen at `/shanaya/recommend`, Simple/Expert explanations.
- **Phase 3 — DONE**: Compact redesign of `/shanaya/recommend`. Sticky sub-toolbar, `GoalEditPopover`, `WhatIfSlider` + `SmartSuggestions` inline. `useAnimatedNumber` rAF tween.
- **Phase 4 — DONE**: Playground mode at `/`. `mfapi.js`, `usePortfolio.js` (localStorage), `Playground.jsx`, `AddFundForm.jsx`. `Recommendations` data-source agnostic via `source` prop. Routes: `/` → Playground, `/recommend` → playground recs.
- **Phase 4.5 — SKIPPED**: Deferred to V2 (noted in write-up).
- **Phase 5 — PARTIALLY DONE**:
  - ✅ Hybrid fund type (35–65% equity, 24mo LTCG, no exemption) + Gold ETF vs Gold MF split (12mo vs 24mo LTCG) — engine, strategies, AddFundForm, Badge, FundCard, mfapi
  - ✅ Tax logic validated: Finance Act 2024, Section 50AA (debt), Section 112A (equity/ELSS LTCG), Section 112 (hybrid/gold LTCG), Budget 2026 unchanged
  - ✅ Cess removed from all calculations. Base rates only. Surcharge excluded.
  - ✅ "How We Calculate" page at `/how-we-calculate` — 4 sections, Simple/Expert variants, tax table (Expert), sources cited
  - ✅ Recommendations disclaimer: single line + "What's included and excluded?" link
  - ✅ Tax visibility on portfolio screens: Simple mode info banner, Expert mode per-card tax classification
  - ✅ FundCard redesign: compact 2/3-row layout, 3px type-accent left border, subtle gradient tint, no label clutter
  - ✅ Header cleaned up: removed Your Portfolio/Sample Demo toggle; navigation via contextual text links
  - ✅ Accordion UX: non-active cards clickable (opacity-60, not pointer-events-none), "Read less" at bottom of expanded card
  - ⏳ PWA manifest + service worker
  - ⏳ Vercel deploy with SPA fallback (`vercel.json` rewrite all paths → `/index.html`)

## Tax rules (FY 2025-26)
| Fund type | STCG condition | STCG rate | LTCG condition | LTCG rate | ₹1.25L exemption |
|---|---|---|---|---|---|
| equity (≥65% equity) | ≤12 mo | 20% (§111A) | >12 mo | 12.5% (§112A) | YES, shared |
| elss | lock-in 36mo | N/A | >36 mo | 12.5% (§112A) | YES, shared |
| hybrid (35–65% equity) | ≤24 mo | slab rate | >24 mo | 12.5% (§112) | NO |
| debt (post Apr 2023, §50AA) | any holding | slab rate | never | N/A | NO |
| gold_etf (listed) | ≤12 mo | slab rate | >12 mo | 12.5% (§112) | NO |
| gold_mf (FoF, unlisted) | ≤24 mo | slab rate | >24 mo | 12.5% (§112) | NO |

Critical: ₹1.25L LTCG exemption is **annual and shared** across equity + ELSS only (§112A). Hybrid/gold LTCG falls under §112 — no exemption. Debt always slab (§50AA, Finance Act 2023). Cess (4%) and surcharge excluded from calculations — depend on total income, not isolatable per transaction. Exit load on redemption value. FIFO on units. Source: Finance (No. 2) Act 2024, confirmed unchanged Budget 2026.

## Strategy algorithms
1. **Save on Tax** — sort by effective tax-per-rupee ascending; pre-promote the equity fund with highest gains so the shared ₹1.25L exemption lands where it bites hardest.
2. **Avoid Penalties** — zero exit-load funds first, then lowest exit-load %; tiebreaker by tax efficiency.
3. **Keep Winners** — sort by annualised return ascending (worst performers first); tiebreaker by lower tax-per-rupee.
4. **Smart Balance (Recommended)** — `score = taxRatePerRupee + exitLoadRate + 0.3 × annualisedReturn`; sort ascending. Greedy redeem until target met; partial redemption allowed on the last fund.

All four share an `executeOrderedRedemption` walker that decrements the shared ₹1.25L exemption pool as equity-LTCG funds are redeemed and supports partial redemption on the last fund.

## Conventions
- Indian-format currency everywhere user-facing; whole rupees only.
- Use Tailwind tokens, not raw hex.
- Mobile-first; check 375px and ≥md breakpoints when adding screens.
- Don't add a backend. All calc is client-side.
- Keep new components small and composable; reuse `Badge`, `Toggle`, `DonutChart`.
- Simple/Expert mode lives in `useViewMode()`; gate Expert-only details behind `isExpert`.
- Use `tabular-nums` on any class that holds a currency value so digits don't jitter under animated counters.

## Engine API
- `calculateTax(fund, redemptionAmount, remainingExemption, slabRate)` → `{ tax, taxType, gainsRedeemed, exemptionUsed, taxableGains }`. `taxType` ∈ `LTCG_EQUITY | STCG_EQUITY | DEBT_SLAB | LTCG_GOLD | STCG_GOLD | LTCG_HYBRID | STCG_HYBRID | LTCG_GOLD_ETF | STCG_GOLD_ETF`. No cess multiplier.
- `calculateExitLoad(fund, redemptionAmount)` → rupees (0 once `holdingMonths >= exitLoadPeriodMonths`).
- `runStrategy(key, funds, goal, slab)` / `runAllStrategies(funds, goal, slab)` → plans of shape `{ key, label, shortLabel, isRecommended, funds: [...lines], totalTax, totalExitLoad, totalCost, totalRedeemed, netAmountReceived, goalMet, shortfall, explanation: { simple, expert } }`. Each line includes `percentOfFund`, `taxTypeLabel`, `exemptionUsed`, `gainsRedeemed`, `taxableGains`.
- `compareStrategies(plans)` → `{ bestKey, bestLabel, worstKey, worstLabel, savings }`.

## Recommendations screen state
`Recommendations.jsx` owns four pieces of UI state and derives everything else with `useMemo`:
- `goal` (initialised from `location.state.goal`, mutated by `GoalEditPopover`)
- `taxSlab` (same)
- `monthsToWait` (driven by `WhatIfSlider` — now inline in expanded card)
- `activeKey` (driven by accordion expand/collapse; `null` = all collapsed)

Derived: `baselinePlans` (current holding), `shiftedFunds` (`shiftFunds(SHANAYA_PORTFOLIO, monthsToWait)`), `waitedPlans` (re-runs all 4 strategies on shifted funds; equals baseline when `monthsToWait === 0`), and a `bestWait` scan that sweeps 0–12mo on Smart Balance to feed the wait-to-save tip.

Behavior: all 4 strategies start collapsed. Tap one to expand (closes others). Tap again to collapse (or use "Read less" button at card bottom). Non-active cards dim to `opacity-60` but remain clickable — tapping any collapses the open one and expands the tapped one.

## Demo flow gotcha
Smart Balance scoring deeply penalises gold (37% annualised return × 0.3 = 11.1% opportunity-cost hit), so at the default ₹10L Shanaya goal the engine never redeems the gold fund — meaning the WhatIfSlider's *cost* number stays flat even when the gold fund crosses the 24-month LTCG threshold at +7mo. This was confusing as "NO CHANGE / ₹0", so the slider now shows an honest message: *"Same total cost (₹X) for this strategy. The fund listed below crosses a tax/load threshold at +Nmo, but this strategy isn't redeeming it at your current goal. Try a higher goal or a different strategy to unlock the saving."* To demo the gold "aha", drag the GoalAdjuster up to ~₹28L; gold then enters the redemption set and waiting +7mo drops cost ₹102,375 → ₹94,500 (₹7,875 saved as STCG slab → LTCG 12.5% on the partial gold redemption).

## Sanity-check numbers (₹10L, 30% slab, default Shanaya portfolio)
| Strategy | Total cost | Notes |
|---|---|---|
| Save on Tax | ₹21,757 | UTI Nifty (full ₹7.2L, exemption applied) + HDFC Corp Bond (₹2.8L) |
| Avoid Penalties | ₹21,410 | Cheapest. HDFC + Axis ELSS (catches the exemption — only ₹625 tax) + UTI |
| Keep Winners | ₹21,583 | HDFC + UTI (worst annualised at 7.6%) |
| Smart Balance | ₹21,583 | Same as Keep Winners at this goal |

Spread is small here because no exit loads trigger. At ~₹28L the spread widens dramatically once gold enters the picture.

## Playground data flow
- `usePortfolio()` is the single source of truth — holds the array, mirrors to `localStorage` (key `redeemwise.playground.portfolio.v1`) on every change, and re-derives `holdingMonths`/`totalGains`/`annualizedReturn` from raw inputs (`investmentDate`, `amountInvested`, `currentValue`) on read so user-facing numbers stay accurate as time passes.
- `Playground.jsx` mounts the hook and renders empty state → `AddFundForm` (add) or grid + `AddFundForm` (edit). Submit calls `addFund`/`updateFund`. The "+ add another" tile is disabled at `MAX_FUNDS = 15`.
- "I need to withdraw money" → `GoalInput` with `redirectTo="/recommend"` and `highlightSlab` → navigates with `state: { goal, taxSlab, goalPurpose }`.
- `Recommendations` with `source="playground"` calls `usePortfolio()` itself (not via prop) so localStorage edits are picked up live; the `<Navigate to="/" replace />` guard fires when goal ≤ 0 *or* the portfolio has zero funds.
- MFAPI calls in `AddFundForm` fail open: a timeout/error returns `[]` for search and `null` for NAV, which the form renders as "enter manually" copy. **Manual entry must always work even when MFAPI is down — don't add a hard dependency.**

## MFAPI gotchas
- `https://api.mfapi.in/mf/search?q=...` returns `[{ schemeCode, schemeName }]`. We require ≥3 chars, debounce 300ms, and cap rendered results at 12.
- `https://api.mfapi.in/mf/{schemeCode}` returns `{ meta, data: [{ date: 'DD-MM-YYYY', nav: '123.4567' }, ...] }`. We take `data[0]` for the latest NAV; `parseMfapiDate` handles the DD-MM-YYYY format because `new Date('DD-MM-YYYY')` is `Invalid Date` in Safari.
- Both functions wrap `fetch` in a 5000ms timeout via `withTimeout` and cache by query string / scheme code in module-level `Map`s — fine because the cache is session-scoped and the dataset is read-only.

## Architectural notes (do not regress)
- **No TDS for resident Indians.** Tax is paid at ITR filing, not at redemption. Users receive full redemption amount.
- **Cess excluded.** 4% Health & Education Cess depends on aggregate tax liability across all income — cannot be isolated per capital gains transaction.
- **Surcharge excluded.** Only applies if total income > ₹50L. Not relevant for most users.
- **SIP FIFO simplification.** Prototype assumes lump-sum investment. Each SIP installment has its own holding period (SEBI mandate). Flagged in "How We Calculate" and SmartSuggestions.
- **What-if slider mechanism.** Only changes cost when a tax threshold (STCG→LTCG) or exit load window is crossed by the waiting period. NAV drift is not modelled. Zero-savings case has honest copy explaining which fund crossed a threshold but isn't being redeemed at the current goal.
- **Legacy `gold` type.** Old localStorage entries and any `type: 'gold'` data are handled by `classifyTax` alias to `gold_mf` and migrated to `gold_mf` in `AddFundForm.defaultState`.

## Where to pick up next
Phase 5 remaining:
1. PWA — `manifest.webmanifest`, icons, service worker. Cache MFAPI search responses for offline.
2. Vercel deploy — `vercel.json` rewrite all paths → `/index.html`; smoke-test `/recommend` and `/shanaya/recommend` direct visits (state-missing redirects already coded).

Post-deployment:
3. Write-up (300–700 words, 1-pager)
4. Prompts document
5. Evals document
