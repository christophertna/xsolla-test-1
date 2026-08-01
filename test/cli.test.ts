import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { parseArgs, runCli } from "../src/cli.js";

describe("runCli", () => {
  it("produces a clear, specific error, exits non-zero, and writes no report for a non-existent repository path", async () => {
    const missingPath = join(tmpdir(), "inspector-cli-does-not-exist-xyz");
    const writeReport = vi.fn();

    const result = await runCli(["review", "--repo", missingPath], writeReport);

    expect(result.exitCode).toBe(1);
    expect(result.message).not.toMatch(/^Fatal error:/);
    expect(result.message).toContain(missingPath);
    expect(writeReport).not.toHaveBeenCalled();
  });
});

describe("parseArgs", () => {
  it("keeps a --repo path containing a space intact, not truncated to the first word", () => {
    const args = parseArgs(["review", "--repo", "/tmp/my repo/checkout"]);

    expect(args.repositoryPath).toBe("/tmp/my repo/checkout");
  });

  it("does not recognize --format as an argument, and produces no format field", () => {
    const args = parseArgs(["review", "--repo", "/tmp/repo", "--format", "json"]);

    expect(args).not.toHaveProperty("format");
    expect(args.validations).toEqual([]);
  });
});
