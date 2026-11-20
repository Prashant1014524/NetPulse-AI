import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { inMemoryReviews, inMemoryAuditLog } from './reviewController';

/**
 * GET /api/dashboard/stats — dashboard statistics
 */
export async function getDashboardStats(req: Request, res: Response): Promise<void> {
  try {
    // Get case stats
    let cases: Record<string, unknown>[] = [];
    if (req.app.locals.dbConnected) {
      try {
        const Case = require('../models/Case');
        cases = await Case.find();
      } catch { /* ignore */ }
    }
    if (cases.length === 0) {
      const casesPath = path.join(__dirname, '..', '..', '..', 'data', 'cases.json');
      cases = JSON.parse(fs.readFileSync(casesPath, 'utf-8')) as Record<string, unknown>[];
    }

    // Get review stats
    let reviews: Record<string, unknown>[] = [];
    if (req.app.locals.dbConnected) {
      try {
        const HumanReview = require('../models/HumanReview');
        reviews = await HumanReview.find();
      } catch { /* ignore */ }
    }
    if (reviews.length === 0) {
      reviews = inMemoryReviews;
    }

    // Get audit stats
    let auditLogs: Record<string, unknown>[] = [];
    if (req.app.locals.dbConnected) {
      try {
        const ResponsibleAILog = require('../models/ResponsibleAILog');
        auditLogs = await ResponsibleAILog.find();
      } catch { /* ignore */ }
    }
    if (auditLogs.length === 0) {
      auditLogs = inMemoryAuditLog;
    }

    // Compute statistics
    const totalCases = cases.length;

    // Severity breakdown
    const severityBreakdown: Record<string, number> = {};
    cases.forEach(c => {
      const s = (c.severity as string) || 'unknown';
      severityBreakdown[s] = (severityBreakdown[s] || 0) + 1;
    });

    // Category breakdown
    const categoryBreakdown: Record<string, number> = {};
    cases.forEach(c => {
      const cat = (c.category as string) || 'Other';
      categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + 1;
    });

    // OSI Layer breakdown
    const osiBreakdown: Record<string, number> = {};
    cases.forEach(c => {
      const osi = (c.osiLayer as string) || 'Unknown';
      osiBreakdown[osi] = (osiBreakdown[osi] || 0) + 1;
    });

    // Review stats
    const totalReviews = reviews.length;
    const approved = reviews.filter(r => r.decision === 'approved').length;
    const corrected = reviews.filter(r => r.decision === 'corrected').length;
    const rejected = reviews.filter(r => r.decision === 'rejected').length;

    // Human override rate
    const humanOverrides = auditLogs.filter(a => a.humanOverride).length;
    const overrideRate = auditLogs.length > 0 ? ((humanOverrides / auditLogs.length) * 100).toFixed(1) : 0;

    res.json({
      totalCases,
      totalReviews,
      severityBreakdown,
      categoryBreakdown,
      osiBreakdown,
      reviewStats: {
        approved,
        corrected,
        rejected,
        total: totalReviews
      },
      responsibleAI: {
        totalAuditEntries: auditLogs.length,
        humanOverrides,
        overrideRate: `${overrideRate}%`
      }
    });
  } catch (error) {
    console.error('getDashboardStats error:', (error as Error).message);
    res.status(500).json({ error: 'Failed to get dashboard stats' });
  }
}
