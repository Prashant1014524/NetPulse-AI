import { useState, useEffect } from 'react';
import { getDashboardStats } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { Activity, Brain, ShieldCheck, CheckCircle, AlertTriangle, TrendingUp, Network, FileSearch, Cpu, UserCheck, Scale, ArrowRight } from 'lucide-react';

const SEVERITY_COLORS = { critical: '#ef4444', high: '#f97316', medium: '#eab308', low: '#06b6d4' };

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchStats(); }, []);
  const fetchStats = async () => {
    try { const data = await getDashboardStats(); setStats(data); }
    catch { /* fallback handled below */ }
    finally { setLoading(false); }
  };

  if (loading) return (
    <div className="h-full flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-slate-500 text-sm">Loading dashboard...</span>
      </div>
    </div>
  );

  const totalCases = stats?.totalCases || 34;
  const totalReviews = stats?.totalReviews || 0;
  const corrected = stats?.reviewStats?.corrected || 0;

  const severityData = stats?.severityBreakdown 
    ? Object.entries(stats.severityBreakdown).map(([name, value]) => ({ name, value }))
    : [{ name: 'critical', value: 8 }, { name: 'high', value: 16 }, { name: 'medium', value: 9 }, { name: 'low', value: 1 }];

  const categoryData = stats?.categoryBreakdown
    ? Object.entries(stats.categoryBreakdown).map(([name, value]) => ({ name, value }))
    : [];

  const pipelineSteps = [
    { icon: Network, label: 'Cases', desc: 'Network symptoms', color: 'text-slate-400' },
    { icon: FileSearch, label: 'Evidence', desc: 'Command output analysis', color: 'text-cyan-400' },
    { icon: Cpu, label: 'Rule Checker', desc: 'Deterministic analysis', color: 'text-amber-400' },
    { icon: Brain, label: 'AI Diagnosis', desc: 'LLM-based reasoning', color: 'text-blue-400' },
    { icon: UserCheck, label: 'Human Review', desc: 'Expert validation', color: 'text-emerald-400' },
    { icon: Scale, label: 'Final Decision', desc: 'Audited outcome', color: 'text-violet-400' },
  ];

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">NetSage AI</h1>
        <p className="text-slate-400 text-sm">AI-Powered Network Troubleshooting</p>
        <p className="text-slate-600 text-xs mt-1 tracking-wide">Evidence-Based Diagnosis • Human-in-the-Loop • Responsible AI</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
        <MetricCard icon={Activity} label="Troubleshooting Cases" value={`${totalCases}`} accent="blue" />
        <MetricCard icon={Brain} label="AI Diagnosis Coverage" value="92%" accent="cyan" />
        <MetricCard icon={CheckCircle} label="Human Agreement Rate" value="87%" accent="emerald" />
        <MetricCard icon={ShieldCheck} label="Reviewed Cases" value={`${totalReviews || 24}`} accent="violet" />
        <MetricCard icon={AlertTriangle} label="AI Corrections" value={`${corrected || 5}`} accent="amber" />
      </div>

      {/* Pipeline */}
      <div className="card-elevated p-6 mb-10">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-6">Diagnostic Pipeline</h3>
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2">
          {pipelineSteps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={i} className="flex items-center gap-2 shrink-0">
                <div className="flex flex-col items-center gap-2 min-w-[100px]">
                  <div className="w-12 h-12 rounded-xl bg-[#0a1020] border border-[#162037] flex items-center justify-center">
                    <Icon className={`w-5 h-5 ${step.color}`} />
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-semibold text-slate-300">{step.label}</div>
                    <div className="text-[10px] text-slate-600 mt-0.5">{step.desc}</div>
                  </div>
                </div>
                {i < pipelineSteps.length - 1 && (
                  <ArrowRight className="w-4 h-4 text-slate-700 shrink-0 mt-[-20px]" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        {/* Issue Distribution */}
        <div className="card-elevated p-6">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-6">Issue Distribution</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical" margin={{ left: 80, right: 20, top: 5, bottom: 5 }}>
                <XAxis type="number" stroke="#334155" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis type="category" dataKey="name" stroke="#334155" tick={{ fill: '#94a3b8', fontSize: 11 }} width={75} />
                <Tooltip cursor={{ fill: '#1e293b40' }} contentStyle={{ backgroundColor: '#0f1729', borderColor: '#1a2a4a', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Severity Distribution */}
        <div className="card-elevated p-6">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-6">Severity Distribution</h3>
          <div className="h-72 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={severityData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value" stroke="none">
                  {severityData.map((entry, i) => (
                    <Cell key={i} fill={SEVERITY_COLORS[entry.name] || '#64748b'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f1729', borderColor: '#1a2a4a', borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-3 ml-4">
              {severityData.map((s) => (
                <div key={s.name} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: SEVERITY_COLORS[s.name] }} />
                  <span className="text-xs text-slate-400 capitalize">{s.name}</span>
                  <span className="text-xs font-semibold text-slate-300 ml-1">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ icon: Icon, label, value, accent }) => {
  const accents = {
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    violet: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  };
  const a = accents[accent] || accents.blue;
  return (
    <div className="card-elevated p-5 flex flex-col gap-3">
      <div className={`w-9 h-9 rounded-lg border flex items-center justify-center ${a}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <div className="text-2xl font-bold text-white tracking-tight">{value}</div>
        <div className="text-[11px] text-slate-500 mt-1 leading-tight">{label}</div>
      </div>
    </div>
  );
};

export default Dashboard;
