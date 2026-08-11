/** Discovery and shutdown of stale Natesclaw launchd updater jobs. */
import path from "node:path";
import { parseStrictInteger, parseStrictPositiveInteger } from "../infra/parse-finite-number.js";
import {
  GATEWAY_SERVICE_KIND,
  GATEWAY_SERVICE_MARKER,
  resolveGatewayLaunchAgentLabel,
} from "./constants.js";
import { isCurrentProcessLaunchdServiceLabel } from "./launchd-current-service.js";
import { execLaunchctl } from "./launchd-exec.js";
import { assertValidLaunchAgentLabel } from "./launchd-label.js";
import { readLaunchAgentProgramArgumentsFromFile } from "./launchd-plist.js";
import { resolveLaunchAgentGuiDomain } from "./launchd-runtime.js";
import { resolveLaunchAgentPlistPathForLabel } from "./launchd-service-files.js";

const NATESCLAW_UPDATE_LAUNCHD_LABEL_PREFIX = "ai.natesclaw.update.";
const NATESCLAW_MANUAL_UPDATE_LAUNCHD_LABEL_PATTERN = /^ai\.natesclaw\.manual-update\.\d+$/;
const NATESCLAW_PROFILE_UPDATE_LAUNCHD_LABEL_PATTERN =
  /^ai\.natesclaw\.[A-Za-z0-9._-]+\.update\.[A-Za-z0-9._-]+$/;
const NATESCLAW_DIRECT_CLI_NAMES = new Set(["natesclaw", "natesclaw.mjs"]);
const NATESCLAW_NODE_RUNTIME_NAMES = new Set(["bun", "bun.exe", "node", "node.exe"]);
const NATESCLAW_SCRIPT_NAMES = new Set(["natesclaw.mjs"]);
export type StaleNatesclawUpdateLaunchdJob = {
  label: string;
  pid?: number;
  lastExitStatus?: number;
};

type NatesclawUpdateLaunchdLabelCandidate = {
  label: string;
  requiresMetadata: boolean;
};

function normalizeNatesclawUpdateLaunchdLabel(label: unknown): string | null {
  if (typeof label !== "string") {
    return null;
  }
  const trimmed = label.trim();
  if (trimmed.startsWith(NATESCLAW_UPDATE_LAUNCHD_LABEL_PREFIX)) {
    return trimmed;
  }
  // Manual update jobs include a timestamp-like suffix and should be cleaned up
  // without matching arbitrary ai.natesclaw labels.
  return NATESCLAW_MANUAL_UPDATE_LAUNCHD_LABEL_PATTERN.test(trimmed) ? trimmed : null;
}

function normalizeNatesclawUpdateLaunchdLabelCandidate(
  label: unknown,
): NatesclawUpdateLaunchdLabelCandidate | null {
  const normalized = normalizeNatesclawUpdateLaunchdLabel(label);
  if (normalized) {
    return { label: normalized, requiresMetadata: false };
  }
  if (typeof label !== "string") {
    return null;
  }
  const trimmed = label.trim();
  return NATESCLAW_PROFILE_UPDATE_LAUNCHD_LABEL_PATTERN.test(trimmed)
    ? { label: trimmed, requiresMetadata: true }
    : null;
}

function isCurrentGatewayLaunchdLabel(label: string, env: NodeJS.ProcessEnv): boolean {
  const gatewayProfileLabel = resolveGatewayLaunchAgentLabel(env.NATESCLAW_PROFILE);
  if (label === gatewayProfileLabel) {
    return true;
  }
  if (
    env.NATESCLAW_SERVICE_MARKER?.trim() !== GATEWAY_SERVICE_MARKER ||
    env.NATESCLAW_SERVICE_KIND?.trim() !== GATEWAY_SERVICE_KIND
  ) {
    return false;
  }
  const configuredLabel = env.NATESCLAW_LAUNCHD_LABEL?.trim();
  return Boolean(configuredLabel && label === configuredLabel);
}

function resolveCurrentNatesclawUpdateLaunchdJobLabel(
  env: NodeJS.ProcessEnv = process.env,
): NatesclawUpdateLaunchdLabelCandidate | null {
  for (const label of [
    env.LAUNCH_JOB_LABEL,
    env.LAUNCH_JOB_NAME,
    env.XPC_SERVICE_NAME,
    env.NATESCLAW_LAUNCHD_LABEL,
  ]) {
    const candidate = normalizeNatesclawUpdateLaunchdLabelCandidate(label);
    if (candidate) {
      if (isCurrentGatewayLaunchdLabel(candidate.label, env)) {
        continue;
      }
      return candidate;
    }
  }
  return null;
}

export function parseLaunchctlListNatesclawUpdateJobs(
  output: string,
): StaleNatesclawUpdateLaunchdJob[] {
  return parseLaunchctlListNatesclawUpdateJobCandidates(output)
    .filter((job) => !job.requiresMetadata)
    .map(({ requiresMetadata: _requiresMetadata, ...job }) => job);
}

function parseLaunchctlListNatesclawUpdateJobCandidates(
  output: string,
): Array<StaleNatesclawUpdateLaunchdJob & NatesclawUpdateLaunchdLabelCandidate> {
  const jobs: Array<StaleNatesclawUpdateLaunchdJob & NatesclawUpdateLaunchdLabelCandidate> = [];
  for (const rawLine of output.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }
    const parts = line.split(/\s+/);
    const [pidRaw, statusRaw, ...labelParts] = parts;
    const candidate = normalizeNatesclawUpdateLaunchdLabelCandidate(labelParts.join(" "));
    if (!candidate) {
      continue;
    }
    const pid = pidRaw === "-" ? undefined : parseStrictPositiveInteger(pidRaw ?? "");
    const lastExitStatus = parseStrictInteger(statusRaw ?? "");
    jobs.push({
      label: candidate.label,
      requiresMetadata: candidate.requiresMetadata,
      ...(pid !== undefined ? { pid } : {}),
      ...(lastExitStatus !== undefined ? { lastExitStatus } : {}),
    });
  }
  return jobs.toSorted((a, b) => a.label.localeCompare(b.label));
}

function hasNatesclawUpdateLaunchdMarker(env: Record<string, string | undefined> | undefined) {
  return env?.NATESCLAW_UPDATE_RUN_HANDOFF?.trim() === "1";
}

function isNatesclawUpdateCommandPrefix(programArguments: string[], updateIndex: number): boolean {
  if (updateIndex === 1) {
    const cliName = path.basename(programArguments[0] ?? "").toLowerCase();
    return NATESCLAW_DIRECT_CLI_NAMES.has(cliName);
  }
  if (updateIndex !== 2) {
    return false;
  }
  const runtimeName = path.basename(programArguments[0] ?? "").toLowerCase();
  const entryName = path.basename(programArguments[1] ?? "").toLowerCase();
  return NATESCLAW_NODE_RUNTIME_NAMES.has(runtimeName) && NATESCLAW_SCRIPT_NAMES.has(entryName);
}

function isNatesclawUpdateProgramArguments(programArguments: string[] | undefined): boolean {
  if (!Array.isArray(programArguments) || programArguments.length === 0) {
    return false;
  }
  const updateIndex = programArguments.findIndex((arg) => arg.trim() === "update");
  if (updateIndex < 0 || !programArguments.slice(updateIndex + 1).includes("--yes")) {
    return false;
  }
  return (
    isNatesclawUpdateCommandPrefix(programArguments, updateIndex) &&
    !programArguments.some((arg) => arg.trim() === "gateway")
  );
}

async function isLaunchdJobConfirmedNatesclawUpdater(params: {
  label: string;
  env: NodeJS.ProcessEnv;
}): Promise<boolean> {
  const plistPath = resolveLaunchAgentPlistPathForLabel(params.env, params.label);
  const command = await readLaunchAgentProgramArgumentsFromFile(plistPath);
  return (
    hasNatesclawUpdateLaunchdMarker(command?.environment) ||
    isNatesclawUpdateProgramArguments(command?.programArguments)
  );
}

export async function findStaleNatesclawUpdateLaunchdJobs(
  env: NodeJS.ProcessEnv = process.env,
): Promise<StaleNatesclawUpdateLaunchdJob[]> {
  if (process.platform !== "darwin") {
    return [];
  }
  const result = await execLaunchctl(["list"]);
  if (result.code !== 0) {
    return [];
  }
  // Never report the active gateway label as stale even when a wrapper exposes
  // update-like launchd metadata through the current environment.
  const jobs: StaleNatesclawUpdateLaunchdJob[] = [];
  for (const job of parseLaunchctlListNatesclawUpdateJobCandidates(result.stdout)) {
    if (isCurrentGatewayLaunchdLabel(job.label, env)) {
      continue;
    }
    if (
      job.requiresMetadata &&
      !(await isLaunchdJobConfirmedNatesclawUpdater({ label: job.label, env }))
    ) {
      continue;
    }
    jobs.push({
      label: job.label,
      ...(job.pid !== undefined ? { pid: job.pid } : {}),
      ...(job.lastExitStatus !== undefined ? { lastExitStatus: job.lastExitStatus } : {}),
    });
  }
  return jobs;
}

async function disableNatesclawUpdateLaunchdJobCandidate(params: {
  candidate: NatesclawUpdateLaunchdLabelCandidate;
  env: NodeJS.ProcessEnv;
  trustCurrentEnvMarker: boolean;
}): Promise<boolean> {
  if (process.platform !== "darwin") {
    return false;
  }
  if (
    params.candidate.requiresMetadata &&
    !(
      (params.trustCurrentEnvMarker && hasNatesclawUpdateLaunchdMarker(params.env)) ||
      (await isLaunchdJobConfirmedNatesclawUpdater({
        label: params.candidate.label,
        env: params.env,
      }))
    )
  ) {
    return false;
  }
  const serviceTarget = `${resolveLaunchAgentGuiDomain()}/${assertValidLaunchAgentLabel(params.candidate.label)}`;
  const result = await execLaunchctl(["disable", serviceTarget]);
  return result.code === 0;
}

export async function disableNatesclawUpdateLaunchdJob(
  label: string,
  env: NodeJS.ProcessEnv = process.env,
): Promise<boolean> {
  const candidate = normalizeNatesclawUpdateLaunchdLabelCandidate(label);
  if (!candidate) {
    return false;
  }
  return await disableNatesclawUpdateLaunchdJobCandidate({
    candidate,
    env,
    trustCurrentEnvMarker: false,
  });
}

export async function disableCurrentNatesclawUpdateLaunchdJob(
  env: NodeJS.ProcessEnv = process.env,
): Promise<boolean> {
  const candidate = resolveCurrentNatesclawUpdateLaunchdJobLabel(env);
  if (!candidate) {
    return false;
  }
  return await disableNatesclawUpdateLaunchdJobCandidate({
    candidate,
    env,
    // Detached handoffs preserve the configured label, so only launchd-backed
    // current-process identity may turn the ambient marker into proof.
    trustCurrentEnvMarker: isCurrentProcessLaunchdServiceLabel(candidate.label, env, {
      allowConfiguredLabelFallback: false,
    }),
  });
}
