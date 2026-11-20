import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { BarChart3, CheckCircle2, ShieldAlert, Cpu, Layers, FileText } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const CONCEPT_DATA = [
  { name: 'VLAN / Trunk', cases: 8 },
  { name: 'Routing / BGP / OSPF', cases: 9 },
  { name: 'DHCP / Gateway', cases: 6 },
  { name: 'ACL / Security', cases: 5 },
  { name: 'NAT / PAT', cases: 3 },
  { name: 'Wireless / Voice', cases: 3 },
];

const OSI_DATA = [
  { name: 'Layer 1 Physical', value: 3 },
  { name: 'Layer 2 Data Link', value: 9 },
  { name: 'Layer 3 Network', value: 16 },
  { name: 'Layer 4 Transport', value: 3 },
  { name: 'Layer 7 Application', value: 3 },
];

const AGREEMENT_DATA = [
  { category: 'Approved', value: 19, color: '#10b981' },
  { category: 'Corrected', value: 5, color: '#f59e0b' },
  { category: 'Rejected', value: 0, color: '#ef4444' },
];

interface MetricCardProps {
  label: string;
  value: string;
  accent: string;
  icon: LucideIcon;
}

const Evaluation: React.FC = () => {
  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Evaluation &amp; System Analytics</h1>
            <p className="text-sm text-slate-500">Benchmark Performance &amp; Dataset Metrics</p>
          </div>
        </div>
      </div>

      {/* Metric Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <MetricCard label="Case Coverage" value="34 / 30+" accent="blue" icon={FileText} />
        <MetricCard label="AI Diagnosis Coverage" value="92%" accent="cyan" icon={Cpu} />
        <MetricCard label="Human Review Coverage" value="70.5%" accent="emerald" icon={CheckCircle2} />
        <MetricCard label="Evidence Coverage" value="100%" accent="violet" icon={Layers} />
        <MetricCard label="Responsible AI Coverage" value="100%" accent="amber" icon={ShieldAlert} />
      </div>

      {/* Chart Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* AI vs Human Agreement */}
        <div className="card-elevated p-6">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-6">
            AI vs Human Agreement
          </h3>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={AGREEMENT_DATA} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={4} dataKey="value" stroke="none">
                  {AGREEMENT_DATA.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f1729', borderColor: '#1a2a4a', borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-3 ml-4">
              {AGREEMENT_DATA.map((a) => (
                <div key={a.category} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: a.color }} />
                  <span className="text-xs text-slate-400">{a.category}</span>
                  <span className="text-xs font-semibold text-slate-300 ml-1">{a.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Cases by Networking Concept */}
        <div className="card-elevated p-6">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-6">
            Cases by Networking Concept
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={CONCEPT_DATA} layout="vertical" margin={{ left: 100, right: 20, top: 5, bottom: 5 }}>
                <XAxis type="number" stroke="#334155" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis type="category" dataKey="name" stroke="#334155" tick={{ fill: '#94a3b8', fontSize: 11 }} width={95} />
                <Tooltip cursor={{ fill: '#1e293b40' }} contentStyle={{ backgroundColor: '#0f1729', borderColor: '#1a2a4a', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="cases" fill="#06b6d4" radius={[0, 4, 4, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cases by OSI Layer */}
        <div className="card-elevated p-6">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-6">
            Cases by OSI Layer
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={OSI_DATA} margin={{ left: 0, right: 20, top: 5, bottom: 5 }}>
                <XAxis dataKey="name" stroke="#334155" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <YAxis stroke="#334155" tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip cursor={{ fill: '#1e293b40' }} contentStyle={{ backgroundColor: '#0f1729', borderColor: '#1a2a4a', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Severity Distribution */}
        <div className="card-elevated p-6">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-6">
            Severity Distribution
          </h3>
          <div className="h-64 flex items-center justify-center">
            <div className="space-y-4 w-full px-4">
              {[
                { name: 'Critical', count: 8, pct: 23.5, color: '#ef4444' },
                { name: 'High', count: 16, pct: 47.0, color: '#f97316' },
                { name: 'Medium', count: 9, pct: 26.5, color: '#eab308' },
                { name: 'Low', count: 1, pct: 3.0, color: '#06b6d4' },
              ].map((s) => (
                <div key={s.name}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300 font-medium">{s.name}</span>
                    <span className="text-slate-400">{s.count} cases ({s.pct}%)</span>
                  </div>
                  <div className="w-full bg-[#0a1020] h-2 rounded-full overflow-hidden border border-[#162037]">
                    <div className="h-full rounded-full" style={{ width: `${s.pct}%`, backgroundColor: s.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MetricCard: React.FC<MetricCardProps> = ({ label, value, accent, icon: Icon }) => {
  const accents: Record<string, string> = {
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

export default Evaluation;
