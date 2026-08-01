#!/usr/bin/env node
import { writeFileSync } from "node:fs";
import { reviewRepository } from "./core.js";
import { RepositoryAccessError } from "./git.js";

type Args = {
  command: string;
  repositoryPath?: string;
  baseRef?: string;
  validations: string[];
};

export type CliResult = {
  exitCode: number;
  message: string;
};

export function parseArgs(argv: string[]): Args {
  const args: Args = { command: argv[0] ?? "", validations: [] };
  for (let index = 1; index < argv.length; index++) {
    const token = argv[index];
    if (token === "--repo") {
      args.repositoryPath = argv[++index];
    } else if (token === "--base-ref") {
      args.baseRef = argv[++index];
    } else if (token === "--validate") {
      args.validations.push(argv[++index]);
    }
  }
  return args;
}

export async function runCli(
  argv: string[],
  writeReport: (content: string) => void = (content) => writeFileSync("review-report.md", content, "utf8"),
): Promise<CliResult> {
  const args = parseArgs(argv);
  if (args.command !== "review" || !args.repositoryPath) {
    return {
      exitCode: 1,
      message: "Usage: inspector review --repo <path> [--base-ref <ref>] [--validate <command>]",
    };
  }

  let report: string;
  try {
    report = await reviewRepository({
      repositoryPath: args.repositoryPath,
      baseRef: args.baseRef,
      validationCommands: args.validations,
    });
  } catch (error) {
    if (error instanceof RepositoryAccessError) {
      return { exitCode: 1, message: `Error: ${error.message}` };
    }
    throw error;
  }

  writeReport(report);
  return { exitCode: 0, message: "Review report written to review-report.md" };
}

async function main() {
  const result = await runCli(process.argv.slice(2));
  if (result.exitCode === 0) {
    console.log(result.message);
  } else {
    console.error(result.message);
  }
  process.exitCode = result.exitCode;
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exitCode = 1;
});