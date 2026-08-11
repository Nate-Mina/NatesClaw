export type NatesclawSchemaVersions = {
  state: number;
  agent: number;
};

export function parseNatesclawSchemaVersions(value: unknown): NatesclawSchemaVersions | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }
  const record = value as Record<string, unknown>;
  if (
    !Number.isInteger(record.state) ||
    (record.state as number) < 0 ||
    !Number.isInteger(record.agent) ||
    (record.agent as number) < 0
  ) {
    return undefined;
  }
  return { state: record.state as number, agent: record.agent as number };
}

export function parsePackageNatesclawSchemaVersions(
  packageJson: unknown,
): NatesclawSchemaVersions | undefined {
  if (!packageJson || typeof packageJson !== "object" || Array.isArray(packageJson)) {
    return undefined;
  }
  const natesclaw = (packageJson as Record<string, unknown>).natesclaw;
  if (!natesclaw || typeof natesclaw !== "object" || Array.isArray(natesclaw)) {
    return undefined;
  }
  return parseNatesclawSchemaVersions((natesclaw as Record<string, unknown>).schemaVersions);
}
