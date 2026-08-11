import { expectDefined } from "@natesclaw/normalization-core";
// Hook install record helpers read and write installed hook metadata.
import type { HookInstallRecord } from "../config/types.hooks.js";
import type { NatesclawConfig } from "../config/types.natesclaw.js";
import { readConfigMachineState, updateConfigMachineState } from "../state/config-machine-state.js";
import type { NatesclawStateDatabaseOptions } from "../state/natesclaw-state-db.js";

/** Install record plus the hook pack id being updated in config. */
export type HookInstallUpdate = HookInstallRecord & { hookId: string };

/** Read canonical hook install records from machine state. */
export function readHookInstalls(
  options: NatesclawStateDatabaseOptions = {},
): Record<string, HookInstallRecord> {
  return (
    readConfigMachineState<Record<string, HookInstallRecord>>("hooks.internal.installs", options) ??
    {}
  );
}

/** Persist one hook install record in machine state. */
export function recordHookInstall(
  cfg: NatesclawConfig,
  update: HookInstallUpdate,
  options: NatesclawStateDatabaseOptions = {},
): NatesclawConfig {
  const { hookId, ...record } = update;
  updateConfigMachineState<Record<string, HookInstallRecord>>(
    "hooks.internal.installs",
    (current) => {
      const installs = {
        ...current,
        [hookId]: {
          ...current?.[hookId],
          ...record,
          installedAt: record.installedAt ?? new Date().toISOString(),
        },
      };
      installs[hookId] = expectDefined(installs[hookId], "installs entry at hook id");
      return installs;
    },
    options,
  );
  return cfg;
}
