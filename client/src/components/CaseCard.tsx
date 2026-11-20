import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Activity, ChevronRight } from 'lucide-react';
import type { NetworkCase, Severity } from '../types';

interface CaseCardProps {
  caseItem: NetworkCase;
  selected?: boolean;
}

const CaseCard: React.FC<CaseCardProps> = ({ caseItem, selected }) => {
  const { caseId, category, severity, symptom } = caseItem;

  const severityColors: Record<Severity, string> = {
    critical: 'text-danger bg-danger/10 border-danger/20',
    high: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
    medium: 'text-warning bg-warning/10 border-warning/20',
    low: 'text-primary bg-primary/10 border-primary/20',
  };

  return (
    <Link
      to={`/cases/${caseId}`}
      className={`block p-4 rounded-xl border transition-all ${
        selected
          ? 'bg-primary/5 border-primary/50 ring-1 ring-primary/50'
          : 'bg-surface border-border hover:border-slate-600 hover:bg-slate-800'
      }`}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-slate-400" />
          <span className="font-mono text-sm font-semibold text-slate-300">{caseId}</span>
        </div>
        <div className="flex gap-2">
          <span className="text-xs px-2 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
            {category}
          </span>
          <span className={`text-xs px-2 py-1 rounded border capitalize flex items-center gap-1 ${severityColors[severity] || severityColors.medium}`}>
            <AlertCircle className="w-3 h-3" />
            {severity}
          </span>
        </div>
      </div>
      <p className="text-sm text-slate-400 line-clamp-2">{symptom}</p>

      <div className="mt-3 flex justify-end text-primary text-sm font-medium items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        View Details <ChevronRight className="w-4 h-4" />
      </div>
    </Link>
  );
};

export default CaseCard;
