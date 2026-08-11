type FallbackSkipCacheState = {
  buckets: Map<string, Map<string, unknown>>;
  lastGlobalPruneAtMs: number;
};

function getFallbackSkipCacheGlobals() {
  return globalThis as typeof globalThis & {
    natesclawFallbackSkipCache?: Map<string, Map<string, unknown>>;
    natesclawFallbackSkipCacheState?: FallbackSkipCacheState;
  };
}

export function resetFallbackSkipCacheForTest(): void {
  const globals = getFallbackSkipCacheGlobals();
  globals.natesclawFallbackSkipCache?.clear();
  globals.natesclawFallbackSkipCacheState?.buckets.clear();
  if (globals.natesclawFallbackSkipCacheState) {
    globals.natesclawFallbackSkipCacheState.lastGlobalPruneAtMs = 0;
  }
}

export function listFallbackSkipCacheSessionIdsForTest(): string[] {
  const globals = getFallbackSkipCacheGlobals();
  return [...(globals.natesclawFallbackSkipCacheState?.buckets.keys() ?? [])];
}
