import { Navigate, Route, Routes } from 'react-router-dom';
import Playground from './screens/Playground.jsx';
import Shanaya from './screens/Shanaya.jsx';
import Recommendations from './screens/Recommendations.jsx';
import HowWeCalculate from './screens/HowWeCalculate.jsx';
import { ViewModeProvider } from './context/ViewModeContext.jsx';

export default function App() {
  return (
    <ViewModeProvider>
      <Routes>
        <Route path="/" element={<Playground />} />
        <Route path="/recommend" element={<Recommendations source="playground" />} />
        <Route path="/shanaya" element={<Shanaya />} />
        <Route path="/shanaya/recommend" element={<Recommendations source="shanaya" />} />
        <Route path="/how-we-calculate" element={<HowWeCalculate />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ViewModeProvider>
  );
}
