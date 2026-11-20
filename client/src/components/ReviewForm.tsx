import React, { useState } from 'react';
import { submitReview } from '../services/api';
import type { Confidence, ReviewDecision } from '../types';
import { Check, X, Edit3, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ReviewFormProps {
  caseId: string;
  diagnosisId?: string;
  aiConfidence?: Confidence;
  onSuccess?: () => void;
}

const ReviewForm: React.FC<ReviewFormProps> = ({ caseId, diagnosisId, aiConfidence, onSuccess }) => {
  const [decision, setDecision] = useState<ReviewDecision | ''>('');
  const [notes, setNotes] = useState<string>('');
  const [correctedDiagnosis, setCorrectedDiagnosis] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!decision) return;

    setSubmitting(true);
    try {
      await submitReview({
        caseId,
        diagnosisId,
        decision,
        reviewerNotes: notes,
        correctedDiagnosis: decision === 'corrected' ? correctedDiagnosis : '',
        aiConfidence,
      });
      if (onSuccess) onSuccess();
      navigate('/dashboard');
    } catch (err) {
      alert('Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-surface rounded-xl border border-border p-6 mt-6">
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
        Human-in-the-Loop Review
      </h3>
      <p className="text-sm text-slate-400 mb-6">
        As a network engineer, please review the AI's diagnosis. This decision is stored in the Responsible AI audit log.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => setDecision('approved')}
            className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center gap-2 border transition-all ${
              decision === 'approved'
                ? 'bg-success/20 border-success text-success'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Check className="w-5 h-5" />
            Approve
          </button>
          <button
            type="button"
            onClick={() => setDecision('corrected')}
            className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center gap-2 border transition-all ${
              decision === 'corrected'
                ? 'bg-warning/20 border-warning text-warning'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Edit3 className="w-5 h-5" />
            Correct
          </button>
          <button
            type="button"
            onClick={() => setDecision('rejected')}
            className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center gap-2 border transition-all ${
              decision === 'rejected'
                ? 'bg-danger/20 border-danger text-danger'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <X className="w-5 h-5" />
            Reject
          </button>
        </div>

        {decision === 'corrected' && (
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Corrected Diagnosis
            </label>
            <textarea
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-slate-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none h-32"
              placeholder="Provide the correct root cause and fix..."
              value={correctedDiagnosis}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCorrectedDiagnosis(e.target.value)}
            />
          </div>
        )}

        {(decision === 'rejected' || decision === 'approved') && (
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Reviewer Notes (Optional)
            </label>
            <textarea
              required={decision === 'rejected'}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-slate-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none h-24"
              placeholder={decision === 'rejected' ? 'Explain why this was rejected...' : 'Any additional notes...'}
              value={notes}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
            />
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!decision || submitting}
            className="bg-primary hover:bg-primary/90 text-white font-medium py-2 px-6 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5" />
            {submitting ? 'Saving...' : 'Save Review'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReviewForm;
