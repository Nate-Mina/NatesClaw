// Daemon runtime hint tests cover platform-specific daemon guidance.
import { describe, expect, it } from "vitest";
import { buildPlatformRuntimeLogHints, buildPlatformServiceStartHints } from "./runtime-hints.js";

describe("buildPlatformRuntimeLogHints", () => {
  it("renders launchd log hints on darwin", () => {
    expect(
      buildPlatformRuntimeLogHints({
        platform: "darwin",
        env: {
          HOME: "/Users/test",
          NATESCLAW_STATE_DIR: "/tmp/natesclaw-state",
          NATESCLAW_LOG_PREFIX: "gateway",
        },
        systemdServiceName: "natesclaw-gateway",
        windowsTaskName: "Natesclaw Gateway",
      }),
    ).toEqual([
      "Launchd stdout (if installed): /Users/test/Library/Logs/natesclaw/gateway.log",
      "Launchd stderr (if installed): suppressed",
      "Restart attempts: /tmp/natesclaw-state/logs/gateway-restart.log",
    ]);
  });

  it("renders systemd and windows hints by platform", () => {
    expect(
      buildPlatformRuntimeLogHints({
        platform: "linux",
        env: {
          NATESCLAW_STATE_DIR: "/tmp/natesclaw-state",
        },
        systemdServiceName: "natesclaw-gateway",
        windowsTaskName: "Natesclaw Gateway",
      }),
    ).toEqual([
      "Logs: journalctl --user -u natesclaw-gateway.service -n 200 --no-pager",
      "Restart attempts: /tmp/natesclaw-state/logs/gateway-restart.log",
    ]);
    expect(
      buildPlatformRuntimeLogHints({
        platform: "win32",
        env: {
          NATESCLAW_STATE_DIR: "/tmp/natesclaw-state",
        },
        systemdServiceName: "natesclaw-gateway",
        windowsTaskName: "Natesclaw Gateway",
      }),
    ).toEqual([
      'Logs: schtasks /Query /TN "Natesclaw Gateway" /V /FO LIST',
      "Restart attempts: /tmp/natesclaw-state/logs/gateway-restart.log",
    ]);
  });
});

describe("buildPlatformServiceStartHints", () => {
  it("builds platform-specific service start hints", () => {
    expect(
      buildPlatformServiceStartHints({
        platform: "darwin",
        installCommand: "natesclaw gateway install",
        startCommand: "natesclaw gateway",
        launchAgentPlistPath: "~/Library/LaunchAgents/com.natesclaw.gateway.plist",
        systemdServiceName: "natesclaw-gateway",
        windowsTaskName: "Natesclaw Gateway",
      }),
    ).toEqual([
      "natesclaw gateway install",
      "natesclaw gateway",
      "launchctl bootstrap gui/$UID ~/Library/LaunchAgents/com.natesclaw.gateway.plist",
    ]);
    expect(
      buildPlatformServiceStartHints({
        platform: "linux",
        installCommand: "natesclaw gateway install",
        startCommand: "natesclaw gateway",
        launchAgentPlistPath: "~/Library/LaunchAgents/com.natesclaw.gateway.plist",
        systemdServiceName: "natesclaw-gateway",
        windowsTaskName: "Natesclaw Gateway",
      }),
    ).toEqual([
      "natesclaw gateway install",
      "natesclaw gateway",
      "systemctl --user start natesclaw-gateway.service",
    ]);
  });
});
