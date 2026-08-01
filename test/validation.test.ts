import { describe, expect, it } from "vitest";
import { markdownReport } from "../src/report.js";
import { runValidation, runValidations } from "../src/validation.js";

describe("runValidation", () => {
  it("resolves with status 'failed' when the command exits non-zero", async () => {
    const result = await runValidation('node -e "process.exit(1)"', process.cwd());

    expect(result.status).toBe("failed");
    expect(result.command).toBe('node -e "process.exit(1)"');
  });

  it("resolves with status 'passed' when the command exits zero", async () => {
    const result = await runValidation('node -e "process.exit(0)"', process.cwd());

    expect(result.status).toBe("passed");
  });
});

describe("runValidations", () => {
  it("returns results for every command even when one fails, and the report reflects the failure", async () => {
    const results = await runValidations(
      ['node -e "process.exit(1)"', 'node -e "process.exit(0)"'],
      process.cwd(),
    );

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
