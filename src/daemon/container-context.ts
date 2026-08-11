/** Detects whether a daemon was launched by Natesclaw's container-aware service wrapper. */
import { normalizeOptionalString } from "@natesclaw/normalization-core/string-coerce";

/** Resolves the daemon container hint exposed by managed service environments. */
export function resolveDaemonContainerContext(
  env: Record<string, string | undefined> = process.env,
): string | null {
  return (
    normalizeOptionalString(env.NATESCLAW_CONTAINER_HINT) ||
    normalizeOptionalString(env.NATESCLAW_CONTAINER) ||
    null
  );
}
