import { exec } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { ValidationResult } from "./types.js";

const BARE_ALLOWED_COMMANDS = new Set(["npm test", "npm install"]);
const NPM_RUN_PATTERN = /^npm run (\S+)$/;

function getTargetRepoScripts(cwd: string): Set<string> {
  try {
    const raw = readFileSync(join(cwd, "package.json"), "utf-8");
    const pkg = JSON.parse(raw) as { scripts?: Record<string, string> };
    return new Set(Object.keys(pkg.scripts ?? {}));
  } catch {
    return new Set();
  }
}

export function isAllowedValidationCommand(command: string, cwd: string): boolean {
  if (BARE_ALLOWED_COMMANDS.has(command)) {
    return true;
  }
  const match = NPM_RUN_PATTERN.exec(command);
  if (!match) {
    return false;
  }
  return getTargetRepoScripts(cwd).has(match[1]);
}

export function runValidation(command: string, cwd: string): Promise<ValidationResult> {
  if (!isAllowedValidationCommand(command, cwd)) {
    return Promise.resolve({
      command,
      status: "failed",
      output: `Rejected: '${command}' is not an allowed validation command. Only 'npm test', 'npm install', or 'npm run <script>' where <script> is defined in the target repository's package.json are permitted.`,
    });
  }
  return new Promise((resolve) => {
    exec(command, { cwd }, (error, stdout, stderr) => {
      if (error) {
        resolve({ command, status: "failed", output: stderr || stdout || error.message });
        return;
      }
      resolve({ command, status: "passed", output: stdout || stderr });
    });
  });
}

export async function runValidations(commands: string[], cwd: string): Promise<ValidationResult[]> {
  const results: ValidationResult[] = [];
  for (const command of commands) {
    results.push(await runValidation(command, cwd));
  }
  return results;
}