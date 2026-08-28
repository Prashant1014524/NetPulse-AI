import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getCaseById, diagnoseCase, submitReview } from '../services/api';
import {
  ArrowLeft, Brain, Network, Monitor, Router as RouterIcon, Server, Wifi,
  Shield, CheckCircle, AlertTriangle, XCircle, ChevronRight, Terminal,
  Cpu, Activity, Eye, Loader2, Check, Edit3, X, Save, Layers, Zap
} from 'lucide-react';

const LOADING_STEPS = [
  'Analyzing network evidence...',
  'Correlating topology...',
  'Checking diagnostic signals...',
  'Generating evidence-backed diagnosis...',
];

const CaseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [diagnosis, setDiagnosis] = useState(null);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [diagStep, setDiagStep] = useState(0);
  const [reviewDecision, setReviewDecision] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  const [correctedText, setCorrectedText] = useState('');
  const [reviewSaved, setReviewSaved] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const diagRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    setDiagnosis(null);
    setReviewDecision('');
    setReviewSaved(false);
    getCaseById(id).then(d => { setCaseData(d); setLoading(false); }).catch(() => setLoading(false));
  }, [id]);

  const handleDiagnose = async () => {
    setIsDiagnosing(true);
    setDiagStep(0);
    // Animated loading steps
    for (let i = 0; i < LOADING_STEPS.length; i++) {
      await new Promise(r => setTimeout(r, 500 + Math.random() * 400));
      setDiagStep(i + 1);
    }
    try {
      const result = await diagnoseCase(id);
      setDiagnosis(result);
      // Store diagnosed status
      const reviewed = JSON.parse(localStorage.getItem('netsage_reviews') || '{}');
      if (!reviewed[id]) { reviewed[id] = 'diagnosed'; localStorage.setItem('netsage_reviews', JSON.stringify(reviewed)); }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDiagnosing(false);
      setTimeout(() => diagRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
    }
  };

  const handleReview = async () => {
    if (!reviewDecision) return;
    setSubmittingReview(true);
    try {
      await submitReview({
        caseId: id,
        diagnosisId: diagnosis?._id,
        decision: reviewDecision,
        reviewerNotes: reviewNotes,
        correctedDiagnosis: reviewDecision === 'corrected' ? correctedText : '',
        aiConfidence: diagnosis?.confidence,
      });
      // Update local status
      const reviewed = JSON.parse(localStorage.getItem('netsage_reviews') || '{}');
      reviewed[id] = reviewDecision;
      localStorage.setItem('netsage_reviews', JSON.stringify(reviewed));
      setReviewSaved(true);
    } catch (err) { console.error(err); }
    finally { setSubmittingReview(false); }
  };

  if (loading) return (
    <div className="h-full flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!caseData) return <div className="p-8 text-slate-500">Case not found.</div>;

  const sevBadge = { critical: 'badge-critical', high: 'badge-high', medium: 'badge-medium', low: 'badge-low' };

  return (
    <div className="p-8 max-w-5xl mx-auto pb-24">
      {/* Back nav */}
      <Link to="/cases" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-400 transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Cases
      </Link>

      {/* Case Header */}
      <div className="card-elevated p-6 mb-6 animate-fade-in-up">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-white">{caseData.caseId}</h1>
              <span className={`badge ${sevBadge[caseData.severity]}`}>{caseData.severity}</span>
            </div>
            <h2 className="text-lg text-slate-300 font-medium">{caseData.concept}</h2>
          </div>
          <div className="flex gap-2 flex-wrap">
            <span className="badge badge-info">{caseData.category}</span>
            <span className="badge border border-slate-600 bg-slate-800/50 text-slate-300">{caseData.osiLayer}</span>
          </div>
        </div>
      </div>

      {/* Symptom */}
      <div className="card-elevated p-6 mb-6 animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Network Symptom</h3>
        </div>
        <p className="text-slate-300 leading-relaxed">{caseData.symptom}</p>
      </div>

      {/* Topology */}
      <div className="card-elevated p-6 mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <div className="flex items-center gap-2 mb-3">
          <Network className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Topology</h3>
        </div>
        <p className="text-slate-400 text-sm leading-relaxed mb-5">{caseData.topology}</p>
        <TopologyDiagram topology={caseData.topology} />
      </div>

      {/* Evidence */}
      <div className="mb-6 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
        <div className="flex items-center gap-2 mb-3">
          <Terminal className="w-4 h-4 text-green-400" />
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Device Evidence</h3>
        </div>
        <div className="terminal">
          <div className="terminal-header">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
            </div>
            <span>show command output</span>
          </div>
          <div className="terminal-body">{caseData.showOutput}</div>
        </div>
      </div>

      {/* Diagnose Button */}
      {!diagnosis && !isDiagnosing && (
        <div className="flex justify-center my-10 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <button onClick={handleDiagnose} className="btn-primary text-base px-8 py-3.5 glow-blue">
            <Brain className="w-5 h-5" />
            Run AI Diagnosis
          </button>
        </div>
      )}

      {/* Diagnosing Animation */}
      {isDiagnosing && (
        <div className="card-elevated p-8 mb-6 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-400 mx-auto mb-4" />
          <div className="space-y-2">
            {LOADING_STEPS.map((step, i) => (
              <div key={i} className={`text-sm transition-all duration-300 ${i < diagStep ? 'text-emerald-400' : i === diagStep ? 'text-blue-400' : 'text-slate-600'}`}>
                {i < diagStep ? '✓' : i === diagStep ? '▸' : '○'} {step}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Diagnosis Results */}
      {diagnosis && (
        <div ref={diagRef}>
          {/* Rule Checker */}
          {diagnosis.checkerFindings && diagnosis.checkerFindings.length > 0 && (
            <div className="card-elevated p-6 mb-6 animate-fade-in-up">
              <div className="flex items-center gap-2 mb-5">
                <Cpu className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Deterministic Analysis</h3>
              </div>
              <div className="space-y-3">
                {diagnosis.checkerFindings.map((f, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-[#0a1020] border border-[#162037]">
                    {f.severity === 'critical' || f.severity === 'high'
                      ? <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                      : f.severity === 'info'
                        ? <CheckCircle className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                        : <AlertTriangle className="w-4 h-4 text-amber-500/60 mt-0.5 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono font-semibold text-slate-300">{f.rule}</span>
                        <span className={`badge ${f.severity === 'critical' ? 'badge-critical' : f.severity === 'high' ? 'badge-high' : f.severity === 'medium' ? 'badge-medium' : 'badge-info'}`}>{f.severity}</span>
                      </div>
                      <p className="text-sm text-slate-400">{f.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Diagnosis */}
          <div className="card-elevated overflow-hidden mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div className="bg-blue-600/10 border-b border-blue-500/20 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
                <Brain className="w-5 h-5" /> AI Diagnosis
              </div>
              <ConfidenceBadge level={diagnosis.confidence} />
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Root Cause</label>
                <p className="text-lg text-white font-medium mt-1 leading-relaxed">{diagnosis.root_cause}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <InfoBox label="OSI Layer" value={diagnosis.osi_layer} />
                <InfoBox label="Concept" value={diagnosis.concept} />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2 block">Supporting Evidence</label>
                <div className="space-y-2">
                  {diagnosis.evidence?.map((e, i) => (
                    <div key={i} className="flex items-start gap-2 bg-[#0a1020] p-3 rounded-lg border border-[#162037]">
                      <Eye className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0" />
                      <span className="text-sm text-slate-300 font-mono">{e}</span>
                    </div>
                  ))}
                </div>
              </div>
              {diagnosis.next_command && <InfoBox label="Next Command" value={diagnosis.next_command} mono />}
              <div>
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2 block">Recommended Fix</label>
                <div className="terminal">
                  <div className="terminal-body">
                    {diagnosis.fix_steps?.map((s, i) => <div key={i}>{s}</div>)}
                  </div>
                </div>
              </div>
              {diagnosis.verification_steps && <InfoBox label="Verification" value={diagnosis.verification_steps} />}
            </div>
          </div>

          {/* Human Review */}
          {!reviewSaved ? (
            <div className="card-elevated p-6 mb-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-violet-400" />
                <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Human Review Required</h3>
              </div>
              <p className="text-xs text-slate-500 mb-6">AI recommendations are advisory. Validate the diagnosis before applying any network changes.</p>

              <div className="flex gap-3 mb-6">
                {[
                  { key: 'approved', icon: Check, label: 'Approve', color: 'emerald' },
                  { key: 'corrected', icon: Edit3, label: 'Correct', color: 'amber' },
                  { key: 'rejected', icon: X, label: 'Reject', color: 'red' },
                ].map(opt => (
                  <button key={opt.key} onClick={() => setReviewDecision(opt.key)}
                    className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center gap-2 border text-sm font-medium transition-all ${
                      reviewDecision === opt.key
                        ? `bg-${opt.color}-500/15 border-${opt.color}-500/40 text-${opt.color}-400`
                        : 'bg-[#0a1020] border-[#162037] text-slate-400 hover:text-slate-200 hover:border-slate-600'
                    }`}
                    style={reviewDecision === opt.key ? {
                      backgroundColor: opt.color === 'emerald' ? 'rgba(16,185,129,0.1)' : opt.color === 'amber' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
                      borderColor: opt.color === 'emerald' ? 'rgba(16,185,129,0.3)' : opt.color === 'amber' ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)',
                      color: opt.color === 'emerald' ? '#34d399' : opt.color === 'amber' ? '#fbbf24' : '#f87171',
                    } : {}}>
                    <opt.icon className="w-4 h-4" />{opt.label}
                  </button>
                ))}
              </div>

              {reviewDecision === 'corrected' && (
                <div className="mb-4">
                  <label className="text-xs font-medium text-slate-400 mb-1.5 block">Corrected Diagnosis</label>
                  <textarea value={correctedText} onChange={e => setCorrectedText(e.target.value)}
                    className="w-full bg-[#040810] border border-[#162037] rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:border-blue-500/40 h-28 resize-none"
                    placeholder="Provide the correct root cause and fix..." />
                </div>
              )}
              {(reviewDecision === 'rejected' || reviewDecision === 'approved') && (
                <div className="mb-4">
                  <label className="text-xs font-medium text-slate-400 mb-1.5 block">Reviewer Notes</label>
                  <textarea value={reviewNotes} onChange={e => setReviewNotes(e.target.value)}
                    className="w-full bg-[#040810] border border-[#162037] rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:border-blue-500/40 h-20 resize-none"
                    placeholder="Additional notes..." />
                </div>
              )}

              {reviewDecision && (
                <div className="flex justify-end">
                  <button onClick={handleReview} disabled={submittingReview} className="btn-primary">
                    <Save className="w-4 h-4" />
                    {submittingReview ? 'Saving...' : 'Save Review'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="card-elevated p-6 mb-6 text-center animate-fade-in-up border-emerald-500/20">
              <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white mb-1">Review Saved</h3>
              <p className="text-sm text-slate-400 mb-4">
                Decision: <span className="font-semibold capitalize text-slate-200">{reviewDecision}</span>
              </p>
              <div className="flex justify-center gap-3">
                <Link to="/responsible-ai" className="btn-ghost text-sm">View Audit Log</Link>
                <Link to="/dashboard" className="btn-primary text-sm">Dashboard</Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* --- Sub-components --- */

const ConfidenceBadge = ({ level }) => {
  const styles = {
    high: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    medium: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
    low: 'bg-red-500/15 text-red-400 border-red-500/20',
  };
  return <span className={`badge border ${styles[level] || styles.medium}`}>{level?.toUpperCase()} CONFIDENCE</span>;
};

const InfoBox = ({ label, value, mono }) => (
  <div>
    <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">{label}</label>
    <div className={`mt-1 bg-[#0a1020] border border-[#162037] rounded-lg px-4 py-2.5 text-sm text-slate-300 ${mono ? 'font-mono' : ''}`}>{value}</div>
  </div>
);

const TopologyDiagram = ({ topology }) => {
  // Extract device names from topology text
  const devices = [];
  const t = topology.toLowerCase();
  if (t.includes('pc')) devices.push({ name: 'PC', icon: Monitor, color: 'text-slate-400' });
  if (t.includes('sw') || t.includes('switch')) devices.push({ name: 'Switch', icon: Layers, color: 'text-cyan-400' });
  if (t.includes('router') || /\br\d\b/i.test(topology)) devices.push({ name: 'Router', icon: Zap, color: 'text-blue-400' });
  if (t.includes('server') || t.includes('dhcp') || t.includes('dns')) devices.push({ name: 'Server', icon: Server, color: 'text-violet-400' });
  if (t.includes('wlc') || t.includes('wireless')) devices.push({ name: 'WLC', icon: Wifi, color: 'text-emerald-400' });
  if (t.includes('firewall') || t.includes('fw')) devices.push({ name: 'Firewall', icon: Shield, color: 'text-amber-400' });
  if (devices.length === 0) devices.push({ name: 'Network', icon: Network, color: 'text-blue-400' });

  return (
    <div className="flex items-center justify-center gap-4 py-3">
      {devices.map((d, i) => {
        const Icon = d.icon;
        return (
          <div key={i} className="flex items-center gap-4">
            <div className="flex flex-col items-center gap-1.5">
              <div className="w-10 h-10 rounded-lg bg-[#0a1020] border border-[#162037] flex items-center justify-center">
                <Icon className={`w-5 h-5 ${d.color}`} />
              </div>
              <span className="text-[10px] text-slate-500 font-medium">{d.name}</span>
            </div>
            {i < devices.length - 1 && (
              <ChevronRight className="w-4 h-4 text-slate-700 mt-[-16px]" />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default CaseDetail;
