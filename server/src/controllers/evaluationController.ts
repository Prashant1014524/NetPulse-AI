import { Request, Response } from 'express';
import { inMemoryReviews } from './reviewController';

/**
 * GET /api/evaluation — get corrected AI examples for evaluation
 */
export async function getEvaluation(req: Request, res: Response): Promise<void> {
  try {
    let reviews: Record<string, unknown>[] = [];
    if (req.app.locals.dbConnected) {
      try {
        const HumanReview = require('../models/HumanReview');
        reviews = await HumanReview.find({ decision: 'corrected' }).sort({ createdAt: -1 });
      } catch { /* ignore */ }
    }
    if (reviews.length === 0) {
      reviews = inMemoryReviews.filter(r => r.decision === 'corrected');
    }

    res.json({
      total: reviews.length,
      correctedExamples: reviews
    });
  } catch (error) {
    console.error('getEvaluation error:', (error as Error).message);
    res.json({ total: 0, correctedExamples: [] });
  }
}
