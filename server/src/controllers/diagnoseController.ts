import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { runRuleChecker } from '../services/ruleChecker';
import { getDiagnosis } from '../services/groqService';
import { NetworkCase, CheckerFinding, Diagnosis } from '../types/index';

// In-memory store for diagnoses when DB is unavailable
const inMemoryDiagnoses: Record<string, Diagnosis> = {};

/**
 * POST /api/cases/:id/diagnose — run diagnosis on a case
 */
export async function diagnoseCase(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    // Get the case data
    let caseData: NetworkCase | null = null;
    if (req.app.locals.dbConnected) {
      const Case = require('../models/Case');
      caseData = await Case.findOne({ caseId: id });
    }
    if (!caseData) {
      const casesPath = path.join(__dirname, '..', '..', '..', 'data', 'cases.json');
      const cases: NetworkCase[] = JSON.parse(fs.readFileSync(casesPath, 'utf-8'));
      caseData = cases.find(c => c.caseId === id) ?? null;
    }
    if (!caseData) {
      res.status(404).json({ error: 'Case not found' });
      return;
    }

    // Step 1: Run deterministic rule checker
    let checkerFindings: CheckerFinding[] = [];
    try {
      checkerFindings = await runRuleChecker(caseData);
    } catch (err) {
      console.warn('Rule checker failed, continuing without findings:', (err as Error).message);
    }

    // Step 2: Get AI diagnosis (or demo fallback)
    const diagnosis = await getDiagnosis(caseData, checkerFindings);
    diagnosis.caseId = id;
    diagnosis.checkerFindings = checkerFindings;

    // Step 3: Store the diagnosis
    let savedDiagnosis: Diagnosis = diagnosis;
    if (req.app.locals.dbConnected) {
      try {
        const DiagnosisModel = require('../models/Diagnosis');
        const doc = new DiagnosisModel(diagnosis);
        const saved = await doc.save();
        savedDiagnosis = saved.toObject() as Diagnosis;
      } catch (dbErr) {
        console.warn('Could not save diagnosis to DB:', (dbErr as Error).message);
      }
    }
    // Always store in memory too
    inMemoryDiagnoses[id] = savedDiagnosis;

    res.json(savedDiagnosis);
  } catch (error) {
    console.error('diagnoseCase error:', (error as Error).message);
    res.status(500).json({ error: 'Diagnosis failed', details: (error as Error).message });
  }
}

/**
 * GET /api/cases/:id/diagnosis — get existing diagnosis for a case
 */
export async function getDiagnosisForCase(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    if (req.app.locals.dbConnected) {
      const DiagnosisModel = require('../models/Diagnosis');
      const d = await DiagnosisModel.findOne({ caseId: id }).sort({ createdAt: -1 });
      if (d) {
        res.json(d);
        return;
      }
    }
    if (inMemoryDiagnoses[id]) {
      res.json(inMemoryDiagnoses[id]);
      return;
    }
    res.status(404).json({ error: 'No diagnosis found for this case' });
  } catch (error) {
    if (inMemoryDiagnoses[req.params.id]) {
      res.json(inMemoryDiagnoses[req.params.id]);
      return;
    }
    res.status(404).json({ error: 'No diagnosis found for this case' });
  }
}
