import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { WeeklyCalendar } from './pages/WeeklyCalendar';
import { AdminPage } from './pages/AdminPage';
import { WithingsCallback } from './pages/WithingsCallback';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<WeeklyCalendar />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/api/withings/callback" element={<WithingsCallback />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;