// Covers supervisor marker files used to identify managed Natesclaw processes.
import { describe, expect, it } from "vitest";
import {
  detectGatewayRespawnSupervisor,
  detectRespawnSupervisor,
  SUPERVISOR_HINT_ENV_VARS,
} from "./supervisor-markers.js";

describe("SUPERVISOR_HINT_ENV_VARS", () => {
  it("includes the cross-platform supervisor hint env vars", () => {
    const envVars = new Set(SUPERVISOR_HINT_ENV_VARS);
    expect(envVars.has("NATESCLAW_SUPERVISOR_MODE")).toBe(true);
    expect(envVars.has("LAUNCH_JOB_LABEL")).toBe(true);
    expect(envVars.has("INVOCATION_ID")).toBe(true);
    expect(envVars.has("NATESCLAW_WINDOWS_TASK_NAME")).toBe(true);
    expect(envVars.has("NATESCLAW_SERVICE_MARKER")).toBe(true);
    expect(envVars.has("NATESCLAW_SERVICE_KIND")).toBe(true);
  });
});

describe("detectRespawnSupervisor", () => {
  it("detects launchd from Natesclaw's explicit marker or current gateway launchd job", () => {
    expect(
      detectRespawnSupervisor({ NATESCLAW_LAUNCHD_LABEL: " ai.natesclaw.gateway " }, "darwin"),
    ).toBe("launchd");
    expect(detectRespawnSupervisor({ NATESCLAW_LAUNCHD_LABEL: "   " }, "darwin")).toBeNull();
    expect(detectRespawnSupervisor({ LAUNCH_JOB_LABEL: "ai.natesclaw.gateway" }, "darwin")).toBe(
      "launchd",
    );
    expect(
      detectRespawnSupervisor(
        { LAUNCH_JOB_NAME: "ai.natesclaw.work", NATESCLAW_PROFILE: "work" },
        "darwin",
      ),
    ).toBe("launchd");
    expect(detectRespawnSupervisor({ LAUNCH_JOB_LABEL: "ai.natesclaw.mac" }, "darwin")).toBeNull();
    expect(detectRespawnSupervisor({ XPC_SERVICE_NAME: "ai.natesclaw.mac" }, "darwin")).toBeNull();
    expect(
      detectRespawnSupervisor(
        { XPC_SERVICE_NAME: "ai.natesclaw.mac", NATESCLAW_PROFILE: "mac" },
        "darwin",
      ),
    ).toBeNull();
    expect(detectRespawnSupervisor({ XPC_SERVICE_NAME: "ai.natesclaw.gateway" }, "darwin")).toBe(
      "launchd",
    );
  });

  it("detects systemd only from non-blank platform-specific hints", () => {
    expect(detectRespawnSupervisor({ INVOCATION_ID: "abc123" }, "linux")).toBe("systemd");
    expect(detectRespawnSupervisor({ JOURNAL_STREAM: "" }, "linux")).toBeNull();
  });

  it("detects Linux Natesclaw gateway service markers only for opt-in callers", () => {
    const gatewayServiceEnv = {
      NATESCLAW_SERVICE_MARKER: " natesclaw ",
      NATESCLAW_SERVICE_KIND: " gateway ",
    };
    expect(detectRespawnSupervisor(gatewayServiceEnv, "linux")).toBeNull();
    expect(
      detectRespawnSupervisor(gatewayServiceEnv, "linux", {
        includeLinuxNatesclawGatewayServiceMarker: true,
      }),
    ).toBe("systemd");
    expect(
      detectRespawnSupervisor(
        {
          NATESCLAW_SERVICE_MARKER: "natesclaw",
          NATESCLAW_SERVICE_KIND: "worker",
        },
        "linux",
        { includeLinuxNatesclawGatewayServiceMarker: true },
      ),
    ).toBeNull();
    expect(
      detectRespawnSupervisor(
        {
          NATESCLAW_SERVICE_MARKER: "other",
          NATESCLAW_SERVICE_KIND: "gateway",
        },
        "linux",
        { includeLinuxNatesclawGatewayServiceMarker: true },
      ),
    ).toBeNull();
  });

  it("detects scheduled-task supervision on Windows from either hint family", () => {
    expect(
      detectRespawnSupervisor({ NATESCLAW_WINDOWS_TASK_NAME: "Natesclaw Gateway" }, "win32"),
    ).toBe("schtasks");
    expect(
      detectRespawnSupervisor(
        {
          NATESCLAW_SERVICE_MARKER: "natesclaw",
          NATESCLAW_SERVICE_KIND: "gateway",
        },
        "win32",
      ),
    ).toBe("schtasks");
    expect(
      detectRespawnSupervisor(
        {
          NATESCLAW_SERVICE_MARKER: "natesclaw",
          NATESCLAW_SERVICE_KIND: "worker",
        },
        "win32",
      ),
    ).toBeNull();
  });

  it("ignores service markers on non-Windows platforms and unknown platforms", () => {
    expect(
      detectRespawnSupervisor(
        {
          NATESCLAW_SERVICE_MARKER: "natesclaw",
          NATESCLAW_SERVICE_KIND: "gateway",
        },
        "linux",
      ),
    ).toBeNull();
    expect(
      detectRespawnSupervisor({ LAUNCH_JOB_LABEL: "ai.natesclaw.gateway" }, "freebsd"),
    ).toBeNull();
  });
});

describe("detectGatewayRespawnSupervisor", () => {
  it("keeps external ownership separate from native supervisor detection", () => {
    const env = {
      NATESCLAW_SUPERVISOR_MODE: "external",
      NATESCLAW_LAUNCHD_LABEL: "ai.natesclaw.gateway",
    };

    expect(detectGatewayRespawnSupervisor(env, "darwin")).toBe("external");
    expect(detectRespawnSupervisor(env, "darwin")).toBe("launchd");
  });
});
