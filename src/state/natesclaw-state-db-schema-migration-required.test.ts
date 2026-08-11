import { describe, expect, it } from "vitest";
import {
  findNatesclawStateDatabaseSchemaMigrationRequiredError,
  NatesclawStateDatabaseSchemaMigrationRequiredError,
} from "./natesclaw-state-db-schema-migration-required.js";

describe("state database schema migration error classification", () => {
  it("recognizes a rehydrated exact migration error through its cause chain", () => {
    const original = new NatesclawStateDatabaseSchemaMigrationRequiredError(
      "agent-databases-composite-primary-key",
      "/tmp/natesclaw.sqlite",
    );
    const rehydrated = new Error("startup failed", {
      cause: new Error(original.message),
    });

    expect(findNatesclawStateDatabaseSchemaMigrationRequiredError(rehydrated)).toMatchObject({
      kind: "agent-databases-composite-primary-key",
      pathname: "/tmp/natesclaw.sqlite",
    });
  });

  it("recognizes an exact instance of the typed error", () => {
    const original = new NatesclawStateDatabaseSchemaMigrationRequiredError(
      "audit-events-v2",
      "/tmp/natesclaw.sqlite",
    );

    expect(findNatesclawStateDatabaseSchemaMigrationRequiredError(original)).toBe(original);
  });

  it("does not classify similar operator guidance as the migration error", () => {
    expect(
      findNatesclawStateDatabaseSchemaMigrationRequiredError(
        new Error(
          "Natesclaw state database /tmp/natesclaw.sqlite is stale; run natesclaw doctor --fix.",
        ),
      ),
    ).toBeUndefined();
  });

  it("does not classify the agent DB media migration error", () => {
    // Ensure the state-DB classifier does not accidentally match agent-DB messages.
    expect(
      findNatesclawStateDatabaseSchemaMigrationRequiredError(
        new Error(
          "Natesclaw agent database /tmp/natesclaw-agent.sqlite uses schema version 5; run natesclaw doctor --fix to migrate persisted media before using it.",
        ),
      ),
    ).toBeUndefined();
  });
});
