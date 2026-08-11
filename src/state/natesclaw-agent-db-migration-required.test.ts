import { describe, expect, it } from "vitest";
import {
  findNatesclawAgentDatabaseMediaMigrationRequiredError,
  NatesclawAgentDatabaseMediaMigrationRequiredError,
} from "./natesclaw-agent-db-migration-required.js";

describe("agent database media migration error classification", () => {
  it("recognizes a rehydrated exact migration error through its cause chain", () => {
    const original = new NatesclawAgentDatabaseMediaMigrationRequiredError(
      "/tmp/natesclaw-agent.sqlite",
      14,
    );
    const rehydrated = new Error("startup failed", {
      cause: new Error(original.message),
    });

    expect(findNatesclawAgentDatabaseMediaMigrationRequiredError(rehydrated)).toMatchObject({
      pathname: "/tmp/natesclaw-agent.sqlite",
      schemaVersion: 14,
    });
  });

  it("does not classify similar operator guidance as the migration error", () => {
    expect(
      findNatesclawAgentDatabaseMediaMigrationRequiredError(
        new Error("Natesclaw agent database is outdated; run natesclaw doctor --fix to migrate it."),
      ),
    ).toBeUndefined();
  });
});
