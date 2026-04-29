import { useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import PortfolioSummary from '../components/PortfolioSummary.jsx';
import FundCard from '../components/FundCard.jsx';
import GoalInput from '../components/GoalInput.jsx';
import AddFundForm from '../components/AddFundForm.jsx';
import { usePortfolio, MAX_FUNDS } from '../hooks/usePortfolio.js';
import { useViewMode } from '../context/ViewModeContext.jsx';

function EmptyState({ onAdd }) {
  return (
    <div className="card p-8 sm:p-10 text-center">
      <div className="mx-auto w-14 h-14 rounded-full bg-primary-green/10 flex items-center justify-center text-primary-green mb-4">
        <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <path d="M12 8v8" />
          <path d="M8 12h8" />
        </svg>
      </div>
      <h2 className="text-lg font-bold text-text-primary">
        Add your first mutual fund to get started
      </h2>
      <p className="text-sm text-text-secondary mt-1.5 max-w-md mx-auto">
        Enter your funds, then we'll work out the smartest way to redeem them when you need money.
      </p>
      <button
        type="button"
        onClick={onAdd}
        className="btn-primary mt-5 px-5 py-3 text-sm inline-flex items-center gap-2"
      >
        <span aria-hidden>+</span> Add Fund
      </button>
      <div className="flex flex-col items-center gap-1.5 mt-3">
        <Link to="/shanaya" className="text-[12px] text-brand-blue hover:underline">View sample portfolio →</Link>
        <Link to="/how-we-calculate" className="text-[12px] text-brand-blue hover:underline">How we calculate →</Link>
      </div>
    </div>
  );
}

export default function Playground() {
  const { funds, addFund, updateFund, removeFund, clearAll } = usePortfolio();
  const { isSimple } = useViewMode();
  const [goalOpen, setGoalOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const atLimit = funds.length >= MAX_FUNDS;

  const handleSubmit = (fund) => {
    if (editing) {
      updateFund(editing.id, fund);
    } else {
      addFund(fund);
    }
    setFormOpen(false);
    setEditing(null);
  };

  const handleEdit = (fund) => {
    setEditing(fund);
    setFormOpen(true);
  };

  const handleAdd = () => {
    if (atLimit) return;
    setEditing(null);
    setFormOpen(true);
  };

  return (
    <Layout>
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
              Plan your mutual fund redemption
            </h1>
            <p className="text-sm text-text-secondary mt-1">
              Add your funds, set a goal, see the smartest way to redeem.
            </p>
          </div>
          <Link
            to="/shanaya"
            className="text-xs font-semibold text-brand-blue hover:underline shrink-0 mt-1"
          >
            View sample portfolio →
          </Link>
        </div>

        {funds.length === 0 ? (
          <EmptyState onAdd={handleAdd} />
        ) : (
          <>
            <PortfolioSummary funds={funds} />

            <section>
              <div className="flex items-center justify-between mb-3 gap-2">
                <h2 className="text-base font-bold text-text-primary">Your funds</h2>
                <div className="flex items-center gap-3 text-xs text-text-secondary">
                  <span>
                    {funds.length} of {MAX_FUNDS}
                  </span>
                  <button
                    type="button"
                    onClick={() => setConfirmClear(true)}
                    className="text-text-secondary hover:text-negative transition-colors font-semibold"
                  >
                    Clear all
                  </button>
                </div>
              </div>

              {isSimple && (
                <p className="flex items-center gap-1 text-[11px] text-text-secondary mb-3">
                  <span aria-hidden>ℹ</span>
                  Costs shown include capital gains tax and exit loads based on your tax slab
                </p>
              )}

              <button
                type="button"
                onClick={handleAdd}
                disabled={atLimit}
                className="w-full mb-4 rounded-card border border-dashed border-bg-surface-dark p-3.5 flex items-center justify-center gap-2 text-text-secondary hover:border-primary-green hover:text-primary-green transition-colors text-sm font-semibold disabled:opacity-50 disabled:hover:border-bg-surface-dark disabled:hover:text-text-secondary disabled:cursor-not-allowed"
              >
                <span className="text-lg leading-none" aria-hidden>+</span>
                Add fund
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {funds.map((fund) => (
                  <FundCard
                    key={fund.id}
                    fund={fund}
                    onEdit={handleEdit}
                    onDelete={(f) => removeFund(f.id)}
                  />
                ))}
              </div>
            </section>
          </>
        )}
      </div>

      {funds.length > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-20 sm:static sm:mt-6 bg-gradient-to-t from-bg-white via-bg-white to-bg-white/0 sm:bg-none pt-6 sm:pt-0 pb-4 sm:pb-0 px-4 sm:px-0">
          <div className="mx-auto w-full max-w-app sm:max-w-none">
            <button
              type="button"
              onClick={() => setGoalOpen(true)}
              className="btn-primary w-full py-4 text-base shadow-card-hover sm:shadow-card"
            >
              I need to withdraw money
            </button>
          </div>
        </div>
      )}

      <GoalInput
        open={goalOpen}
        onClose={() => setGoalOpen(false)}
        initial={{ goal: 0, goalPurpose: 'Other', taxSlab: 0.3 }}
        redirectTo="/recommend"
        highlightSlab
      />

      <AddFundForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSubmit={handleSubmit}
        initial={editing}
        mode={editing ? 'edit' : 'add'}
      />

      {confirmClear && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-text-primary/40 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setConfirmClear(false);
          }}
        >
          <div className="bg-bg-white rounded-card shadow-card-hover max-w-sm w-full p-5">
            <h3 className="text-base font-bold text-text-primary">
              Clear all funds?
            </h3>
            <p className="text-sm text-text-secondary mt-1.5">
              This removes all {funds.length} funds from your playground portfolio. The Shanaya demo isn't affected.
            </p>
            <div className="flex items-center gap-2 mt-5">
              <button
                type="button"
                onClick={() => setConfirmClear(false)}
                className="btn-secondary flex-1 py-2.5 text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  clearAll();
                  setConfirmClear(false);
                }}
                className="flex-1 py-2.5 text-sm font-semibold rounded-card bg-negative text-white hover:brightness-110 active:scale-[0.98] transition-all"
              >
                Yes, clear all
              </button>
            </div>
          </div>
        </div>
      )}

      <p className="text-[11px] text-text-secondary italic text-center mt-4 pb-2">
        RedeemWise is a planning tool, not financial or tax advice. Consult a qualified professional before making redemption decisions.
      </p>
    </Layout>
  );
}
