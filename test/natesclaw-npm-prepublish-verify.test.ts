import { describe, expect, it } from "vitest";
import {
  NatesclawNpmPrepublishVerifyUsage,
  parseNatesclawNpmPrepublishVerifyArgs,
  usesPreparedLocalDependencyInstall,
} from "../scripts/natesclaw-npm-prepublish-verify.ts";

describe("parseNatesclawNpmPrepublishVerifyArgs", () => {
  it("supports help, optional versions, and package-manager separators", () => {
    expect(parseNatesclawNpmPrepublishVerifyArgs(["--help"])).toEqual({
      dependencyTarballPaths: [],
      help: true,
      tarballPath: "",
    });
    expect(parseNatesclawNpmPrepublishVerifyArgs(["natesclaw.tgz"])).toEqual({
      dependencyTarballPaths: [],
      help: false,
      tarballPath: "natesclaw.tgz",
    });
    expect(parseNatesclawNpmPrepublishVerifyArgs(["--", "natesclaw.tgz", "2026.3.23"])).toEqual({
      dependencyTarballPaths: [],
      expectedVersion: "2026.3.23",
      help: false,
      tarballPath: "natesclaw.tgz",
    });
  });

  it("rejects missing, option-like, and extra arguments before installing", () => {
    expect(() => parseNatesclawNpmPrepublishVerifyArgs([])).toThrow(
      NatesclawNpmPrepublishVerifyUsage(),
    );
    expect(() => parseNatesclawNpmPrepublishVerifyArgs(["--tag"])).toThrow(
      "Unknown natesclaw npm prepublish verifier option: --tag",
    );
    expect(() => parseNatesclawNpmPrepublishVerifyArgs(["natesclaw.tgz", "--tag"])).toThrow(
      "Unknown natesclaw npm prepublish verifier option: --tag",
    );
    expect(
      parseNatesclawNpmPrepublishVerifyArgs(["natesclaw.tgz", "2026.3.23", "llm-core.tgz", "ai.tgz"]),
    ).toEqual({
      dependencyTarballPaths: ["llm-core.tgz", "ai.tgz"],
      expectedVersion: "2026.3.23",
      help: false,
      tarballPath: "natesclaw.tgz",
    });
    expect(() =>
      parseNatesclawNpmPrepublishVerifyArgs(["natesclaw.tgz", "2026.3.23", "--bad"]),
    ).toThrow("Invalid dependency tarball path: --bad");
  });
});

describe("usesPreparedLocalDependencyInstall", () => {
  it("uses the prepared local project only for the single AI tarball release path", () => {
    expect(usesPreparedLocalDependencyInstall(0)).toBe(false);
    expect(usesPreparedLocalDependencyInstall(1)).toBe(true);
    expect(usesPreparedLocalDependencyInstall(2)).toBe(false);
  });
});
