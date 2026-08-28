const express = require('express');
const router = express.Router();
const { submitReview, getAllReviews, getAuditLog } = require('../controllers/reviewController');

router.post('/', submitReview);
router.get('/', getAllReviews);

module.exports = router;
