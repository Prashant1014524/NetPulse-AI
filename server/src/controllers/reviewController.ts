// In-memory stores for when DB is unavailable
export const inMemoryReviews: Record<string, unknown>[] = [];
export const inMemoryAuditLog: Record<string, unknown>[] = [];

import { Request, Response } from 'express';

/**
 * POST /api/reviews — submit a human review
 */
export async function submitReview(req: Request, res: Response): Promise<void> {
  try {
    const { caseId, diagnosisId, decision, reviewerNotes, correctedDiagnosis, reviewerName } = req.body as {
      caseId: string;
      diagnosisId?: string;
      decision: string;
      reviewerNotes?: string;
      correctedDiagnosis?: string;
      reviewerName?: string;
      aiConfidence?: string;
    };

    if (!caseId || !decision) {
      res.status(400).json({ error: 'caseId and decision are required' });
      return;
    }

    if (!['approved', 'corrected', 'rejected'].includes(decision)) {
      res.status(400).json({ error: 'decision must be approved, corrected, or rejected' });
      return;
    }

    const reviewData = {
      caseId,
      diagnosisId: diagnosisId || null,
      decision,
      reviewerNotes: reviewerNotes || '',
      correctedDiagnosis: correctedDiagnosis || '',
      reviewerName: reviewerName || 'Anonymous Reviewer',
      createdAt: new Date()
    };

    let savedReview: Record<string, unknown> = reviewData;

    if (req.app.locals.dbConnected) {
      try {
        const HumanReview = require('../models/HumanReview');
        const doc = new HumanReview(reviewData);
        const saved = await doc.save();
        savedReview = saved.toObject() as Record<string, unknown>;
      } catch (dbErr) {
        console.warn('Could not save review to DB:', (dbErr as Error).message);
      }
    }
    inMemoryReviews.push(savedReview);

    // Create responsible AI audit log entry
    const auditData = {
      caseId,
      diagnosisId: diagnosisId || null,
      reviewId: savedReview._id ? String(savedReview._id) : `mem-${Date.now()}`,
      action: decision,
      aiConfidence: (req.body as Record<string, string>).aiConfidence || 'unknown',
      humanOverride: decision !== 'approved',
      reviewerName: reviewerName || 'Anonymous Reviewer',
      details: decision === 'corrected'
        ? `Human corrected AI diagnosis: ${correctedDiagnosis || ''}`
        : decision === 'rejected'
          ? `Human rejected AI diagnosis: ${reviewerNotes || ''}`
          : 'Human approved AI diagnosis',
      createdAt: new Date()
    };

    if (req.app.locals.dbConnected) {
      try {
        const ResponsibleAILog = require('../models/ResponsibleAILog');
        const auditDoc = new ResponsibleAILog(auditData);
        await auditDoc.save();
      } catch (dbErr) {
        console.warn('Could not save audit log to DB:', (dbErr as Error).message);
      }
    }
    inMemoryAuditLog.push(auditData);

    res.status(201).json(savedReview);
  } catch (error) {
    console.error('submitReview error:', (error as Error).message);
    res.status(500).json({ error: 'Failed to submit review', details: (error as Error).message });
  }
}

/**
 * GET /api/reviews — get all reviews
 */
export async function getAllReviews(req: Request, res: Response): Promise<void> {
  try {
    if (req.app.locals.dbConnected) {
      const HumanReview = require('../models/HumanReview');
      const reviews = await HumanReview.find().sort({ createdAt: -1 });
      res.json(reviews);
      return;
    }
    res.json(inMemoryReviews);
  } catch {
    res.json(inMemoryReviews);
  }
}

/**
 * GET /api/audit — get responsible AI audit log
 */
export async function getAuditLog(req: Request, res: Response): Promise<void> {
  try {
    if (req.app.locals.dbConnected) {
      const ResponsibleAILog = require('../models/ResponsibleAILog');
      const logs = await ResponsibleAILog.find().sort({ createdAt: -1 });
      res.json(logs);
      return;
    }
    res.json(inMemoryAuditLog);
  } catch {
    res.json(inMemoryAuditLog);
  }
}
