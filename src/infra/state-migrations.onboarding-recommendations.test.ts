import { afterEach, describe, expect, it } from "vitest";
import type { NatesclawConfig } from "../config/config.js";
import { createOnboardingRecommendationsStore } from "../state/onboarding-recommendations.js";
import type { DB as NatesclawStateKyselyDatabase } from "../state/natesclaw-state-db.generated.js";
import {
  closeNatesclawStateDatabaseForTest,
  runNatesclawStateWriteTransaction,
} from "../state/natesclaw-state-db.js";
import { withNatesclawTestState } from "../test-utils/natesclaw-test-state.js";
import {
  executeSqliteQuerySync,
  executeSqliteQueryTakeFirstSync,
  getNodeSqliteKysely,
} from "./kysely-sync.js";
import { migrateLegacyOnboardingRecommendationsScope } from "./state-migrations.onboarding-recommendations.js";

type OnboardingRecommendationsMigrationDatabase = Pick<
  NatesclawStateKyselyDatabase,
  "onboarding_recommendations"
>;

function insertRecommendationRow(params: {
  database: { env: NodeJS.ProcessEnv };
  configKey: string;
  inventoryHash: string;
}): void {
  runNatesclawStateWriteTransaction(({ db: sqlite }) => {
    const db = getNodeSqliteKysely<OnboardingRecommendationsMigrationDatabase>(sqlite);
    executeSqliteQuerySync(
      sqlite,
      db.insertInto("onboarding_recommendations").values({
        config_key: params.configKey,
        inventory_hash: params.inventoryHash,
        matches_json: "[]",
        offered_at_ms: 1_000,
        accepted_at_ms: 2_000,
        updated_at_ms: 2_000,
      }),
    );
  }, params.database);
}

function readRecommendationKey(
  database: { env: NodeJS.ProcessEnv },
  configKey: string,
): { config_key: string } | undefined {
  return runNatesclawStateWriteTransaction(({ db: sqlite }) => {
    const db = getNodeSqliteKysely<OnboardingRecommendationsMigrationDatabase>(sqlite);
    return executeSqliteQueryTakeFirstSync(
      sqlite,
      db
        .selectFrom("onboarding_recommendations")
        .select("config_key")
        .where("config_key", "=", configKey),
    );
  }, database);
}

afterEach(() => {
  closeNatesclawStateDatabaseForTest();
});

describe("onboarding recommendations scope migration", () => {
  it("moves the legacy singleton row to the default workspace", async () => {
    await withNatesclawTestState(
      { label: "onboarding-recommendations-migration" },
      async (state) => {
        const database = { env: state.env };
        insertRecommendationRow({
          database,
          configKey: "primary",
          inventoryHash: "legacy-inventory",
        });

        const result = migrateLegacyOnboardingRecommendationsScope({
          cfg: {
            agents: {
              defaults: { workspace: state.workspaceDir },
              entries: { main: { default: true } },
            },
          } as NatesclawConfig,
          env: state.env,
        });

        expect(result).toEqual({
          changes: ["Migrated onboarding recommendation state to the default workspace scope."],
          warnings: [],
        });
        expect(
          createOnboardingRecommendationsStore({
            workspaceDir: state.workspaceDir,
            database,
          }).read(),
        ).toEqual({
          inventoryHash: "legacy-inventory",
          matches: [],
          offeredAt: 1_000,
          acceptedAt: 2_000,
          updatedAt: 2_000,
        });
        expect(readRecommendationKey(database, "primary")).toBeUndefined();
      },
    );
  });

  it("keeps an existing scoped row when legacy state is also present", async () => {
    await withNatesclawTestState(
      { label: "onboarding-recommendations-migration-conflict" },
      async (state) => {
        const database = { env: state.env };
        const store = createOnboardingRecommendationsStore({
          workspaceDir: state.workspaceDir,
          database,
        });
        const scoped = store.writeOffer({
          inventory: [{ label: "Scoped" }],
          matches: [],
          answered: false,
          nowMs: 3_000,
        });
        insertRecommendationRow({
          database,
          configKey: "primary",
          inventoryHash: "legacy-inventory",
        });

        const result = migrateLegacyOnboardingRecommendationsScope({
          cfg: {
            agents: {
              defaults: { workspace: state.workspaceDir },
              entries: { main: { default: true } },
            },
          } as NatesclawConfig,
          env: state.env,
        });

        expect(result).toEqual({
          changes: [
            "Removed ambiguous legacy onboarding recommendation state; kept the default workspace record.",
          ],
          warnings: [],
        });
        expect(store.read()).toEqual(scoped);
        expect(readRecommendationKey(database, "primary")).toBeUndefined();
      },
    );
  });
});
