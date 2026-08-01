import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { markdownReport } from "../src/report.js";
import { isAllowedValidationCommand, runValidation, runValidations } from "../src/validation.js";

let repoPath: string;
const marker = () => join(repoPath, "side-effect.txt");

beforeEach(() => {
  repoPath = mkdtempSync(join(tmpdir(), "inspector-validation-test-"));
  writeFileSync(
    join(repoPath, "package.json"),
    JSON.stringify({
      name: "fixture",
      scripts: {
        pass: 'node -e "process.exit(0)"',
        fail: 'node -e "process.exit(1)"',
        build: `node -e "require('fs').writeFileSync(${JSON.stringify(marker())}, 'ran')"`,
      },
    }),
  );
});

afterEach(() => {
  rmSync(repoPath, { recursive: true, force: true });
});

describe("runValidation", () => {
  it("resolves with status 'failed' when the command exits non-zero", async () => {
    const result = await runValidation("npm run fail", repoPath);

    expect(result.status).toBe("failed");
    expect(result.command).toBe("npm run fail");
  });

  it("resolves with status 'passed' when the command exits zero", async () => {
    const result = await runValidation("npm run pass", repoPath);

    expect(result.status).toBe("passed");
  });
});

describe("runValidations", () => {
  it("returns results for every command even when one fails, and the report reflects the failure", async () => {
    const results = await runValidations(["npm run fail", "npm run pass"], repoPath);

    expect(results).toHaveLength(2);
    expect(results[0].status).toBe("failed");
    expect(results[1].status).toBe("passed");

    const report = markdownReport({
      repositoryPath: "/work/sample",
      changedFiles: [],
      validationResults: results,
    });

    expect(report).toContain("failed");
  });
});

describe("validation command allowlisting", () => {
  it("allows a command matching a real script in the target repo's package.json", () => {
    expect(isAllowedValidationCommand("npm run build", repoPath)).toBe(true);
  });

  it("rejects a command naming a script absent from the target repo's package.json, and never executes it", async () => {
    expect(isAllowedValidationCommand("npm run nonexistent-script", repoPath)).toBe(false);

    const result = await runValidation("npm run nonexistent-script", repoPath);

    expect(result.status).toBe("failed");
    expect(result.output).toContain("not an allowed validation command");
    expect(existsSync(marker())).toBe(false);
  });

  it("rejects a command with shell metacharacters outright, not partially executed", async () => {
    const command =
      'npm test; node -e "require(\'fs\').writeFileSync(' + JSON.stringify(marker()) + ", 'ran')\"";
    expect(isAllowedValidationCommand(command, repoPath)).toBe(false);

    const result = await runValidation(command, repoPath);

    expect(result.status).toBe("failed");
    expect(result.output).toContain("not an allowed validation command");
    expect(existsSync(marker())).toBe(false);
  });

  it("allows the bare 'npm test' and 'npm install' commands regardless of package.json scripts", () => {
    expect(isAllowedValidationCommand("npm test", repoPath)).toBe(true);
    expect(isAllowedValidationCommand("npm install", repoPath)).toBe(true);
  });
});
