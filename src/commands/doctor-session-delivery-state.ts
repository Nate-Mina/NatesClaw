import fs from "node:fs";
import type { DatabaseSync } from "node:sqlite";
import { parseSqliteSessionEntryRecord } from "../config/sessions/session-entry-json.js";
import { resolveAllAgentSessionStoreCandidateTargetsSync } from "../config/sessions/targets.js";
import type { SessionEntry } from "../config/sessions/types.js";
import type { NatesclawConfig } from "../config/types.natesclaw.js";
import { executeSqliteQuerySync, getNodeSqliteKysely } from "../infra/kysely-sync.js";
import { normalizeLegacySessionEntryDelivery } from "../infra/state-migrations.legacy-session-store.js";
import { withNatesclawAgentDatabaseReadOnly } from "../state/natesclaw-agent-db-readonly.js";
import type { DB as NatesclawAgentKyselyDatabase } from "../state/natesclaw-agent-db.generated.js";
import {
  closeNatesclawAgentDatabaseByPath,
  isNatesclawAgentDatabaseOpen,
  type NatesclawAgentDatabase,
  runNatesclawAgentWriteTransaction,
} from "../state/natesclaw-agent-db.js";
import {
  deliveryContextFromSession,
  sessionDeliveryChannel,
} from "../utils/delivery-context.shared.js";
import { runDoctorAgentDatabaseOperation } from "./doctor-agent-database-operation.js";
import {
  type DoctorSessionEntryRow,
  writeValidatedDoctorSessionEntryJson,
} from "./doctor-session-entry-rewrite.js";
import { resolveTargetSqlitePath } from "./doctor-session-sqlite-readers.js";

export type SessionDeliveryStateRepairReport = {
  found: number;
  repaired: number;
  scannedStores: number;
};

type DeliveryRewrite = {
  accountId: string | null;
  channel: string | null;
  currentSessionId: string;
  entryJson: string;
  row: DoctorSessionEntryRow;
};

/** Scan or rewrite legacy delivery fields inside existing session row JSON. */
export function repairCanonicalSessionDeliveryStates(params: {
  apply: boolean;
  cfg: NatesclawConfig;
  env: NodeJS.ProcessEnv;
}): SessionDeliveryStateRepairReport {
  const targets = listExistingAgentDatabaseTargets(params.cfg, params.env);
  let found = 0;
  let repaired = 0;
  for (const target of targets) {
    const operation = runDoctorAgentDatabaseOperation({
      agentId: target.agentId,
      path: target.sqlitePath,
      run: () =>
        withNatesclawAgentDatabaseReadOnly((database) => collectDeliveryRewrites(database.db), {
          agentId: target.agentId,
          env: params.env,
          path: target.sqlitePath,
        }),
    });
    if (!operation.ok || !operation.value.found) {
      continue;
    }
    found += operation.value.value.length;
    if (!params.apply || operation.value.value.length === 0) {
      continue;
    }
    const wasOpen = isNatesclawAgentDatabaseOpen(target.sqlitePath);
    try {
      repaired += runNatesclawAgentWriteTransaction(
        (database) => applyDeliveryRewrites(database),
        { agentId: target.agentId, env: params.env, path: target.sqlitePath },
        { operationLabel: "doctor.canonicalize-session-delivery-state" },
      );
    } finally {
      if (!wasOpen) {
        closeNatesclawAgentDatabaseByPath(target.sqlitePath);
      }
    }
  }
  return { found, repaired, scannedStores: targets.length };
}

function listExistingAgentDatabaseTargets(
  cfg: NatesclawConfig,
  env: NodeJS.ProcessEnv,
): Array<{ agentId: string; sqlitePath: string }> {
  const seenPaths = new Set<string>();
  return resolveAllAgentSessionStoreCandidateTargetsSync(cfg, { env }).flatMap((target) => {
    const sqlitePath = resolveTargetSqlitePath(target);
    if (seenPaths.has(sqlitePath) || !fs.existsSync(sqlitePath)) {
      return [];
    }
    seenPaths.add(sqlitePath);
    return [{ agentId: target.agentId, sqlitePath }];
  });
}

function collectDeliveryRewrites(database: DatabaseSync): DeliveryRewrite[] {
  const db = getNodeSqliteKysely<NatesclawAgentKyselyDatabase>(database);
  const rows = executeSqliteQuerySync(
    database,
    db
      .selectFrom("session_nodes")
      .select(["session_key", "current_session_id", "entry_json", "updated_at"]),
  ).rows;
  return rows.flatMap((row) => {
    const parsed = parseSqliteSessionEntryRecord(row);
    if (!parsed) {
      return [];
    }
    const entry = parsed as SessionEntry;
    const normalizedEntry = normalizeLegacySessionEntryDelivery(entry);
    const entryJson = JSON.stringify(normalizedEntry);
    return entryJson === row.entry_json ||
      !parseSqliteSessionEntryRecord({ ...row, entry_json: entryJson })
      ? []
      : [
          {
            accountId: deliveryContextFromSession(normalizedEntry)?.accountId ?? null,
            channel: sessionDeliveryChannel(normalizedEntry) ?? null,
            currentSessionId: row.current_session_id,
            entryJson,
            row,
          },
        ];
  });
}

function applyDeliveryRewrites(database: NatesclawAgentDatabase): number {
  const db = getNodeSqliteKysely<NatesclawAgentKyselyDatabase>(database.db);
  const rewrites = collectDeliveryRewrites(database.db);
  for (const rewrite of rewrites) {
    writeValidatedDoctorSessionEntryJson(database, rewrite.row, rewrite.entryJson);
    executeSqliteQuerySync(
      database.db,
      db
        .updateTable("session_windows")
        .set({ account_id: rewrite.accountId, channel: rewrite.channel })
        .where("session_id", "=", rewrite.currentSessionId),
    );
  }
  return rewrites.length;
}
