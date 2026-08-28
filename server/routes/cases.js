const express = require('express');
const router = express.Router();
const { getAllCases, getCaseById } = require('../controllers/caseController');
const { diagnoseCase, getDiagnosisForCase } = require('../controllers/diagnoseController');

router.get('/', getAllCases);
router.get('/:id', getCaseById);
router.post('/:id/diagnose', diagnoseCase);
router.get('/:id/diagnosis', getDiagnosisForCase);

module.exports = router;
