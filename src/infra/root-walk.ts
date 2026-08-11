// Root-bounded directory walking facade for explicit plugin SDK consumers.
import "./fs-safe-defaults.js";
import { root, type RootWalkEntry, type RootWalkOptions } from "@natesclaw/fs-safe/root";

export type { RootWalkEntry, RootWalkOptions } from "@natesclaw/fs-safe/root";

export async function* walkRootDirectory(
  rootDir: string,
  relativePath: string,
  options: RootWalkOptions,
): AsyncGenerator<RootWalkEntry> {
  const capability = await root(rootDir);
  yield* capability.walk(relativePath, options);
}
