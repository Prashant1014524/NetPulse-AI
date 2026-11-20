import fs from 'fs';
import path from 'path';
import { NetworkCase, CheckerFinding, Diagnosis } from '../types/index';
import { getCached, setCached, DIAGNOSIS_TTL } from '../redis/redisClient';

const demoDiagnosesPath = path.join(__dirname, '..', '..', 'data', 'demoDiagnoses.json');
let demoDiagnoses: Record<string, Partial<Diagnosis>> = {};
try {
  demoDiagnoses = JSON.parse(fs.readFileSync(demoDiagnosesPath, 'utf-8'));
} catch {
  console.warn('Demo diagnoses file not found, demo mode will use generated fallbacks');
}

/**
 * Call Groq API for AI diagnosis.
 * Falls back to demo mode if GROQ_API_KEY is not set.
 * Results are cached in Redis for DIAGNOSIS_TTL seconds.
 */
export async function getDiagnosis(
  caseData: NetworkCase,
  checkerFindings: CheckerFinding[]
): Promise<Diagnosis & { cached?: boolean }> {
  const cacheKey = `diagnosis:${caseData.caseId}`;

  // Check cache first
  const cached = await getCached<Diagnosis & { cached?: boolean }>(cacheKey);
  if (cached) {
    console.log(`[Cache Hit] diagnosis:${caseData.caseId}`);
    return { ...cached, cached: true };
  }

  const apiKey = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL || 'llama-3.1-70b-versatile';

  let result: Diagnosis;

  // Demo mode: return pre-generated diagnosis
  if (!apiKey) {
    console.log(`[Demo Mode] Returning demo diagnosis for ${caseData.caseId}`);
    const demo = demoDiagnoses[caseData.caseId];
    if (demo) {
      result = { ...demo, mode: 'demo' } as Diagnosis;
    } else {
      result = {
        caseId: caseData.caseId,
        root_cause: caseData.expectedFault,
        confidence: 'high',
        evidence: [caseData.showOutput.split('\n')[0]],
        osi_layer: caseData.osiLayer,
        concept: caseData.concept,
        next_command: 'show running-config',
        fix_steps: ['Review the configuration based on the identified fault'],
        verification_steps: 'Verify connectivity after applying fix',
        checkerFindings: [],
        mode: 'demo'
      };
    }
    await setCached(cacheKey, result, DIAGNOSIS_TTL);
    return result;
  }

  // AI mode: call Groq API
  try {
    const promptPath = path.join(__dirname, '..', '..', '..', 'prompts', 'diagnose_prompt.md');
    let systemPrompt = 'You are NetSage AI, an expert network troubleshooting assistant.';
    try {
      systemPrompt = fs.readFileSync(promptPath, 'utf-8');
    } catch {
      console.warn('Could not read diagnosis prompt file, using default');
    }

    const userMessage = JSON.stringify({
      symptom: caseData.symptom,
      topology: caseData.topology,
      showOutput: caseData.showOutput,
      checkerFindings: checkerFindings
    });

    const response = await fetch(`https://api.groq.com/openai/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.3,
        max_tokens: 1024,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Groq API error ${response.status}: ${errText}`);
    }

    const data = await response.json() as { choices: Array<{ message: { content: string } }> };
    const content = data.choices[0].message.content;
    const parsed = JSON.parse(content) as Partial<Diagnosis>;
    result = { ...parsed, mode: 'ai', model } as Diagnosis;
  } catch (error) {
    console.error('Groq API error, falling back to demo:', (error as Error).message);
    // Fallback to demo on API error
    const demo = demoDiagnoses[caseData.caseId];
    if (demo) {
      result = { ...demo, mode: 'demo' } as Diagnosis;
    } else {
      result = {
        caseId: caseData.caseId,
        root_cause: caseData.expectedFault,
        confidence: 'medium',
        evidence: [caseData.showOutput.split('\n')[0]],
        osi_layer: caseData.osiLayer,
        concept: caseData.concept,
        next_command: 'show running-config',
        fix_steps: ['Review the configuration based on the identified fault'],
        verification_steps: 'Verify connectivity after applying fix',
        checkerFindings: [],
        mode: 'demo'
      };
    }
  }

  await setCached(cacheKey, result, DIAGNOSIS_TTL);
  return result;
}
