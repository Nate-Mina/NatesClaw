import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { afterEach, describe, expect, it } from "vitest";
import { useAutoCleanupTempDirTracker } from "../../test/helpers/temp-dir.js";
import type { NatesclawConfig } from "../config/types.natesclaw.js";
import { requireNodeSqlite } from "../infra/node-sqlite.js";
import {
  closeNatesclawStateDatabaseForTest,
  openNatesclawStateDatabase,
} from "../state/natesclaw-state-db.js";
import {
  listProjectRegistry,
  ProjectCheckoutError,
  registerProjectRegistry,
  removeProjectRegistry,
} from "./project-registry.js";

const execFileAsync = promisify(execFile);
const tempDirs = useAutoCleanupTempDirTracker(afterEach);

afterEach(() => {
  closeNatesclawStateDatabaseForTest();
});

async function initializeRepository(root: string, name: string): Promise<string> {
  const repo = path.join(root, name);
  await fs.mkdir(repo, { recursive: true });
  await execFileAsync("git", ["init", "-b", "main", repo]);
  await execFileAsync("git", ["-C", repo, "config", "user.name", "Natesclaw Tests"]);
  await execFileAsync("git", ["-C", repo, "config", "user.email", "tests@natesclaw.invalid"]);
  await fs.writeFile(path.join(repo, "README.md"), `${name}\n`);
  await execFileAsync("git", ["-C", repo, "add", "README.md"]);
  await execFileAsync("git", ["-C", repo, "commit", "-m", "initial"]);
  return await fs.realpath(repo);
}

describe("project registry", () => {
  it("lazily ensures the additive table exactly once per database", async () => {
    const root = tempDirs.make("natesclaw-project-schema-");
    const options = { path: path.join(root, "state.sqlite") };
    openNatesclawStateDatabase(options);
    closeNatesclawStateDatabaseForTest();
    const { DatabaseSync } = requireNodeSqlite();
    const legacy = new DatabaseSync(options.path);
    legacy.exec("DROP TABLE projects;");
    legacy.close();

    const state = openNatesclawStateDatabase(options);
    expect(
      state.db
        .prepare("SELECT name FROM sqlite_schema WHERE type = 'table' AND name = 'projects'")
        .get(),
    ).toBeUndefined();

    expect(listProjectRegistry({} as NatesclawConfig, options)).toEqual([
      expect.objectContaining({ id: "workspace:main", source: "workspace" }),
    ]);
    expect(listProjectRegistry({} as NatesclawConfig, options)).toHaveLength(1);

    const rows = state.db
      .prepare("SELECT name FROM sqlite_schema WHERE type = 'table' AND name = 'projects'")
      .all();
    expect(rows).toEqual([{ name: "projects" }]);
  });

  it("registers, orders, resolves real paths, suffixes collisions, and removes rows", async () => {
    const root = tempDirs.make("natesclaw-project-roundtrip-");
    const repo = await initializeRepository(root, "natesclaw");
    const alias = path.join(root, "repo-link");
    await fs.symlink(repo, alias, "dir");
    const options = { path: path.join(root, "state.sqlite") };

    const first = await registerProjectRegistry({ path: alias, name: "Natesclaw" }, options);
    const second = await registerProjectRegistry({ path: repo, name: "Natesclaw" }, options);
    expect(first).toMatchObject({
      id: "natesclaw",
      displayName: "Natesclaw",
      repoRoot: repo,
      source: "registered",
    });
    expect(second.id).toBe("natesclaw-2");

    const cfg = {
      agents: {
        list: [
          { id: "main", default: true, workspace: "/workspace/zeta" },
          { id: "work", workspace: "/workspace/alpha" },
        ],
      },
    } as NatesclawConfig;
    expect(listProjectRegistry(cfg, options).map((project) => project.displayName)).toEqual([
      "alpha",
      "Natesclaw",
      "Natesclaw",
      "zeta",
    ]);
    expect(removeProjectRegistry(first.id, options)).toBe(true);
    expect(removeProjectRegistry(first.id, options)).toBe(false);
    expect(listProjectRegistry(cfg, options).map((project) => project.id)).not.toContain(first.id);
  });

  it("rejects paths outside a git checkout", async () => {
    const root = tempDirs.make("natesclaw-project-non-git-");
    await expect(
      registerProjectRegistry({ path: root }, { path: path.join(root, "state.sqlite") }),
    ).rejects.toBeInstanceOf(ProjectCheckoutError);
  });
});
