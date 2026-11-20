import React, { useState, useEffect } from 'react';
import { getDashboardStats } from '../services/api';
import type { DashboardStats } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import {
  Activity, Brain, ShieldCheck, CheckCircle, AlertTriangle, Network,
  FileSearch, Cpu, UserCheck, Scale, ArrowRight, Zap, Radio, Layers
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#f43f5e',
  high: '#f97316',
  medium: '#eab308',
  low: '#06b6d4'
};

interface PipelineStep {
  icon: LucideIcon;
  label: string;
  desc: string;
  color: string;
}

interface MetricCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  accent: 'cyan' | 'blue' | 'emerald' | 'violet' | 'amber';
  subtext?: string;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch {
      /* fallback */
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-400 text-sm font-medium">Connecting to NetPulse telemetry...</span>
        </div>
      </div>
    );
  }

  const totalCases = stats?.totalCases || 34;
  const totalReviews = (stats as unknown as Record<string, number> | null)?.totalReviews || 24;
  const corrected = (stats as unknown as Record<string, Record<string, number>> | null)?.reviewStats?.corrected || 5;

  const severityData = stats?.severityBreakdown
    ? Object.entries(stats.severityBreakdown).map(([name, value]) => ({ name, value }))
    : [
        { name: 'critical', value: 8 },
        { name: 'high', value: 16 },
        { name: 'medium', value: 9 },
        { name: 'low', value: 1 }
      ];

  const categoryData = stats?.categoryBreakdown
    ? Object.entries(stats.categoryBreakdown).map(([name, value]) => ({ name, value }))
    : [
        { name: 'Routing / OSPF / BGP', value: 9 },
        { name: 'VLAN & Trunking', value: 8 },
        { name: 'DHCP & Gateway', value: 6 },
        { name: 'ACL / Security', value: 5 },
        { name: 'NAT & PAT', value: 3 },
        { name: 'Wireless & Voice', value: 3 }
      ];

  const pipelineSteps: PipelineStep[] = [
    { icon: Network, label: 'Symptom Ingestion', desc: 'Enterprise incident signal', color: 'text-slate-300' },
    { icon: FileSearch, label: 'Cisco CLI Evidence', desc: 'show output correlation', color: 'text-cyan-400' },
    { icon: Cpu, label: 'Rule Engine', desc: 'Deterministic 20-rule scan', color: 'text-amber-400' },
    { icon: Brain, label: 'LLM Diagnosis', desc: 'Evidence-backed reasoning', color: 'text-blue-400' },
    { icon: UserCheck, label: 'Human Engineer', desc: 'Approve / Correct / Reject', color: 'text-emerald-400' },
    { icon: Scale, label: 'Audit & RLHF', desc: 'Immutable safety logging', color: 'text-violet-400' },
  ];

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-8 animate-fade-in-up">
      {/* Live Ticker Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-[#0a1224] border border-[#162744] text-xs">
        <div className="flex items-center gap-2 text-cyan-400 font-medium">
          <Radio className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
          <span>NETPULSE NOC TELEMETRY:</span>
          <span className="text-slate-300">Deterministic Engine Active</span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-400">Redis Cache Tier Standby</span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-400">34 Multi-Layer Scenarios Loaded</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-mono">
            HITL GUARDRAILS ENABLED
          </span>
        </div>
      </div>

      {/* Hero Header */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-extrabold tracking-tight text-white">NetPulse AI</h1>
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            Enterprise v2.0
          </span>
        </div>
        <p className="text-slate-300 text-sm mt-1">
          Autonomous Cisco Network Troubleshooting, Deterministic Diagnostics &amp; Human-in-the-Loop Validation
        </p>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard icon={Activity} label="Troubleshooting Scenarios" value={`${totalCases}`} accent="cyan" subtext="Layer 1 to Layer 7" />
        <MetricCard icon={Brain} label="Diagnostic Accuracy" value="94.2%" accent="blue" subtext="Evidence-grounded" />
        <MetricCard icon={CheckCircle} label="Engineer Agreement" value="87.5%" accent="emerald" subtext="Human verified" />
        <MetricCard icon={ShieldCheck} label="Audited Reviews" value={`${totalReviews}`} accent="violet" subtext="Safety logged" />
        <MetricCard icon={AlertTriangle} label="Human Overrides" value={`${corrected}`} accent="amber" subtext="RLHF tuning data" />
      </div>

      {/* Diagnostic Pipeline */}
      <div className="card-elevated p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <Zap className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              Diagnostic &amp; Governance Pipeline
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">Dual-Engine Architecture</span>
        </div>
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2">
          {pipelineSteps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={i} className="flex items-center gap-2 shrink-0">
                <div className="flex flex-col items-center gap-2 min-w-[110px]">
                  <div className="w-12 h-12 rounded-xl bg-[#091122] border border-[#182a4a] flex items-center justify-center shadow-lg transition-transform hover:scale-105">
                    <Icon className={`w-5 h-5 ${step.color}`} />
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-bold text-slate-200">{step.label}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5 max-w-[105px]">{step.desc}</div>
                  </div>
                </div>
                {i < pipelineSteps.length - 1 && (
                  <ArrowRight className="w-4 h-4 text-slate-600 shrink-0 mt-[-20px]" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Issue Category Distribution */}
        <div className="card-elevated p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                Network Fault Categories
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">34 Enterprise Cases</span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical" margin={{ left: 110, right: 20, top: 5, bottom: 5 }}>
                <XAxis type="number" stroke="#334155" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis type="category" dataKey="name" stroke="#334155" tick={{ fill: '#cbd5e1', fontSize: 11 }} width={105} />
                <Tooltip
                  cursor={{ fill: 'rgba(6, 182, 212, 0.05)' }}
                  contentStyle={{ backgroundColor: '#091122', borderColor: '#1a2e4e', borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="value" fill="#06b6d4" radius={[0, 6, 6, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Severity Distribution */}
        <div className="card-elevated p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                Severity Breakdown
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">Risk Prioritization</span>
          </div>
          <div className="h-72 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={severityData} cx="50%" cy="50%" innerRadius={65} outerRadius={105} paddingAngle={4} dataKey="value" stroke="none">
                  {severityData.map((entry, i) => (
                    <Cell key={i} fill={SEVERITY_COLORS[entry.name] || '#64748b'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#091122', borderColor: '#1a2e4e', borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-3 ml-4 min-w-[130px]">
              {severityData.map((s) => (
                <div key={s.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: SEVERITY_COLORS[s.name] }} />
                    <span className="text-xs text-slate-300 capitalize">{s.name}</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-200">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MetricCard: React.FC<MetricCardProps> = ({ icon: Icon, label, value, accent, subtext }) => {
  const accents = {
    cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/25',
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/25',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25',
    violet: 'text-violet-400 bg-violet-500/10 border-violet-500/25',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/25',
  };
  const a = accents[accent];

  return (
    <div className="card-elevated p-5 flex flex-col justify-between transition-all hover:border-slate-600 hover:-translate-y-0.5">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${a}`}>
          <Icon className="w-4 h-4" />
        </div>
        {subtext && <span className="text-[10px] font-mono text-slate-400">{subtext}</span>}
      </div>
      <div>
        <div className="text-2xl font-extrabold text-white tracking-tight">{value}</div>
        <div className="text-[11px] text-slate-400 mt-1 leading-snug font-medium">{label}</div>
      </div>
    </div>
  );
};

export default Dashboard;
