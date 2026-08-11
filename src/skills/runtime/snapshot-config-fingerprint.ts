import crypto from "node:crypto";
import { stableStringify } from "@natesclaw/normalization-core";
import { redactConfigObject } from "../../config/redact-snapshot.js";
import type { NatesclawConfig } from "../../config/types.natesclaw.js";

let configFingerprints = new WeakMap<NatesclawConfig, string>();

export function fingerprintSkillSnapshotConfig(config: NatesclawConfig): string {
  const cached = configFingerprints.get(config);
  if (cached) {
    return cached;
  }
  const fingerprint = crypto
    .createHash("sha256")
    .update(stableStringify(redactConfigObject(config)))
    .digest("hex");
  configFingerprints.set(config, fingerprint);
  return fingerprint;
}

export function resetSkillSnapshotConfigFingerprintCache(): void {
  configFingerprints = new WeakMap();
}
