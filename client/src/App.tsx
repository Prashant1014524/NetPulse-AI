import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Cases from './pages/Cases';
import CaseDetail from './pages/CaseDetail';
import ResponsibleAI from './pages/ResponsibleAI';
import Evaluation from './pages/Evaluation';
import LiveTroubleshooter from './pages/LiveTroubleshooter';
import LabSimulator from './pages/LabSimulator';

function App() {
  return (
    <Router>
      <div className="flex h-screen overflow-hidden bg-[#060a13]">
        <Sidebar />
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/cases" element={<Cases />} />
            <Route path="/cases/:id" element={<CaseDetail />} />
            <Route path="/troubleshooter" element={<LiveTroubleshooter />} />
            <Route path="/lab" element={<LabSimulator />} />
            <Route path="/responsible-ai" element={<ResponsibleAI />} />
            <Route path="/evaluation" element={<Evaluation />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
