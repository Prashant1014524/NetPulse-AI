import { Router } from 'express';
import { getEvaluation } from '../controllers/evaluationController';

const router = Router();

router.get('/', getEvaluation);

export default router;
