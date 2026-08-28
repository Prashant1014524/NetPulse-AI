const { runRuleChecker } = require('../services/ruleChecker');
const { getDiagnosis } = require('../services/groqService');

// In-memory store for diagnoses when DB is unavailable
const inMemoryDiagnoses = {};

/**
 * POST /api/cases/:id/diagnose — run diagnosis on a case
 */
async function diagnoseCase(req, res) {
  try {
    const { id } = req.params;

    // Get the case data
    let caseData;
    if (req.app.locals.dbConnected) {
      const Case = require('../models/Case');
      caseData = await Case.findOne({ caseId: id });
    }
    if (!caseData) {
      const fs = require('fs');
      const path = require('path');
      const casesPath = path.join(__dirname, '..', '..', 'data', 'cases.json');
      const cases = JSON.parse(fs.readFileSync(casesPath, 'utf-8'));
      caseData = cases.find(c => c.caseId === id);
    }
    if (!caseData) {
      return res.status(404).json({ error: 'Case not found' });
    }

    // Step 1: Run deterministic rule checker
    let checkerFindings = [];
    try {
      checkerFindings = await runRuleChecker(caseData);
    } catch (err) {
      console.warn('Rule checker failed, continuing without findings:', err.message);
    }

    // Step 2: Get AI diagnosis (or demo fallback)
    const diagnosis = await getDiagnosis(caseData, checkerFindings);
    diagnosis.caseId = id;
    diagnosis.checkerFindings = checkerFindings;

    // Step 3: Store the diagnosis
    let savedDiagnosis = diagnosis;
    if (req.app.locals.dbConnected) {
      try {
        const Diagnosis = require('../models/Diagnosis');
        const doc = new Diagnosis(diagnosis);
        savedDiagnosis = await doc.save();
        savedDiagnosis = savedDiagnosis.toObject();
      } catch (dbErr) {
        console.warn('Could not save diagnosis to DB:', dbErr.message);
      }
    }
    // Always store in memory too
    inMemoryDiagnoses[id] = savedDiagnosis;

    res.json(savedDiagnosis);
  } catch (error) {
    console.error('diagnoseCase error:', error.message);
    res.status(500).json({ error: 'Diagnosis failed', details: error.message });
  }
}

/**
 * GET /api/cases/:id/diagnosis — get existing diagnosis for a case
 */
async function getDiagnosisForCase(req, res) {
  try {
    const { id } = req.params;
    if (req.app.locals.dbConnected) {
      const Diagnosis = require('../models/Diagnosis');
      const d = await Diagnosis.findOne({ caseId: id }).sort({ createdAt: -1 });
      if (d) return res.json(d);
    }
    if (inMemoryDiagnoses[id]) return res.json(inMemoryDiagnoses[id]);
    return res.status(404).json({ error: 'No diagnosis found for this case' });
  } catch (error) {
    if (inMemoryDiagnoses[req.params.id]) return res.json(inMemoryDiagnoses[req.params.id]);
    res.status(404).json({ error: 'No diagnosis found for this case' });
  }
}

module.exports = { diagnoseCase, getDiagnosisForCase };
