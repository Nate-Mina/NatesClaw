import { DatabaseSync } from "node:sqlite";
import { expect, it, vi } from "vitest";

const trailingSchema = vi.hoisted(() => ({
  tableName: "future_lazy_state",
  sql: "CREATE TABLE IF NOT EXISTS future_lazy_state (id TEXT PRIMARY KEY) STRICT;",
}));

vi.mock("./natesclaw-state-schema.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./natesclaw-state-schema.js")>();
  return {
    ...actual,
    NATESCLAW_STATE_SCHEMA_SQL: `${actual.NATESCLAW_STATE_SCHEMA_SQL}\n${trailingSchema.sql}\n`,
  };
});

import { ensureSecretStoreSchema } from "./natesclaw-state-db-schema-additive.js";

it("keeps secret-store first use from installing later additive schema", () => {
  const database = new DatabaseSync(":memory:");
  try {
    ensureSecretStoreSchema(database);
    const names = database
      .prepare("SELECT name FROM sqlite_schema WHERE name IN (?, ?, ?) ORDER BY name")
      .all("secret_store_entries", "secret_store_entries_live_idx", trailingSchema.tableName)
      .map((row) => row.name);

    expect(names).toEqual(["secret_store_entries", "secret_store_entries_live_idx"]);
  } finally {
    database.close();
  }
});
