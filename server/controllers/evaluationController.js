const { inMemoryReviews } = require('./reviewController');

/**
 * GET /api/evaluation — get corrected AI examples for evaluation
 */
async function getEvaluation(req, res) {
  try {
    let reviews = [];
    if (req.app.locals.dbConnected) {
      try {
        const HumanReview = require('../models/HumanReview');
        reviews = await HumanReview.find({ decision: 'corrected' }).sort({ createdAt: -1 });
      } catch (e) {}
    }
    if (reviews.length === 0) {
      reviews = inMemoryReviews.filter(r => r.decision === 'corrected');
    }

    res.json({
      total: reviews.length,
      correctedExamples: reviews
    });
  } catch (error) {
    console.error('getEvaluation error:', error.message);
    res.json({ total: 0, correctedExamples: [] });
  }
}

module.exports = { getEvaluation };
