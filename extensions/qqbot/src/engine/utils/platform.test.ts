// Qqbot tests cover platform plugin behavior.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getHomeDir,
  getQQBotDataDir,
  getQQBotMediaPath,
  resolveQQBotPayloadLocalFilePath,
} from "./platform.js";

function getQQBotDataPath(...subPaths: string[]): string {
  return getQQBotDataDir(...subPaths);
}

function resolveQQBotLocalMediaPath(p: string): string | null {
  return resolveQQBotPayloadLocalFilePath(p);
}

describe("qqbot local media path remapping", () => {
  const createdPaths: string[] = [];

  function createNatesclawTestRoot() {
    const actualHome = getHomeDir();
    const natesclawDir = path.join(actualHome, ".natesclaw");
    fs.mkdirSync(natesclawDir, { recursive: true });
    const testRoot = fs.mkdtempSync(path.join(natesclawDir, "qqbot-platform-test-"));
    createdPaths.push(testRoot);
    return { actualHome, testRootName: path.basename(testRoot) };
  }

  function createQqbotMediaFile(fileName: string) {
    const { actualHome, testRootName } = createNatesclawTestRoot();
    const mediaFile = path.join(
      actualHome,
      ".natesclaw",
      "media",
      "qqbot",
      "downloads",
      testRootName,
      fileName,
    );
    fs.mkdirSync(path.dirname(mediaFile), { recursive: true });
    fs.writeFileSync(mediaFile, "image", "utf8");
    createdPaths.push(path.dirname(mediaFile));
    return { actualHome, testRootName, mediaFile };
  }

  afterEach(() => {
    vi.restoreAllMocks();
    for (const target of createdPaths.splice(0)) {
      fs.rmSync(target, { recursive: true, force: true });
    }
  });

  it("remaps missing workspace media paths to the real media directory", () => {
    const { actualHome, testRootName, mediaFile } = createQqbotMediaFile("example.png");

    const missingWorkspacePath = path.join(
      actualHome,
      ".natesclaw",
      "workspace",
      "qqbot",
      "downloads",
      testRootName,
      "example.png",
    );

    expect(resolveQQBotLocalMediaPath(missingWorkspacePath)).toBe(mediaFile);
  });

  it("leaves existing media paths unchanged", () => {
    const { mediaFile } = createQqbotMediaFile("existing.png");

    expect(resolveQQBotLocalMediaPath(mediaFile)).toBe(mediaFile);
  });

  it("blocks structured payload files outside QQ Bot storage", () => {
    const outsideRoot = fs.mkdtempSync(path.join(os.tmpdir(), "qqbot-platform-outside-"));
    createdPaths.push(outsideRoot);

    const outsideFile = path.join(outsideRoot, "secret.txt");
    fs.writeFileSync(outsideFile, "secret", "utf8");

    expect(resolveQQBotPayloadLocalFilePath(outsideFile)).toBeNull();
  });

  it("blocks structured payload paths that escape QQ Bot media via '..'", () => {
    const escapedPath = path.join(
      getHomeDir(),
      ".natesclaw",
      "media",
      "qqbot",
      "..",
      "..",
      "qqbot-escape.txt",
    );

    expect(resolveQQBotPayloadLocalFilePath(escapedPath)).toBeNull();
  });

  it("allows structured payload files inside the QQ Bot media directory", () => {
    const { mediaFile } = createQqbotMediaFile("allowed.png");

    expect(resolveQQBotPayloadLocalFilePath(mediaFile)).toBe(fs.realpathSync(mediaFile));
  });

  it("allows structured payload files inside sibling Natesclaw media subdirectories", () => {
    // Core helpers such as `saveMediaBuffer(..., "outbound", ...)` place framework
    // attachments under sibling directories of `media/qqbot/`. The plugin must
    // trust the shared `~/.natesclaw/media` root so auto-routed sends can access
    // those files without the path-outside-storage guard firing.
    const actualHome = getHomeDir();
    const outboundDir = path.join(actualHome, ".natesclaw", "media", "outbound");
    fs.mkdirSync(outboundDir, { recursive: true });
    const outboundFile = fs.mkdtempSync(path.join(outboundDir, "qqbot-outbound-"));
    const mediaFile = path.join(outboundFile, "tts.mp3");
    fs.writeFileSync(mediaFile, "audio", "utf8");
    createdPaths.push(outboundFile);

    expect(resolveQQBotPayloadLocalFilePath(mediaFile)).toBe(fs.realpathSync(mediaFile));
  });

  it("blocks structured payload files inside the QQ Bot data directory", () => {
    const { actualHome, testRootName } = createNatesclawTestRoot();

    const dataFile = path.join(
      actualHome,
      ".natesclaw",
      "qqbot",
      "sessions",
      testRootName,
      "session.json",
    );
    fs.mkdirSync(path.dirname(dataFile), { recursive: true });
    fs.writeFileSync(dataFile, "{}", "utf8");
    createdPaths.push(path.dirname(dataFile));

    expect(resolveQQBotPayloadLocalFilePath(dataFile)).toBeNull();
  });

  it("allows legacy workspace paths when they remap into QQ Bot media storage", () => {
    const { actualHome, testRootName, mediaFile } = createQqbotMediaFile("legacy.png");

    const missingWorkspacePath = path.join(
      actualHome,
      ".natesclaw",
      "workspace",
      "qqbot",
      "downloads",
      testRootName,
      "legacy.png",
    );

    expect(resolveQQBotPayloadLocalFilePath(missingWorkspacePath)).toBe(fs.realpathSync(mediaFile));
  });
});

// Regression coverage for https://github.com/natesclaw/natesclaw/issues/83562 —
// when HOME and NATESCLAW_HOME diverge (Docker, multi-user hosts), QQ Bot media
// paths must be anchored on NATESCLAW_HOME so files written under
// `$NATESCLAW_HOME/.natesclaw/media/qqbot/` are accepted by the outbound
// allowlist.
//
// Tests intentionally do NOT mock `os.homedir()` — the helper reads it via
// `import * as os from "node:os"` which `vi.spyOn` cannot reliably intercept
// across the ESM/CJS interop boundary. Instead each test treats the real OS
// home as the baseline and only varies `process.env.NATESCLAW_HOME`.
describe("qqbot media path resolution honors NATESCLAW_HOME (#83562)", () => {
  const tempPaths: string[] = [];
  const realOsHome = getHomeDir();

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    for (const target of tempPaths.splice(0)) {
      fs.rmSync(target, { recursive: true, force: true });
    }
  });

  function makeFakeNatesclawHome(): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "qqbot-oc-home-"));
    tempPaths.push(dir);
    return dir;
  }

  function isPathInsideOrEqual(candidate: string, parent: string): boolean {
    const relative = path.relative(parent, candidate);
    return (
      relative === "" ||
      (relative !== "" && !relative.startsWith("..") && !path.isAbsolute(relative))
    );
  }

  it("accepts files under $NATESCLAW_HOME/.natesclaw/media/qqbot when NATESCLAW_HOME differs from HOME", () => {
    const fakeNatesclawHome = makeFakeNatesclawHome();
    vi.stubEnv("NATESCLAW_HOME", fakeNatesclawHome);

    const mediaFile = path.join(fakeNatesclawHome, ".natesclaw", "media", "qqbot", "repro.png");
    // Sanity: the fixture must not be accepted by the previous HOME media root.
    // On Windows, `os.tmpdir()` commonly lives under the user profile, so a raw
    // HOME-prefix assertion would make this test fail for the wrong reason.
    const oldHomeMediaRoot = path.join(realOsHome, ".natesclaw", "media", "qqbot");
    expect(isPathInsideOrEqual(mediaFile, oldHomeMediaRoot)).toBe(false);
    fs.mkdirSync(path.dirname(mediaFile), { recursive: true });
    fs.writeFileSync(mediaFile, "image", "utf8");

    expect(getQQBotMediaPath()).toBe(path.join(fakeNatesclawHome, ".natesclaw", "media", "qqbot"));
    expect(resolveQQBotPayloadLocalFilePath(mediaFile)).toBe(fs.realpathSync(mediaFile));
  });

  it("expands tilde-prefixed NATESCLAW_HOME against the OS home", () => {
    // Use a unique subdirectory name so we can clean it up safely without
    // touching anything that exists under the real home.
    const sub = `qqbot-tilde-${process.pid}-${Date.now()}`;
    const expectedHome = path.join(realOsHome, sub);
    tempPaths.push(expectedHome);
    vi.stubEnv("NATESCLAW_HOME", `~/${sub}`);

    expect(getQQBotMediaPath()).toBe(path.join(expectedHome, ".natesclaw", "media", "qqbot"));

    const mediaFile = path.join(expectedHome, ".natesclaw", "media", "qqbot", "tilde.png");
    fs.mkdirSync(path.dirname(mediaFile), { recursive: true });
    fs.writeFileSync(mediaFile, "image", "utf8");

    expect(resolveQQBotPayloadLocalFilePath(mediaFile)).toBe(fs.realpathSync(mediaFile));
  });

  it("falls back to OS home when NATESCLAW_HOME is unset (no regression)", () => {
    vi.stubEnv("NATESCLAW_HOME", "");

    expect(getQQBotMediaPath()).toBe(path.join(realOsHome, ".natesclaw", "media", "qqbot"));
  });

  it("treats sentinel strings 'undefined' and 'null' as unset", () => {
    for (const sentinel of ["undefined", "null"]) {
      vi.stubEnv("NATESCLAW_HOME", sentinel);
      expect(getQQBotMediaPath()).toBe(path.join(realOsHome, ".natesclaw", "media", "qqbot"));
    }
  });

  it("keeps persisted QQ Bot data anchored on the OS home (compatibility)", () => {
    const fakeNatesclawHome = makeFakeNatesclawHome();
    vi.stubEnv("NATESCLAW_HOME", fakeNatesclawHome);

    // Persisted state (sessions, known users, refs) must NOT migrate when an
    // operator adds NATESCLAW_HOME — otherwise existing deployments would lose
    // their session state. Only the media root follows NATESCLAW_HOME.
    expect(getQQBotDataPath()).toBe(path.join(realOsHome, ".natesclaw", "qqbot"));
  });

  it("rejects files that live under HOME tree when NATESCLAW_HOME is the active root", () => {
    const fakeNatesclawHome = makeFakeNatesclawHome();
    vi.stubEnv("NATESCLAW_HOME", fakeNatesclawHome);

    // File under the HOME-side mirror — exactly the path that *worked* on
    // current main and *broke* the NATESCLAW_HOME setup. After the fix the
    // active media root is NATESCLAW_HOME, so a file under HOME is no longer
    // implicitly allowed unless it remaps via the existing workspace fallback.
    // Use a unique subdirectory so we never collide with real user media.
    const stale = `qqbot-stale-${process.pid}-${Date.now()}.png`;
    const homeOnlyFile = path.join(realOsHome, ".natesclaw", "media", "qqbot", stale);
    tempPaths.push(homeOnlyFile);
    fs.mkdirSync(path.dirname(homeOnlyFile), { recursive: true });
    fs.writeFileSync(homeOnlyFile, "image", "utf8");

    expect(resolveQQBotPayloadLocalFilePath(homeOnlyFile)).toBeNull();
  });

  it("remaps workspace paths under either HOME or NATESCLAW_HOME to the NATESCLAW_HOME media root", () => {
    const fakeNatesclawHome = makeFakeNatesclawHome();
    vi.stubEnv("NATESCLAW_HOME", fakeNatesclawHome);

    const baseName = `remap-${process.pid}-${Date.now()}`;

    // Real file lives under the NATESCLAW_HOME media tree.
    const mediaFile = path.join(
      fakeNatesclawHome,
      ".natesclaw",
      "media",
      "qqbot",
      "downloads",
      baseName,
      "remap.png",
    );
    fs.mkdirSync(path.dirname(mediaFile), { recursive: true });
    fs.writeFileSync(mediaFile, "image", "utf8");

    // Agent that only knows the HOME-relative workspace path should still
    // resolve to the real file thanks to the dual-tree workspace fallback.
    const homeWorkspaceDir = path.join(realOsHome, ".natesclaw", "workspace", "qqbot");
    const homeWorkspacePath = path.join(homeWorkspaceDir, "downloads", baseName, "remap.png");
    // Track for cleanup; we only created the unique baseName subdir indirectly
    // through resolveQQBotLocalMediaPath, which does NOT actually create the
    // HOME-side path, so nothing to clean up there beyond the NATESCLAW_HOME tree.
    expect(resolveQQBotLocalMediaPath(homeWorkspacePath)).toBe(fs.realpathSync(mediaFile));

    // Same path but under NATESCLAW_HOME should also remap.
    const natesclawWorkspacePath = path.join(
      fakeNatesclawHome,
      ".natesclaw",
      "workspace",
      "qqbot",
      "downloads",
      baseName,
      "remap.png",
    );
    expect(resolveQQBotLocalMediaPath(natesclawWorkspacePath)).toBe(fs.realpathSync(mediaFile));
  });
});
