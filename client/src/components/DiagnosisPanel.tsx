import React from 'react';
import { BrainCircuit, CheckCircle, AlertTriangle } from 'lucide-react';
import type { Diagnosis, Confidence } from '../types';

interface DiagnosisPanelProps {
  diagnosis: Diagnosis | null;
}

const DiagnosisPanel: React.FC<DiagnosisPanelProps> = ({ diagnosis }) => {
  if (!diagnosis) return null;

  const confColors: Record<Confidence, string> = {
    high: 'text-success bg-success/10 border-success/20',
    medium: 'text-warning bg-warning/10 border-warning/20',
    low: 'text-danger bg-danger/10 border-danger/20',
  };

  return (
    <div className="bg-surface rounded-xl border border-primary/30 overflow-hidden mt-6">
      <div className="bg-primary/10 p-4 border-b border-primary/20 flex items-center justify-between">
        <div className="flex items-center gap-2 text-primary font-bold">
          <BrainCircuit className="w-5 h-5" />
          AI Diagnosis
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium border ${confColors[diagnosis.confidence] || confColors.medium}`}>
          {diagnosis.confidence.toUpperCase()} CONFIDENCE
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div>
          <h4 className="text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wider">Root Cause</h4>
          <p className="text-lg text-slate-100 font-medium leading-relaxed">
            {diagnosis.root_cause}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wider">OSI Layer</h4>
            <div className="bg-slate-800 px-4 py-2 rounded-lg text-slate-300">
              {diagnosis.osi_layer || 'Unknown'}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wider">Concept</h4>
            <div className="bg-slate-800 px-4 py-2 rounded-lg text-slate-300">
              {diagnosis.concept || 'Unknown'}
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wider">Evidence Used</h4>
          <ul className="space-y-2">
            {diagnosis.evidence?.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 bg-slate-900 p-3 rounded-lg border border-slate-700">
                <CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <span className="text-sm text-slate-300 font-mono">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {diagnosis.checkerFindings && diagnosis.checkerFindings.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Rule Checker Findings
            </h4>
            <div className="space-y-2">
              {diagnosis.checkerFindings.map((finding, idx) => (
                <div key={idx} className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg">
                  <div className="text-amber-400 font-medium text-sm">{finding.rule}</div>
                  <div className="text-slate-300 text-sm mt-1">{finding.message}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <h4 className="text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wider">Fix Steps</h4>
          <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
            <ol className="list-decimal list-inside space-y-2 text-slate-300 font-mono text-sm">
              {diagnosis.fix_steps?.map((step, idx) => (
                <li key={idx}>{step}</li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiagnosisPanel;
