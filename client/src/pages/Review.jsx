import { useState, useEffect } from 'react';
import { getAuditLogs } from '../services/api';
import { ShieldAlert, User, Cpu, Activity, Clock } from 'lucide-react';

const Review = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const data = await getAuditLogs();
        setLogs(data);
      } catch (err) {
        console.error("Failed to load audit logs", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const actionColors = {
    approved: 'text-success bg-success/10 border-success/20',
    corrected: 'text-warning bg-warning/10 border-warning/20',
    rejected: 'text-danger bg-danger/10 border-danger/20'
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <ShieldAlert className="w-8 h-8 text-primary" />
        <h2 className="text-3xl font-bold">Responsible AI Audit Log</h2>
      </div>
      
      <p className="text-slate-400 mb-8 max-w-3xl leading-relaxed">
        This log tracks all human-in-the-loop decisions made on AI-generated diagnoses. 
        It ensures accountability and provides a dataset of corrected examples for future model fine-tuning (RLHF).
      </p>

      {loading ? (
        <div className="text-slate-500 py-12 text-center">Loading audit records...</div>
      ) : logs.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-12 text-center text-slate-500">
          <Activity className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p className="text-lg">No audit records found.</p>
          <p className="text-sm mt-2">Complete a case review to generate an audit log.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {logs.map((log) => (
            <div key={log._id || Math.random()} className="bg-surface rounded-xl border border-border p-6 flex flex-col md:flex-row gap-6">
              
              <div className="md:w-1/4 shrink-0 flex flex-col justify-between border-r border-border pr-6">
                <div>
                  <h3 className="font-mono text-lg font-bold text-primary mb-1">Case {log.caseId}</h3>
                  <div className="flex items-center gap-1 text-xs text-slate-500 mb-4">
                    <Clock className="w-3 h-3" />
                    {new Date(log.createdAt).toLocaleString()}
                  </div>
                </div>
                
                <div className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border uppercase tracking-wider self-start ${actionColors[log.action]}`}>
                  {log.action}
                </div>
              </div>

              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-4 text-sm text-slate-400">
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    Reviewer: <span className="text-slate-200">{log.reviewerName}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Cpu className="w-4 h-4" />
                    AI Confidence: <span className="text-slate-200">{log.aiConfidence}</span>
                  </div>
                  {log.humanOverride && (
                    <div className="px-2 py-0.5 rounded bg-warning/20 text-warning text-xs font-bold uppercase">
                      Override
                    </div>
                  )}
                </div>

                <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Details</h4>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    {log.details || 'No additional details provided.'}
                  </p>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Review;
