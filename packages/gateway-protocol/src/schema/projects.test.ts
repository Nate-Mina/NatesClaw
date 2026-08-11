import { Value } from "typebox/value";
import { describe, expect, it } from "vitest";
import {
  ProjectRecordSchema,
  ProjectsListResultSchema,
  validateProjectsListParams,
  validateProjectsRegisterParams,
  validateProjectsRemoveParams,
  validateSessionsCreateParams,
} from "../index.js";

describe("project protocol schemas", () => {
  it("validates project method inputs as closed objects", () => {
    expect(validateProjectsListParams({})).toBe(true);
    expect(validateProjectsListParams({ extra: true })).toBe(false);
    expect(validateProjectsRegisterParams({ path: "/repo", name: "Natesclaw" })).toBe(true);
    expect(validateProjectsRegisterParams({ path: "" })).toBe(false);
    expect(validateProjectsRemoveParams({ id: "natesclaw-2" })).toBe(true);
    expect(validateProjectsRemoveParams({ id: "workspace:main" })).toBe(false);
  });

  it("accepts workspace and stored project records", () => {
    expect(
      Value.Check(ProjectRecordSchema, {
        id: "workspace:main",
        displayName: "natesclaw",
        source: "workspace",
        agentId: "main",
      }),
    ).toBe(true);
    expect(
      Value.Check(ProjectsListResultSchema, {
        projects: [
          {
            id: "natesclaw",
            displayName: "Natesclaw",
            repoRoot: "/repo/natesclaw",
            originUrl: "https://github.com/natesclaw/natesclaw.git",
            source: "registered",
          },
        ],
      }),
    ).toBe(true);
  });

  it("accepts projectId as an additive sessions.create parameter", () => {
    expect(validateSessionsCreateParams({ agentId: "main", projectId: "natesclaw" })).toBe(true);
    expect(validateSessionsCreateParams({ agentId: "main", projectId: "" })).toBe(false);
  });
});
