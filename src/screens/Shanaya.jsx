import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import PortfolioSummary from '../components/PortfolioSummary.jsx';
import FundCard from '../components/FundCard.jsx';
import GoalInput from '../components/GoalInput.jsx';
import { SHANAYA_PORTFOLIO, SHANAYA_PROFILE } from '../data/shanaya.js';
import { useViewMode } from '../context/ViewModeContext.jsx';

export default function Shanaya() {
  const location = useLocation();
  const navigate = useNavigate();
  const [goalOpen, setGoalOpen] = useState(false);
  const { isSimple } = useViewMode();

  useEffect(() => {
    if (location.state?.reopenGoal) {
      setGoalOpen(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  return (
    <Layout>
      <div className="space-y-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
            Hi {SHANAYA_PROFILE.name}, here's your portfolio
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            6 mutual funds · planning for a {SHANAYA_PROFILE.goalPurpose.toLowerCase()}
          </p>
        </div>

        <PortfolioSummary funds={SHANAYA_PORTFOLIO} profile={SHANAYA_PROFILE} />

        <section>
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-base font-bold text-text-primary">Your funds</h2>
            <span className="text-xs text-text-secondary">
              {SHANAYA_PORTFOLIO.length} holdings
            </span>
          </div>
          {isSimple && (
            <p className="flex items-center gap-1 text-[11px] text-text-secondary mb-3">
              <span aria-hidden>ℹ</span>
              Costs shown include capital gains tax and exit loads based on your tax slab
            </p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {SHANAYA_PORTFOLIO.map((fund) => (
              <FundCard key={fund.id} fund={fund} />
            ))}
          </div>
          <p className="text-[11px] text-text-secondary mt-3">
            This is a sample portfolio.{' '}
            <Link to="/" className="text-brand-blue font-semibold hover:underline">
              Build your own →
            </Link>
          </p>
        </section>
      </div>

      {/* Sticky CTA on mobile, inline on larger screens */}
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

      <GoalInput
        open={goalOpen}
        onClose={() => setGoalOpen(false)}
        initial={SHANAYA_PROFILE}
      />
    </Layout>
  );
}
