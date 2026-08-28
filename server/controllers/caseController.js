const fs = require('fs');
const path = require('path');

// In-memory fallback store
let inMemoryCases = [];

// Load cases from JSON file
function loadCasesFromFile() {
  const casesPath = path.join(__dirname, '..', '..', 'data', 'cases.json');
  try {
    const raw = fs.readFileSync(casesPath, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load cases.json:', e.message);
    return [];
  }
}

// Initialize in-memory store
inMemoryCases = loadCasesFromFile();

/**
 * GET /api/cases — list all cases
 */
async function getAllCases(req, res) {
  try {
    if (req.app.locals.dbConnected) {
      const Case = require('../models/Case');
      let cases = await Case.find().sort({ caseId: 1 });
      if (cases.length === 0) {
        // Seed from file if DB is empty
        const fileData = loadCasesFromFile();
        if (fileData.length > 0) {
          await Case.insertMany(fileData);
          cases = await Case.find().sort({ caseId: 1 });
        }
      }
      return res.json(cases);
    }
    // In-memory fallback
    res.json(inMemoryCases);
  } catch (error) {
    console.error('getAllCases error:', error.message);
    res.json(inMemoryCases);
  }
}

/**
 * GET /api/cases/:id — get single case by caseId
 */
async function getCaseById(req, res) {
  try {
    const { id } = req.params;
    if (req.app.locals.dbConnected) {
      const Case = require('../models/Case');
      const c = await Case.findOne({ caseId: id });
      if (c) return res.json(c);
    }
    // In-memory fallback
    const c = inMemoryCases.find(c => c.caseId === id);
    if (!c) return res.status(404).json({ error: 'Case not found' });
    res.json(c);
  } catch (error) {
    console.error('getCaseById error:', error.message);
    const c = inMemoryCases.find(c => c.caseId === req.params.id);
    if (!c) return res.status(404).json({ error: 'Case not found' });
    res.json(c);
  }
}

module.exports = { getAllCases, getCaseById };
