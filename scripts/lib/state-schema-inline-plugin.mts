import fs from "node:fs";
import path from "node:path";

export const STATE_SCHEMA_INLINE_PLUGIN_NAME = "natesclaw:inline-state-schemas";

const STATE_SCHEMA_MODULES = [
  {
    modulePath: "src/state/natesclaw-state-schema.ts",
    schemaPath: "src/state/natesclaw-state-schema.sql",
    exportName: "NATESCLAW_STATE_SCHEMA_SQL",
  },
  {
    modulePath: "src/state/natesclaw-agent-schema.ts",
    schemaPath: "src/state/natesclaw-agent-schema.sql",
    exportName: "NATESCLAW_AGENT_SCHEMA_SQL",
  },
] as const;

/** Inline canonical schema bytes so bundled consumers need no SQL asset. */
export function createStateSchemaInlinePlugin(rootDir = process.cwd()) {
  const schemasByModulePath = new Map(
    STATE_SCHEMA_MODULES.map((schema) => [path.resolve(rootDir, schema.modulePath), schema]),
  );

  return {
    name: STATE_SCHEMA_INLINE_PLUGIN_NAME,
    load(this: { addWatchFile(id: string): void }, id: string) {
      const schema = schemasByModulePath.get(path.resolve(id));
      if (!schema) {
        return null;
      }
      const schemaPath = path.resolve(rootDir, schema.schemaPath);
      this.addWatchFile(schemaPath);
      return {
        code: `export const ${schema.exportName} = ${JSON.stringify(fs.readFileSync(schemaPath, "utf8"))};\n`,
        moduleType: "js" as const,
      };
    },
  };
}
