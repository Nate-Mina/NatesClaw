import type { RuntimeId } from "./runtime-parity.js";

type QaRuntimeWallClockMetrics = {
  totalWallClockMs: number | null;
  p50WallClockMs: number | null;
  p90WallClockMs: number | null;
};

type QaRuntimeSpeedComparison = {
  fasterRuntime: RuntimeId | "tie" | null;
  speedupPercent: number | null;
};

export type QaRuntimeTiming = QaRuntimeSpeedComparison & {
  natesclaw: QaRuntimeWallClockMetrics;
  codex: QaRuntimeWallClockMetrics;
  bootstrap?: {
    natesclaw: QaRuntimeWallClockMetrics;
    codex: QaRuntimeWallClockMetrics;
  };
};

export type QaRuntimeParityCellTiming = {
  wallClockMs: number;
  bootstrapWallClockMs: number;
};

export function measureRuntimeParityCellTiming(params: {
  suiteStartedAt: Date;
  bootstrapFinishedAt?: Date;
  scenarioStartedAt: Date;
  scenarioFinishedAt: Date;
}): QaRuntimeParityCellTiming {
  return {
    // Gateway/provider startup is harness bootstrap, not an agent turn. Keep
    // both measurements so a faster report cannot hide cold-start regressions.
    wallClockMs: Math.max(
      1,
      params.scenarioFinishedAt.getTime() - params.scenarioStartedAt.getTime(),
    ),
    bootstrapWallClockMs: Math.max(
      0,
      (params.bootstrapFinishedAt ?? params.scenarioStartedAt).getTime() -
        params.suiteStartedAt.getTime(),
    ),
  };
}

export function compareRuntimeWallClockMs(
  natesclawWallClockMs: number | null,
  codexWallClockMs: number | null,
): QaRuntimeSpeedComparison {
  if (natesclawWallClockMs === null || codexWallClockMs === null) {
    return { fasterRuntime: null, speedupPercent: null };
  }
  if (natesclawWallClockMs === codexWallClockMs) {
    return { fasterRuntime: "tie", speedupPercent: 0 };
  }
  const fasterRuntime = natesclawWallClockMs < codexWallClockMs ? "natesclaw" : "codex";
  const fasterWallClockMs = Math.min(natesclawWallClockMs, codexWallClockMs);
  const slowerWallClockMs = Math.max(natesclawWallClockMs, codexWallClockMs);
  return {
    fasterRuntime,
    speedupPercent:
      fasterWallClockMs === 0
        ? null
        : ((slowerWallClockMs - fasterWallClockMs) / fasterWallClockMs) * 100,
  };
}

function summarizeRuntimeWallClock(values: number[]): QaRuntimeWallClockMetrics {
  if (values.length === 0) {
    return { totalWallClockMs: null, p50WallClockMs: null, p90WallClockMs: null };
  }
  const sorted = values.toSorted((left, right) => left - right);
  const percentile = (value: number) =>
    sorted[Math.min(sorted.length - 1, Math.ceil((value / 100) * sorted.length) - 1)] ?? null;
  return {
    totalWallClockMs: sorted.reduce((total, value) => total + value, 0),
    p50WallClockMs: percentile(50),
    p90WallClockMs: percentile(90),
  };
}

export function summarizeRuntimeParityTiming(
  scenarios: readonly {
    natesclawWallClockMs: number | null;
    codexWallClockMs: number | null;
    natesclawBootstrapWallClockMs?: number | null;
    codexBootstrapWallClockMs?: number | null;
  }[],
): QaRuntimeTiming {
  const natesclaw = summarizeRuntimeWallClock(
    scenarios.flatMap(({ natesclawWallClockMs }) =>
      natesclawWallClockMs === null ? [] : [natesclawWallClockMs],
    ),
  );
  const codex = summarizeRuntimeWallClock(
    scenarios.flatMap(({ codexWallClockMs }) =>
      codexWallClockMs === null ? [] : [codexWallClockMs],
    ),
  );
  const pairedTimingCaptures = scenarios.flatMap(({ natesclawWallClockMs, codexWallClockMs }) =>
    natesclawWallClockMs === null || codexWallClockMs === null
      ? []
      : [{ natesclawWallClockMs, codexWallClockMs }],
  );
  const natesclawBootstrapValues = scenarios.flatMap(({ natesclawBootstrapWallClockMs }) =>
    natesclawBootstrapWallClockMs == null ? [] : [natesclawBootstrapWallClockMs],
  );
  const codexBootstrapValues = scenarios.flatMap(({ codexBootstrapWallClockMs }) =>
    codexBootstrapWallClockMs == null ? [] : [codexBootstrapWallClockMs],
  );
  return {
    natesclaw,
    codex,
    ...(natesclawBootstrapValues.length > 0 || codexBootstrapValues.length > 0
      ? {
          bootstrap: {
            natesclaw: summarizeRuntimeWallClock(natesclawBootstrapValues),
            codex: summarizeRuntimeWallClock(codexBootstrapValues),
          },
        }
      : {}),
    ...compareRuntimeWallClockMs(
      pairedTimingCaptures.length > 0
        ? pairedTimingCaptures.reduce((total, capture) => total + capture.natesclawWallClockMs, 0)
        : null,
      pairedTimingCaptures.length > 0
        ? pairedTimingCaptures.reduce((total, capture) => total + capture.codexWallClockMs, 0)
        : null,
    ),
  };
}

export function formatRuntimeWallClockMs(value: number | null): string {
  return value === null ? "N/A" : `${value} ms`;
}

export function formatRuntimeSpeedComparison(comparison: QaRuntimeSpeedComparison): string {
  if (comparison.fasterRuntime === null || comparison.speedupPercent === null) {
    return "N/A";
  }
  if (comparison.fasterRuntime === "tie") {
    return "tie";
  }
  return `${comparison.fasterRuntime} ${comparison.speedupPercent.toFixed(1)}% faster`;
}
