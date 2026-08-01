import { execFileSync } from "node:child_process";
import type { ChangedFile } from "./types.js";

export class RepositoryAccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RepositoryAccessError";
  }
}

function describeGitFailure(repositoryPath: string, error: unknown): string {
  const code = (error as NodeJS.ErrnoException)?.code;
  const stderr = typeof (error as { stderr?: unknown })?.stderr === "string"
    ? (error as { stderr: string }).stderr
    : "";

  if (code === "ENOENT") {
    return `'${repositoryPath}' does not exist or is not accessible`;
  }
  if (/unknown revision|ambiguous argument|bad revision/i.test(stderr)) {
    const detail = stderr.split("\n")[0].replace(/^fatal:\s*/i, "");
    return `'${repositoryPath}' has an invalid base ref: ${detail}`;
  }
  return `'${repositoryPath}' is not a valid git repository`;
}

function git(repositoryPath: string, args: string[]): string {
  try {
    return execFileSync("git", args, {
      cwd: repositoryPath,
      encoding: "utf8",
    }).trim();
  } catch (error) {
    throw new RepositoryAccessError(describeGitFailure(repositoryPath, error));
  }
}

export function parseNameStatus(output: string): ChangedFile[] {
  return output
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [code, ...pathParts] = line.split("\t");
      if (code.startsWith("R")) {
        const newPath = pathParts[pathParts.length - 1];
        return { path: newPath, status: "renamed" as const };
      }
      const status = code === "A" ? "added" : code === "D" ? "deleted" : "modified";
      return { path: pathParts.join("\t"), status };
    });
}

export function changedFiles(repositoryPath: string, baseRef?: string): ChangedFile[] {
  const base = baseRef ?? "main";
  const output = git(repositoryPath, [
    "diff",
    "--name-status",
    "--find-renames",
    `${base}...HEAD`,
  ]);

  return parseNameStatus(output);
}