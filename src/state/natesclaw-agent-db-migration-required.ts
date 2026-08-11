export const GATEWAY_AGENT_MEDIA_MIGRATION_REQUIRED_REASON =
  "gateway.agent_media_migration_required";

export class NatesclawAgentDatabaseMediaMigrationRequiredError extends Error {
  readonly code = GATEWAY_AGENT_MEDIA_MIGRATION_REQUIRED_REASON;

  constructor(
    readonly pathname: string,
    readonly schemaVersion: number,
  ) {
    super(
      `Natesclaw agent database ${pathname} uses schema version ${schemaVersion}; run natesclaw doctor --fix to migrate persisted media before using it.`,
    );
    this.name = "NatesclawAgentDatabaseMediaMigrationRequiredError";
  }
}

const AGENT_MEDIA_MIGRATION_REQUIRED_MESSAGE =
  /^Natesclaw agent database (.+) uses schema version (\d+); run natesclaw doctor --fix to migrate persisted media before using it\.$/u;

function parseAgentMediaMigrationRequiredMessage(
  message: unknown,
): NatesclawAgentDatabaseMediaMigrationRequiredError | undefined {
  if (typeof message !== "string") {
    return undefined;
  }
  const match = AGENT_MEDIA_MIGRATION_REQUIRED_MESSAGE.exec(message);
  const pathname = match?.[1];
  const rawSchemaVersion = match?.[2];
  if (!pathname || !rawSchemaVersion) {
    return undefined;
  }
  const schemaVersion = Number(rawSchemaVersion);
  if (!Number.isSafeInteger(schemaVersion)) {
    return undefined;
  }
  return new NatesclawAgentDatabaseMediaMigrationRequiredError(pathname, schemaVersion);
}

export function findNatesclawAgentDatabaseMediaMigrationRequiredError(
  error: unknown,
): NatesclawAgentDatabaseMediaMigrationRequiredError | undefined {
  let current = error;
  const seen = new Set<unknown>();
  while (current && typeof current === "object" && !seen.has(current)) {
    if (current instanceof NatesclawAgentDatabaseMediaMigrationRequiredError) {
      return current;
    }
    const errorLike = current as { cause?: unknown; message?: unknown };
    const parsed = parseAgentMediaMigrationRequiredMessage(errorLike.message);
    if (parsed) {
      return parsed;
    }
    seen.add(current);
    current = errorLike.cause;
  }
  return undefined;
}

export function formatLegacyAgentMediaMigrationRequiredMessage(
  pathname: string,
  schemaVersion: number,
): string {
  return new NatesclawAgentDatabaseMediaMigrationRequiredError(pathname, schemaVersion).message;
}
