import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { handleReviewRepository } from "../src/mcp-server.js";

function run(cwd: string, args: string[]): void {
  execFileSync("git", args, { cwd, encoding: "utf8" });
}

let repoPath: string;

beforeEach(() => {
  repoPath = mkdtempSync(join(tmpdir(), "inspector-mcp-test-"));
  run(repoPath, ["init", "--initial-branch=main"]);
  run(repoPath, ["config", "user.email", "test@example.com"]);
  run(repoPath, ["config", "user.name", "Test"]);
  writeFileSync(join(repoPath, "README.md"), "hello\n");
  run(repoPath, ["add", "."]);
  run(repoPath, ["commit", "-m", "initial commit"]);
  run(repoPath, ["checkout", "-b", "feature"]);
  writeFileSync(join(repoPath, "feature.txt"), "new file\n");
  run(repoPath, ["add", "."]);
  run(repoPath, ["commit", "-m", "add feature file"]);
});

afterEach(() => {
  rmSync(repoPath, { recursive: true, force: true });
});

describe("handleReviewRepository", () => {
  it("uses input.repo_path to inspect the requested repository, not undefined", async () => {
    const result = await handleReviewRepository({ repo_path: repoPath });

    expect(result.content[0].text).toContain(`# Review Report: ${repoPath}`);
    expect(result.content[0].text).not.toContain("undefined");
    expect(result.content[0].text).toContain("feature.txt (added)");
  });
});
