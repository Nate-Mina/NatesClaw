// Error output tests cover program-level error display and exit messaging.
import { describe, expect, it } from "vitest";
import { formatCliParseErrorOutput } from "./error-output.js";

describe("formatCliParseErrorOutput", () => {
  it("explains unknown commands with root help and plugin hints", () => {
    const output = formatCliParseErrorOutput("error: unknown command 'wat'\n", {
      argv: ["node", "natesclaw", "wat"],
    });

    expect(output).toBe(
      'Natesclaw does not know the command "wat".\nTry: natesclaw --help\nPlugin command? natesclaw plugins list\nDocs: https://docs.natesclaw.ai/cli\n',
    );
  });

  it("suggests close known commands for unknown commands", () => {
    const output = formatCliParseErrorOutput("error: unknown command 'upate'\n", {
      argv: ["node", "natesclaw", "upate"],
    });

    expect(output).toBe(
      'Natesclaw does not know the command "upate".\nDid you mean this?\n  natesclaw update\nTry: natesclaw --help\nPlugin command? natesclaw plugins list\nDocs: https://docs.natesclaw.ai/cli\n',
    );
  });

  it("suggests explicit aliases for common adjacent terminology", () => {
    const output = formatCliParseErrorOutput("error: unknown command 'upgrade'\n", {
      argv: ["node", "natesclaw", "upgrade"],
    });

    expect(output).toContain("Did you mean this?\n  natesclaw update\n");
  });

  it("preserves active profile context in command suggestions", () => {
    const originalProfile = process.env.NATESCLAW_PROFILE;
    process.env.NATESCLAW_PROFILE = "work";
    try {
      const output = formatCliParseErrorOutput("error: unknown command 'doctr'\n", {
        argv: ["node", "natesclaw", "doctr"],
      });

      expect(output).toContain("Did you mean this?\n  natesclaw --profile work doctor\n");
    } finally {
      if (originalProfile === undefined) {
        delete process.env.NATESCLAW_PROFILE;
      } else {
        process.env.NATESCLAW_PROFILE = originalProfile;
      }
    }
  });

  it("points unknown options at the active command help", () => {
    const output = formatCliParseErrorOutput("error: unknown option '--wat'\n", {
      argv: ["node", "natesclaw", "channels", "status", "--wat"],
    });

    expect(output).toBe(
      'Natesclaw does not recognize option "--wat".\nTry: natesclaw channels status --help\n',
    );
  });

  it("points missing required arguments at command help", () => {
    const output = formatCliParseErrorOutput("error: missing required argument 'name'\n", {
      argv: ["node", "natesclaw", "plugins", "install"],
    });

    expect(output).toBe(
      'Missing required argument "name".\nTry: natesclaw plugins install --help\n',
    );
  });

  it("prefers the parsed Commander path over option-like argv values", () => {
    const output = formatCliParseErrorOutput("error: unknown option '--wat'\n", {
      argv: ["node", "natesclaw", "plugins", "--source", "install", "list", "--wat"],
      commandPath: ["plugins", "list"],
    });

    expect(output).toBe(
      'Natesclaw does not recognize option "--wat".\nTry: natesclaw plugins list --help\n',
    );
  });
});
