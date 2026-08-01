import { describe, expect, it } from "vitest";
import { parseArgs } from "../src/cli.js";

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
