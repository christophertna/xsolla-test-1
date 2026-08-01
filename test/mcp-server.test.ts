import { describe, expect, it } from "vitest";
import { handleReviewRepository } from "../src/mcp-server.js";

describe("handleReviewRepository", () => {
  it("uses input.repo_path to inspect the requested repository, not undefined", async () => {
    const result = await handleReviewRepository({ repo_path: process.cwd() });

    expect(result.content[0].text).toContain(`# Review Report: ${process.cwd()}`);
    expect(result.content[0].text).not.toContain("undefined");
  });
});
