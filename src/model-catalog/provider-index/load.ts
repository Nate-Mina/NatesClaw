// Provider-index loader normalizes bundled installable-provider metadata and falls back to an empty index.
import { normalizeNatesclawProviderIndex } from "./normalize.js";
import { NATESCLAW_PROVIDER_INDEX } from "./natesclaw-provider-index.js";
import type { NatesclawProviderIndex } from "./types.js";

// Load the bundled provider index through the normalizer. Invalid generated or
// caller-supplied data falls back to an empty v1 index instead of leaking shape.
export function loadNatesclawProviderIndex(
  source: unknown = NATESCLAW_PROVIDER_INDEX,
): NatesclawProviderIndex {
  return normalizeNatesclawProviderIndex(source) ?? { version: 1, providers: {} };
}
