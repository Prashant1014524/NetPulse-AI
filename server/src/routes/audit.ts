import { Router } from 'express';
import { getAuditLog } from '../controllers/reviewController';

const router = Router();

router.get('/', getAuditLog);

export default router;
