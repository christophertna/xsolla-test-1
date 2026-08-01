import { describe, expect, it } from "vitest";
import { parseNameStatus } from "../src/git.js";

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
