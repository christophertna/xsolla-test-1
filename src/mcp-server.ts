#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { reviewRepository } from "./core.js";

const reviewRepositoryInputSchema = z.object({
  repo_path: z.string().describe("Repository path to inspect."),
  baseRef: z.string().optional(),
  validationCommands: z.array(z.string()).optional(),
});

export type ReviewRepositoryInput = z.infer<typeof reviewRepositoryInputSchema>;

export async function handleReviewRepository(input: ReviewRepositoryInput) {
  const report = await reviewRepository({
    repositoryPath: input.repo_path,
    baseRef: input.baseRef,
    validationCommands: input.validationCommands,
  });
  return { content: [{ type: "text" as const, text: report }] };
}

const server = new McpServer({ name: "repository-inspector", version: "2.0.0" });

server.tool(
  "review_repository",
  "Inspects a Git repository and returns a review report.",
  reviewRepositoryInputSchema.shape,
  handleReviewRepository,
);

await server.connect(new StdioServerTransport());