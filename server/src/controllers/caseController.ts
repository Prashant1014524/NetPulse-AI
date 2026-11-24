import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import Case from '../models/Case';
import { NetworkCase } from '../types/index';

// In-memory fallback store
let inMemoryCases: NetworkCase[] = [];

// Load cases from JSON file
function loadCasesFromFile(): NetworkCase[] {
  const casesPath = path.join(__dirname, '..', '..', '..', 'data', 'cases.json');
  try {
    const raw = fs.readFileSync(casesPath, 'utf-8');
    return JSON.parse(raw) as NetworkCase[];
  } catch (e) {
    console.error('Failed to load cases.json:', (e as Error).message);
    return [];
  }
}

// Initialize in-memory store
inMemoryCases = loadCasesFromFile();

/**
 * GET /api/cases — list all cases
 */
export async function getAllCases(req: Request, res: Response): Promise<void> {
  try {
    if (req.app.locals.dbConnected) {
      let cases = await Case.find().sort({ caseId: 1 });
      if (cases.length === 0) {
        // Seed from file if DB is empty
        const fileData = loadCasesFromFile();
        if (fileData.length > 0) {
          await Case.insertMany(fileData);
          cases = await Case.find().sort({ caseId: 1 });
        }
      }
      res.json(cases);
      return;
    }
    // In-memory fallback
    res.json(inMemoryCases);
  } catch (error) {
    console.error('getAllCases error:', (error as Error).message);
    res.json(inMemoryCases);
  }
}

/**
 * GET /api/cases/:id — get single case by caseId
 */
export async function getCaseById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    if (req.app.locals.dbConnected) {
      const c = await Case.findOne({ caseId: id });
      if (c) {
        res.json(c);
        return;
      }
    }
    // In-memory fallback
    const c = inMemoryCases.find(item => item.caseId === id);
    if (!c) {
      res.status(404).json({ error: 'Case not found' });
      return;
    }
    res.json(c);
  } catch (error) {
    console.error('getCaseById error:', (error as Error).message);
    const c = inMemoryCases.find(item => item.caseId === req.params.id);
    if (!c) {
      res.status(404).json({ error: 'Case not found' });
      return;
    }
    res.json(c);
  }
}
