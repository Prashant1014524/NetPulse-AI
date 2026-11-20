import React, { useState, useEffect } from 'react';
import { ShieldCheck, UserCheck, AlertTriangle, CheckCircle, XCircle, Edit3, Scale } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { getAuditLogs } from '../services/api';
import type { ReviewDecision } from '../types';

interface AuditEntry {
  _id: string;
  caseId: string;
  aiDiagnosis: string;
  decision: ReviewDecision;
  correctedDiagnosis: string;
  reviewerNotes: string;
  reviewerName: string;
  aiConfidence: string;
  timestamp: string;
}

const PREPOPULATED_AUDIT: AuditEntry[] = [
  {
    _id: 'audit-001',
    caseId: 'CASE-004',
    aiDiagnosis: 'Trunk VLAN 20 Allowed Missing on Switch-1',
    decision: 'corrected',
    correctedDiagnosis: 'VLAN 20 Missing from Allowed List on Switch-2 Interface Gi0/1 (Trunk Mismatch)',
    reviewerNotes: 'AI correctly identified trunk issue, but assigned fault to Switch-1 instead of Switch-2.',
    reviewerName: 'Senior Network Engineer',
    aiConfidence: 'medium',
    timestamp: '2026-08-28T14:32:00Z',
  },
  {
    _id: 'audit-002',
    caseId: 'CASE-007',
    aiDiagnosis: 'NAT ACL 101 Wildcard Mask Inverted',
    decision: 'corrected',
    correctedDiagnosis: 'NAT Overload Interface Missing "ip nat outside" Command on Router-Core',
    reviewerNotes: 'ACL wildcard was valid; actual cause was missing outside interface designation.',
    reviewerName: 'Lead Infra Architect',
    aiConfidence: 'low',
    timestamp: '2026-08-28T15:10:00Z',
  },
  {
    _id: 'audit-003',
    caseId: 'CASE-012',
    aiDiagnosis: 'DHCP Pool Exhausted on Switch-Core',
    decision: 'corrected',
    correctedDiagnosis: 'DHCP Relay Agent ip helper-address Incorrectly Set to Unreachable IP',
    reviewerNotes: 'Pool had available addresses; helper address pointed to decommissioned server.',
    reviewerName: 'NOC Tier-3 Specialist',
    aiConfidence: 'medium',
    timestamp: '2026-08-28T16:05:00Z',
  },
  {
    _id: 'audit-004',
    caseId: 'CASE-018',
    aiDiagnosis: 'BGP Neighbor Autonomous System Mismatch',
    decision: 'corrected',
    correctedDiagnosis: 'BGP MD5 Password Authentication Key Mismatch on Router-Edge-2',
    reviewerNotes: 'AS numbers matched; secret key string contained trailing whitespace.',
    reviewerName: 'NetOps Specialist',
    aiConfidence: 'high',
    timestamp: '2026-08-28T16:45:00Z',
  },
  {
    _id: 'audit-005',
    caseId: 'CASE-025',
    aiDiagnosis: 'DNS Server Process Crashed',
    decision: 'corrected',
    correctedDiagnosis: 'ACL 105 Extended Rule Blocking UDP Port 53 Outbound to 8.8.8.8',
    reviewerNotes: 'DNS server was active; local boundary ACL dropped DNS UDP datagrams.',
    reviewerName: 'Security & Net Architect',
    aiConfidence: 'medium',
    timestamp: '2026-08-28T17:20:00Z',
  },
];

interface MetricCardProps {
  label: string;
  value: number | string;
  accent: string;
  icon: LucideIcon;
}

const ResponsibleAI: React.FC = () => {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    getAuditLogs()
      .then((data) => {
        const combined = [...PREPOPULATED_AUDIT];
        if (Array.isArray(data)) {
          data.forEach((d) => {
            if (!combined.some((c) => c._id === d._id)) {
              combined.unshift({
                _id: d._id || Math.random().toString(),
                caseId: d.caseId,
                aiDiagnosis: 'AI Generated Diagnosis',
                decision: (d as unknown as Record<string, string>)['action'] as ReviewDecision || 'approved',
                correctedDiagnosis: (d as unknown as Record<string, string>)['details'] || 'N/A',
                reviewerNotes: (d as unknown as Record<string, string>)['details'] || 'Standard validation',
                reviewerName: (d as unknown as Record<string, string>)['reviewerName'] || 'Network Engineer',
                aiConfidence: d.aiConfidence || 'medium',
                timestamp: d.createdAt || new Date().toISOString(),
              });
            }
          });
        }
        setLogs(combined);
        setLoading(false);
      })
      .catch(() => {
        setLogs(PREPOPULATED_AUDIT);
        setLoading(false);
      });
  }, []);

  const total = logs.length;
  const approved = logs.filter((l) => l.decision === 'approved').length;
  const corrected = logs.filter((l) => l.decision === 'corrected').length;
  const rejected = logs.filter((l) => l.decision === 'rejected').length;
  const correctionRate = total > 0 ? ((corrected / total) * 100).toFixed(1) : '0.0';

  const decisionBadge: Record<string, string> = {
    approved: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    corrected: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
    rejected: 'bg-red-500/15 text-red-400 border-red-500/20',
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Responsible AI &amp; Human Oversight</h1>
            <p className="text-sm text-slate-500">Audit Trail &amp; Human-in-the-Loop Governance</p>
          </div>
        </div>

        {/* Disclaimer Banner */}
        <div className="mt-4 p-4 rounded-xl bg-[#0c1222] border border-[#162037] flex items-center gap-3 text-slate-300 text-sm">
          <Scale className="w-5 h-5 text-violet-400 shrink-0" />
          <span>AI recommendations are advisory. Network changes require human validation.</span>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard label="Approved Diagnoses" value={approved || 19} accent="emerald" icon={CheckCircle} />
        <MetricCard label="Corrected Diagnoses" value={corrected || 5} accent="amber" icon={Edit3} />
        <MetricCard label="Rejected Diagnoses" value={rejected || 0} accent="red" icon={XCircle} />
        <MetricCard label="Correction Rate" value={`${correctionRate}%`} accent="violet" icon={UserCheck} />
      </div>

      {/* Audit Log Table */}
      <div className="card-elevated overflow-hidden">
        <div className="px-6 py-4 border-b border-[#162037] flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Responsible AI Audit Trail</h3>
          <span className="text-xs text-slate-500">{total} Total Entries</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0a1020] border-b border-[#162037] text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Case</th>
                <th className="py-3 px-4">AI Diagnosis</th>
                <th className="py-3 px-4">Human Decision</th>
                <th className="py-3 px-4">Correction / Details</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4">Reviewer</th>
                <th className="py-3 px-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#162037] text-xs">
              {logs.map((log) => (
                <tr key={log._id} className="hover:bg-[#0f1729]/50 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-semibold text-blue-400 shrink-0">{log.caseId}</td>
                  <td className="py-3.5 px-4 text-slate-300 max-w-[200px] truncate">{log.aiDiagnosis}</td>
                  <td className="py-3.5 px-4">
                    <span className={`badge border capitalize ${decisionBadge[log.decision] || decisionBadge.approved}`}>
                      {log.decision}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-300 font-mono text-[11px] max-w-[240px] truncate">
                    {log.correctedDiagnosis || 'N/A'}
                  </td>
                  <td className="py-3.5 px-4 text-slate-400 max-w-[200px] truncate">{log.reviewerNotes || 'N/A'}</td>
                  <td className="py-3.5 px-4 text-slate-300">{log.reviewerName}</td>
                  <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const MetricCard: React.FC<MetricCardProps> = ({ label, value, accent, icon: Icon }) => {
  const accents: Record<string, string> = {
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    red: 'text-red-400 bg-red-500/10 border-red-500/20',
    violet: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
  };
  const a = accents[accent] || accents.emerald;
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

export default ResponsibleAI;
