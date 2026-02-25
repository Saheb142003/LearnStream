// server/src/utils/runPython.js
//
// Spawns a Python script and returns { stdout, stderr }.
// Supports:
//   - Multiple Python executable candidates (cross-platform)
//   - Configurable timeout with SIGTERM → SIGKILL escalation
//   - UTF-8 enforced on all streams

import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SCRIPTS_DIR = path.resolve(__dirname, "../../scripts");

/**
 * Try multiple python executables so it works across platforms:
 *   PYTHON_BIN env → python3 → python → py
 */
const PYTHON_CANDIDATES = [
  process.env.PYTHON_BIN,
  "python3",
  "python",
  "py",
].filter(Boolean);

/**
 * Spawn one Python attempt.
 * @param {string}   exe        Python executable
 * @param {string[]} args       [scriptPath, ...scriptArgs]
 * @param {number}   timeoutMs  Max allowed wall-clock time
 */
function spawnWithTimeout(exe, args, timeoutMs) {
  return new Promise((resolve, reject) => {
    const child = spawn(exe, args, {
      cwd: SCRIPTS_DIR,
      env: {
        ...process.env,
        PYTHONIOENCODING: "utf-8", // Force UTF-8 on Windows
        PYTHONUTF8: "1", // Python 3.7+ UTF-8 mode
      },
    });

    let stdout = "";
    let stderr = "";
    let timedOut = false;

    // ── timeout logic ──────────────────────────────────────────────────────
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
      // Escalate to SIGKILL after 3 s if still alive
      setTimeout(() => child.kill("SIGKILL"), 3_000);
    }, timeoutMs);

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");

    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });

    child.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });

    child.on("close", (code) => {
      clearTimeout(timer);

      if (timedOut) {
        return reject(
          Object.assign(new Error("Python process timed out"), {
            code: "TIMEOUT",
          }),
        );
      }

      if (code !== 0) {
        return reject(
          new Error(
            stderr
              ? `Python exited ${code}: ${stderr.slice(0, 300)}`
              : `Python exited with code ${code}`,
          ),
        );
      }

      resolve({ stdout, stderr });
    });
  });
}

/**
 * Run a script from server/scripts/ trying each Python candidate in turn.
 *
 * @param {string}   scriptName  Filename inside server/scripts/
 * @param {string[]} args        CLI arguments to pass to the script
 * @param {number}   timeoutMs   Max execution time in ms (default 30 s)
 */
export async function runPython(scriptName, args = [], timeoutMs = 30_000) {
  const scriptPath = path.join(SCRIPTS_DIR, scriptName);
  let lastErr = null;

  for (const exe of PYTHON_CANDIDATES) {
    try {
      return await spawnWithTimeout(exe, [scriptPath, ...args], timeoutMs);
    } catch (err) {
      // ENOENT → executable not found, try next candidate
      if (err.code === "ENOENT") {
        lastErr = err;
        continue;
      }
      // Any other error (timeout, non-zero exit, etc.) is real — propagate immediately
      throw err;
    }
  }

  throw new Error(
    `No Python interpreter found. Tried: ${PYTHON_CANDIDATES.join(", ")}. ` +
      `Set PYTHON_BIN in .env. Last error: ${lastErr?.message || "unknown"}`,
  );
}
