# RedeemWise

**Smart mutual fund redemption planner for Indian investors.**

Helps you decide *which* funds to redeem when you need money — calculating capital gains tax, exit loads, and opportunity cost across your portfolio, then recommending the optimal strategy.

Built as a Groww PM case study.

---

## What it does

- Models 4 redemption strategies: Save on Tax, Avoid Penalties, Keep Winners, Smart Balance
- Applies Finance Act 2024 tax rules (equity, ELSS, hybrid, debt, Gold ETF, Gold MF)
- Accounts for the shared ₹1.25L LTCG exemption (§112A) across equity/ELSS
- Calculates exit loads per fund type and holding period
- "What if I wait?" slider — shows tax savings from crossing STCG→LTCG thresholds
- Simple/Expert mode toggle for different audiences

## Modes

| Route | Description |
|---|---|
| `/` | Playground — add your own funds via MFAPI search or manual entry |
| `/recommend` | Redemption recommendations for your playground portfolio |
| `/shanaya` | Pre-filled demo: Shanaya's 6-fund ₹30L portfolio, ₹10L car goal |
| `/shanaya/recommend` | Recommendations dashboard for the demo portfolio |
| `/how-we-calculate` | Tax logic, exit load rules, strategy explainer |

## Tech stack

- React 18 + React Router v6
- Vite 5 (plain JSX, no TypeScript)
- Tailwind CSS 3
- Client-only — no backend, no auth

## Running locally

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build → dist/
npm run preview  # preview production build
```

## Tax rules implemented (FY 2025-26)

| Fund type | LTCG threshold | LTCG rate | ₹1.25L exemption |
|---|---|---|---|
| Equity (≥65%) | >12 months | 12.5% §112A | Yes |
| ELSS | >36 months | 12.5% §112A | Yes |
| Hybrid (35–65%) | >24 months | 12.5% §112 | No |
| Debt (§50AA) | any holding | slab rate | No |
| Gold ETF | >12 months | 12.5% §112 | No |
| Gold MF (FoF) | >24 months | 12.5% §112 | No |

Cess (4%) and surcharge excluded — depend on total income, not isolatable per transaction.

---

*RedeemWise is a planning tool, not financial or tax advice. Consult a qualified CA before making redemption decisions.*
