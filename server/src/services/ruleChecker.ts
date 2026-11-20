import { execFile } from 'child_process';
import path from 'path';
import { NetworkCase, CheckerFinding } from '../types/index';
import { getCached, setCached, CHECKER_TTL } from '../redis/redisClient';

/**
 * Run the Python rule checker on a case.
 * Returns an array of findings.
 * Results are cached in Redis for CHECKER_TTL seconds.
 */
export function runRuleChecker(caseData: NetworkCase): Promise<CheckerFinding[]> {
  return new Promise(async (resolve) => {
    const cacheKey = `checker:${caseData.caseId}`;

    // Check cache first
    const cached = await getCached<CheckerFinding[]>(cacheKey);
    if (cached) {
      console.log(`[Cache Hit] checker:${caseData.caseId}`);
      resolve(cached);
      return;
    }

    const checkerPath = path.join(__dirname, '..', '..', '..', 'rule-engine', 'checker.py');
    const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';

    const child = execFile(pythonCmd, [checkerPath], {
      timeout: 10000
    }, async (error, stdout) => {
      if (error) {
        console.error('Rule checker error:', error.message);
        // Fallback: return empty findings rather than crashing
        resolve([]);
        return;
      }
      try {
        const findings: CheckerFinding[] = JSON.parse(stdout);
        await setCached(cacheKey, findings, CHECKER_TTL);
        resolve(findings);
      } catch (parseErr) {
        console.error('Rule checker parse error:', (parseErr as Error).message);
        resolve([]);
      }
    });

    // Send case data as JSON via stdin
    if (child.stdin) {
      child.stdin.write(JSON.stringify(caseData));
      child.stdin.end();
    }
  });
}
