import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { changedFiles, parseNameStatus, RepositoryAccessError } from "../src/git.js";

function run(cwd: string, args: string[]): void {
  execFileSync("git", args, { cwd, encoding: "utf8" });
}

describe("changedFiles", () => {
  let repoPath: string;
  let notRepoPath: string;

  beforeEach(() => {
    repoPath = mkdtempSync(join(tmpdir(), "inspector-git-test-"));
    run(repoPath, ["init", "-q", "--initial-branch=main"]);
    run(repoPath, ["config", "user.email", "test@example.com"]);
    run(repoPath, ["config", "user.name", "Test"]);
    writeFileSync(join(repoPath, "README.md"), "hello\n");
    run(repoPath, ["add", "."]);
    run(repoPath, ["commit", "-q", "-m", "initial commit"]);

    notRepoPath = mkdtempSync(join(tmpdir(), "inspector-not-a-repo-"));
  });

  afterEach(() => {
    rmSync(repoPath, { recursive: true, force: true });
    rmSync(notRepoPath, { recursive: true, force: true });
  });

  it("throws a RepositoryAccessError with a clear message for a non-existent repository path", () => {
    const missingPath = join(tmpdir(), "inspector-does-not-exist-xyz");

    expect(() => changedFiles(missingPath, "main")).toThrow(RepositoryAccessError);
    expect(() => changedFiles(missingPath, "main")).toThrow(missingPath);
  });

  it("throws a RepositoryAccessError with a clear message for a directory that is not a git repository", () => {
    expect(() => changedFiles(notRepoPath, "main")).toThrow(RepositoryAccessError);
    expect(() => changedFiles(notRepoPath, "main")).toThrow("is not a valid git repository");
  });

  it("throws a RepositoryAccessError with a clear message for an invalid baseRef", () => {
    expect(() => changedFiles(repoPath, "no-such-ref")).toThrow(RepositoryAccessError);
    expect(() => changedFiles(repoPath, "no-such-ref")).toThrow("invalid base ref");
  });
});

describe("parseNameStatus", () => {
  it("reports a renamed file as a single well-formed 'renamed' entry, not a tab-joined path", () => {
    const result = parseNameStatus("R100\told/name.ts\tnew/name.ts");

    expect(result).toEqual([{ path: "new/name.ts", status: "renamed" }]);
  });

  it("still reports added, modified, and deleted files correctly alongside a rename", () => {
    const result = parseNameStatus(
      ["A\tfoo.ts", "M\tbar.ts", "D\tbaz.ts", "R087\told.ts\tnew.ts"].join("\n"),
    );

    expect(result).toEqual([
      { path: "foo.ts", status: "added" },
      { path: "bar.ts", status: "modified" },
      { path: "baz.ts", status: "deleted" },
      { path: "new.ts", status: "renamed" },
    ]);
  });
});
