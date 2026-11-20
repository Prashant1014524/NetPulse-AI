import { Router } from 'express';
import { submitReview, getAllReviews } from '../controllers/reviewController';

const router = Router();

router.post('/', submitReview);
router.get('/', getAllReviews);

export default router;
