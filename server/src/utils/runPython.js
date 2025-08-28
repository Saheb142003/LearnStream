// server/src/utils/runPython.js
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Try multiple python executables so it works across platforms:
 * process.env.PYTHON_BIN -> python3 -> python -> py
 *
 * Returns: { stdout, stderr }
 */
function spawnProcess(exe, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(exe, args, { ...opts });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (d) => (stdout += d.toString()));
    child.stderr.on("data", (d) => (stderr += d.toString()));

    child.on("error", (err) => {
      // typical ENOENT here if exe not found
      reject(err);
    });

    child.on("close", (code) => {
      if (code !== 0) {
        // include stderr for debugging
        return reject(new Error(stderr || `Process exited with code ${code}`));
      }
      resolve({ stdout, stderr });
    });
  });
}

export async function runPython(scriptName, args = []) {
  const candidates = [process.env.PYTHON_BIN, "python3", "python", "py"].filter(
    Boolean
  );

  const scriptPath = path.resolve(__dirname, "../../scripts", scriptName);
  const cwd = path.resolve(__dirname, "../../scripts");

  let lastErr = null;
  for (const exe of candidates) {
    try {
      const result = await spawnProcess(exe, [scriptPath, ...args], { cwd });
      return result; // { stdout, stderr }
    } catch (err) {
      lastErr = err;
      // try next candidate
    }
  }

  throw new Error(
    `Failed to run Python script "${scriptName}". Tried: ${candidates.join(
      ", "
    )}. Last error: ${lastErr?.message || "unknown"}`
  );
}
