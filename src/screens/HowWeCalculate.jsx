import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import { useViewMode } from '../context/ViewModeContext.jsx';

function Section({ title, children }) {
  return (
    <section className="space-y-3">
      <h2
        className="text-[15px] font-medium text-text-primary bg-bg-surface mb-3"
        style={{ borderLeft: '3px solid #00D09C', padding: '8px 12px', borderRadius: '0 6px 6px 0' }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function P({ children }) {
  return <p className="text-sm text-text-secondary leading-relaxed">{children}</p>;
}

export default function HowWeCalculate() {
  const navigate = useNavigate();
  const { isExpert } = useViewMode();

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1 text-sm font-semibold text-text-secondary hover:text-text-primary"
          >
            <span aria-hidden>←</span>
          </button>
          <h1 className="text-xl font-bold text-text-primary tracking-tight">How we calculate</h1>
        </div>

        {/* Section 1 */}
        <Section title="What this tool does">
          {isExpert ? (
            <P>
              RedeemWise models capital gains tax liability, exit load costs, and opportunity cost for each fund in your portfolio. It generates redemption combinations across four strategies (tax-minimising, penalty-free, performance-preserving, and blended) using a greedy allocation algorithm that prioritises lowest-cost funds first until the target redemption amount is met.
            </P>
          ) : (
            <P>
              RedeemWise helps you figure out the smartest way to withdraw money from your mutual funds. We look at three things for each fund: how much tax you'd pay, whether there's a penalty for withdrawing early, and how well the fund has been performing. We then find the combination that costs you the least.
            </P>
          )}
        </Section>

        {/* Section 2 */}
        <Section title="How tax is calculated">
          {isExpert ? (
            <>
              <div className="overflow-x-auto -mx-4 px-4">
                <table className="w-full text-xs border-collapse min-w-[560px]">
                  <thead>
                    <tr className="border-b border-bg-surface-dark">
                      <th className="text-left py-2 pr-3 font-semibold text-text-secondary">Fund type</th>
                      <th className="text-left py-2 pr-3 font-semibold text-text-secondary">STCG condition</th>
                      <th className="text-left py-2 pr-3 font-semibold text-text-secondary">STCG rate</th>
                      <th className="text-left py-2 pr-3 font-semibold text-text-secondary">LTCG condition</th>
                      <th className="text-left py-2 pr-3 font-semibold text-text-secondary">LTCG rate</th>
                      <th className="text-left py-2 font-semibold text-text-secondary">₹1.25L exemption</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-bg-surface">
                    {[
                      ['Equity (≥65% equity)', '≤12 months', '20% (Sec 111A)', '>12 months', '12.5% (Sec 112A)', 'Yes, shared'],
                      ['ELSS', 'Lock-in 36mo', 'N/A', '>36 months', '12.5% (Sec 112A)', 'Yes, shared'],
                      ['Hybrid (35–65% equity)', '≤24 months', 'Slab rate', '>24 months', '12.5% (Sec 112)', 'No'],
                      ['Debt (≤35% equity, post Apr 2023)', 'Any holding', 'Slab rate (Sec 50AA)', 'Never', 'N/A', 'No'],
                      ['Gold ETF (listed)', '≤12 months', 'Slab rate', '>12 months', '12.5% (Sec 112)', 'No'],
                      ['Gold MF FoF (unlisted)', '≤24 months', 'Slab rate', '>24 months', '12.5% (Sec 112)', 'No'],
                    ].map(([type, stcgCond, stcgRate, ltcgCond, ltcgRate, exemption]) => (
                      <tr key={type}>
                        <td className="py-2 pr-3 font-semibold text-text-primary">{type}</td>
                        <td className="py-2 pr-3 text-text-secondary">{stcgCond}</td>
                        <td className="py-2 pr-3 text-text-secondary">{stcgRate}</td>
                        <td className="py-2 pr-3 text-text-secondary">{ltcgCond}</td>
                        <td className="py-2 pr-3 text-text-secondary">{ltcgRate}</td>
                        <td className="py-2 text-text-secondary">{exemption}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <P>
                The ₹1.25 lakh annual LTCG exemption applies only to equity-oriented funds under Section 112A. It is shared across all equity fund redemptions and listed equity shares in a financial year. It does not apply to gold, hybrid, or debt funds.
              </P>
              <P>
                Source: Finance (No. 2) Act 2024, effective July 23, 2024. Section 50AA introduced by Finance Act 2023. Confirmed unchanged by Union Budget 2026.
              </P>
              <P>
                Exit load is a redemption fee charged by the AMC, typically 1% for equity funds if redeemed within 12 months, 0.5% for debt funds within 6 months, and nil for ELSS (post lock-in). It is calculated on the redemption amount, not the gain. RedeemWise factors exit load into the total cost for each strategy.
              </P>
            </>
          ) : (
            <div className="space-y-3">
              <P>The tax you pay depends on two things: what type of fund it is, and how long you've held it.</P>
              <P>
                <strong className="text-text-primary">Equity funds</strong> (large cap, mid cap, index funds, ELSS): if you've held for more than 1 year, you pay 12.5% tax only on gains above ₹1.25 lakh. If held for less than 1 year, you pay a flat 20%.
              </P>
              <P>
                <strong className="text-text-primary">Debt funds</strong> (corporate bond, liquid, gilt): all gains are taxed at your income tax slab rate, regardless of how long you've held them. This is because of a rule called Section 50AA introduced in 2023.
              </P>
              <P>
                <strong className="text-text-primary">Gold funds</strong>: if it's a Gold ETF held over 1 year, or a Gold Mutual Fund held over 2 years, you pay 12.5%. Otherwise you pay your slab rate.
              </P>
              <P>
                <strong className="text-text-primary">Hybrid funds</strong> (balanced, dynamic asset allocation): if held over 2 years, 12.5%. Otherwise your slab rate.
              </P>
              <P>
                <strong className="text-text-primary">Early withdrawal penalty (Exit Load):</strong> Most equity funds charge a small fee of around 1% if you withdraw within 1 year of investing. This is called an exit load. After that window, no penalty applies. We always check this before recommending which funds to redeem.
              </P>
            </div>
          )}
        </Section>

        {/* Section 3 */}
        <Section title="Important limitations">
          {isExpert ? (
            <div className="space-y-3">
              <P>These are estimates, not your final tax bill. A few things to keep in mind:</P>
              <ul className="space-y-2 text-sm text-text-secondary leading-relaxed list-none">
                <li><strong className="text-text-primary">Tax is not deducted when you redeem.</strong> You receive the full redemption amount in your bank account. Tax is calculated and paid when you file your ITR, typically by July 31 each year.</li>
                <li><strong className="text-text-primary">Cess and surcharge are not included.</strong> A 4% health and education cess applies on your total tax liability at ITR filing. Surcharge applies only if your total income exceeds ₹50 lakh. Neither can be attributed to individual transactions in isolation.</li>
                <li><strong className="text-text-primary">FIFO is mandated under SEBI regulations.</strong> Each SIP installment is treated as a separate acquisition with its own cost basis and holding period. Our estimates assume lump-sum investment for simplicity — actual numbers for SIP investors may differ.</li>
                <li><strong className="text-text-primary">Surcharge on capital gains</strong> under Section 112A is capped at 15% regardless of total income level.</li>
                <li><strong className="text-text-primary">Advance tax:</strong> if your estimated tax liability exceeds ₹10,000, pay in installments — 15% by June 15, 45% by September 15, 75% by December 15, 100% by March 15. Non-payment attracts interest under Sections 234B and 234C.</li>
                <li><strong className="text-text-primary">The ₹1.25 lakh LTCG exemption resets every April 1.</strong> Redemptions across two financial years let you use the exemption twice.</li>
              </ul>
            </div>
          ) : (
            <div className="space-y-3">
              <P>These are estimates, not your final tax bill. A few things to keep in mind:</P>
              <ul className="space-y-2 text-sm text-text-secondary leading-relaxed list-none">
                <li><strong className="text-text-primary">Tax is not deducted when you redeem.</strong> You receive the full amount in your bank account. Tax is paid when you file your ITR, typically by July 31 each year.</li>
                <li><strong className="text-text-primary">Cess and surcharge are not included.</strong> A 4% health and education cess applies on your total tax at ITR filing. Surcharge applies only if your total income exceeds ₹50 lakh.</li>
                <li><strong className="text-text-primary">If you invested via SIP,</strong> each installment has its own holding period. The oldest units are redeemed first (FIFO rule). Our estimates assume lump-sum investment for simplicity.</li>
                <li><strong className="text-text-primary">The ₹1.25 lakh LTCG exemption resets every April 1.</strong> Redeeming across two financial years lets you use the exemption twice.</li>
              </ul>
            </div>
          )}
        </Section>

        {/* Section 4 */}
        <Section title="Our recommendation logic">
          {isExpert ? (
            <div className="space-y-3">
              <P>Each fund is scored as:</P>
              <div className="rounded-card bg-bg-surface px-4 py-3 text-sm font-mono text-text-primary">
                Score = Tax Impact + Exit Load + (0.3 × Opportunity Cost)
              </div>
              <ul className="space-y-1.5 text-sm text-text-secondary leading-relaxed list-none">
                <li><strong className="text-text-primary">Tax Impact</strong> = gains portion of redemption × applicable rate, after LTCG exemption allocation</li>
                <li><strong className="text-text-primary">Exit Load</strong> = redemption amount × exit load % if within exit load period, else 0</li>
                <li><strong className="text-text-primary">Opportunity Cost</strong> = redemption amount × annualised return (trailing, from investment date to today)</li>
                <li>Opportunity cost is weighted at <strong className="text-text-primary">0.3</strong> because it is forward-looking and speculative — past returns may not repeat</li>
              </ul>
              <P>
                The ₹1.25L LTCG exemption is allocated optimally: applied first to the equity fund with the highest gains being redeemed, to maximise tax saving.
              </P>
              <P>
                Funds are sorted by score ascending. The algorithm greedily redeems from the lowest-score fund until the target amount is met. Partial redemptions are allowed on the final fund if needed.
              </P>
            </div>
          ) : (
            <div className="space-y-3">
              <P>We have four strategies:</P>
              <ul className="space-y-2 text-sm text-text-secondary leading-relaxed list-none">
                <li><strong className="text-text-primary">Save on Tax:</strong> We redeem from funds that will cost you the least in taxes first.</li>
                <li><strong className="text-text-primary">Avoid Penalties:</strong> We redeem from funds with no early withdrawal penalty first.</li>
                <li><strong className="text-text-primary">Keep Winners:</strong> We redeem from your worst-performing funds first, so your best investments can keep growing.</li>
                <li><strong className="text-text-primary">Smart Balance (Recommended):</strong> We combine all three. Each fund gets a score based on its tax cost, penalty, and how much future growth you'd be giving up. We redeem from the lowest-scoring funds first.</li>
              </ul>
            </div>
          )}
        </Section>

        <p className="text-[11px] text-text-secondary italic text-center pb-2">
          RedeemWise is a planning tool, not tax advice. All estimates are based on rules under the Finance Act 2024 and Finance Act 2023, confirmed unchanged by Union Budget 2026. Consult a qualified Chartered Accountant before making redemption decisions.
        </p>
      </div>
    </Layout>
  );
}
