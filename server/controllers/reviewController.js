// In-memory stores for when DB is unavailable
const inMemoryReviews = [];
const inMemoryAuditLog = [];

/**
 * POST /api/reviews — submit a human review
 */
async function submitReview(req, res) {
  try {
    const { caseId, diagnosisId, decision, reviewerNotes, correctedDiagnosis, reviewerName } = req.body;

    if (!caseId || !decision) {
      return res.status(400).json({ error: 'caseId and decision are required' });
    }

    if (!['approved', 'corrected', 'rejected'].includes(decision)) {
      return res.status(400).json({ error: 'decision must be approved, corrected, or rejected' });
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

    let savedReview = reviewData;

    if (req.app.locals.dbConnected) {
      try {
        const HumanReview = require('../models/HumanReview');
        const doc = new HumanReview(reviewData);
        savedReview = await doc.save();
        savedReview = savedReview.toObject();
      } catch (dbErr) {
        console.warn('Could not save review to DB:', dbErr.message);
      }
    }
    inMemoryReviews.push(savedReview);

    // Create responsible AI audit log entry
    const auditData = {
      caseId,
      diagnosisId: diagnosisId || null,
      reviewId: savedReview._id ? savedReview._id.toString() : `mem-${Date.now()}`,
      action: decision,
      aiConfidence: req.body.aiConfidence || 'unknown',
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
        console.warn('Could not save audit log to DB:', dbErr.message);
      }
    }
    inMemoryAuditLog.push(auditData);

    res.status(201).json(savedReview);
  } catch (error) {
    console.error('submitReview error:', error.message);
    res.status(500).json({ error: 'Failed to submit review', details: error.message });
  }
}

/**
 * GET /api/reviews — get all reviews
 */
async function getAllReviews(req, res) {
  try {
    if (req.app.locals.dbConnected) {
      const HumanReview = require('../models/HumanReview');
      const reviews = await HumanReview.find().sort({ createdAt: -1 });
      return res.json(reviews);
    }
    res.json(inMemoryReviews);
  } catch (error) {
    res.json(inMemoryReviews);
  }
}

/**
 * GET /api/audit — get responsible AI audit log
 */
async function getAuditLog(req, res) {
  try {
    if (req.app.locals.dbConnected) {
      const ResponsibleAILog = require('../models/ResponsibleAILog');
      const logs = await ResponsibleAILog.find().sort({ createdAt: -1 });
      return res.json(logs);
    }
    res.json(inMemoryAuditLog);
  } catch (error) {
    res.json(inMemoryAuditLog);
  }
}

// Export the in-memory stores for dashboard access
module.exports = { submitReview, getAllReviews, getAuditLog, inMemoryReviews, inMemoryAuditLog };
