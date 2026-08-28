const fs = require('fs');
const path = require('path');
const { inMemoryReviews, inMemoryAuditLog } = require('./reviewController');

/**
 * GET /api/dashboard/stats — dashboard statistics
 */
async function getDashboardStats(req, res) {
  try {
    // Get case stats
    let cases = [];
    if (req.app.locals.dbConnected) {
      try {
        const Case = require('../models/Case');
        cases = await Case.find();
      } catch (e) {}
    }
    if (cases.length === 0) {
      const casesPath = path.join(__dirname, '..', '..', 'data', 'cases.json');
      cases = JSON.parse(fs.readFileSync(casesPath, 'utf-8'));
    }

    // Get review stats
    let reviews = [];
    if (req.app.locals.dbConnected) {
      try {
        const HumanReview = require('../models/HumanReview');
        reviews = await HumanReview.find();
      } catch (e) {}
    }
    if (reviews.length === 0) {
      reviews = inMemoryReviews;
    }

    // Get audit stats
    let auditLogs = [];
    if (req.app.locals.dbConnected) {
      try {
        const ResponsibleAILog = require('../models/ResponsibleAILog');
        auditLogs = await ResponsibleAILog.find();
      } catch (e) {}
    }
    if (auditLogs.length === 0) {
      auditLogs = inMemoryAuditLog;
    }

    // Compute statistics
    const totalCases = cases.length;

    // Severity breakdown
    const severityBreakdown = {};
    cases.forEach(c => {
      const s = c.severity || 'unknown';
      severityBreakdown[s] = (severityBreakdown[s] || 0) + 1;
    });

    // Category breakdown
    const categoryBreakdown = {};
    cases.forEach(c => {
      const cat = c.category || 'Other';
      categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + 1;
    });

    // OSI Layer breakdown
    const osiBreakdown = {};
    cases.forEach(c => {
      const osi = c.osiLayer || 'Unknown';
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
    console.error('getDashboardStats error:', error.message);
    res.status(500).json({ error: 'Failed to get dashboard stats' });
  }
}

module.exports = { getDashboardStats };
