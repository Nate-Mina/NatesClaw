const GATEWAY_STATE_SCHEMA_MIGRATION_REQUIRED_REASON = "gateway.state_schema_migration_required";

type NatesclawStateDatabaseSchemaMigrationRequiredKind =
  | "agent-databases-composite-primary-key"
  | "audit-events-v2";

export class NatesclawStateDatabaseSchemaMigrationRequiredError extends Error {
  readonly code = GATEWAY_STATE_SCHEMA_MIGRATION_REQUIRED_REASON;

  constructor(
    readonly kind: NatesclawStateDatabaseSchemaMigrationRequiredKind,
    readonly pathname: string,
  ) {
    super(
      `Natesclaw state database schema migration required (${kind}) at ${pathname}; run natesclaw doctor --fix to migrate it.`,
    );
    this.name = "NatesclawStateDatabaseSchemaMigrationRequiredError";
  }
}

const STATE_SCHEMA_MIGRATION_REQUIRED_MESSAGE =
  /^Natesclaw state database schema migration required \((agent-databases-composite-primary-key|audit-events-v2)\) at (.+); run natesclaw doctor --fix to migrate it\.$/u;

function parseStateSchemaMigrationRequiredMessage(
  message: unknown,
): NatesclawStateDatabaseSchemaMigrationRequiredError | undefined {
  if (typeof message !== "string") {
    return undefined;
  }
  const match = STATE_SCHEMA_MIGRATION_REQUIRED_MESSAGE.exec(message);
  const kind = match?.[1] as NatesclawStateDatabaseSchemaMigrationRequiredKind | undefined;
  const pathname = match?.[2];
  if (!kind || !pathname) {
    return undefined;
  }
  return new NatesclawStateDatabaseSchemaMigrationRequiredError(kind, pathname);
}

export function findNatesclawStateDatabaseSchemaMigrationRequiredError(
  error: unknown,
): NatesclawStateDatabaseSchemaMigrationRequiredError | undefined {
  let current = error;
  const seen = new Set<unknown>();
  while (current && typeof current === "object" && !seen.has(current)) {
    if (current instanceof NatesclawStateDatabaseSchemaMigrationRequiredError) {
      return current;
    }
    const errorLike = current as { cause?: unknown; message?: unknown };
    const parsed = parseStateSchemaMigrationRequiredMessage(errorLike.message);
    if (parsed) {
      return parsed;
    }
    seen.add(current);
    current = errorLike.cause;
  }
  return undefined;
}
