import { Router } from 'express';
import { getAllCases, getCaseById } from '../controllers/caseController';
import { diagnoseCase, getDiagnosisForCase } from '../controllers/diagnoseController';

const router = Router();

router.get('/', getAllCases);
router.get('/:id', getCaseById);
router.post('/:id/diagnose', diagnoseCase);
router.get('/:id/diagnosis', getDiagnosisForCase);

export default router;
