const { execFile } = require('child_process');
const path = require('path');

/**
 * Run the Python rule checker on a case.
 * Returns an array of findings.
 */
function runRuleChecker(caseData) {
  return new Promise((resolve) => {
    const checkerPath = path.join(__dirname, '..', '..', 'rule-engine', 'checker.py');
    const child = execFile('python3', [checkerPath], {
      timeout: 10000
    }, (error, stdout, stderr) => {
      if (error) {
        console.error('Rule checker error:', error.message);
        // Fallback: return empty findings rather than crashing
        resolve([]);
        return;
      }
      try {
        const findings = JSON.parse(stdout);
        resolve(findings);
      } catch (parseErr) {
        console.error('Rule checker parse error:', parseErr.message);
        resolve([]);
      }
    });

    // Send case data as JSON via stdin
    child.stdin.write(JSON.stringify(caseData));
    child.stdin.end();
  });
}

module.exports = { runRuleChecker };
