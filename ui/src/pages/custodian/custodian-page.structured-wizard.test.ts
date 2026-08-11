/* @vitest-environment jsdom */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { waitForFast } from "../../test-helpers/wait-for.ts";
import { createContext, mountPage } from "./custodian-page.test-harness.ts";

describe("custodian structured wizard", () => {
  beforeEach(() => {
    vi.spyOn(crypto, "randomUUID").mockReturnValue("00000000-0000-4000-8000-000000000001");
    window.history.replaceState({}, "", "/");
  });

  afterEach(() => {
    document.body.replaceChildren();
    vi.restoreAllMocks();
  });

  it("keeps a rejected typed answer active without showing a submitted receipt", async () => {
    const step = {
      id: "port",
      type: "text" as const,
      message: "Gateway port",
    };
    const request = vi
      .fn()
      .mockResolvedValueOnce({
        sessionId: "validation-session",
        reply: "Enter a port.",
        action: "none",
        wizardInputPending: true,
        step,
      })
      .mockResolvedValueOnce({
        sessionId: "validation-session",
        reply: "Enter port 18789.",
        action: "none",
        wizardActionAccepted: false,
        wizardInputPending: true,
        step,
      });
    const { context } = createContext(request);
    const { page } = await mountPage(context);

    const input = await waitForFast(() => {
      const element = page.querySelector<HTMLInputElement>(
        '.custodian__wizard-step input[name="wizard-text"]',
      );
      expect(element).not.toBeNull();
      return element!;
    });
    input.value = "banana";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await page.updateComplete;
    page.querySelector<HTMLButtonElement>(".custodian__wizard-step .btn.primary")!.click();

    await waitForFast(() => expect(page.textContent).toContain("Enter port 18789."));
    expect(request.mock.calls[1]?.[1]).toMatchObject({
      wizardAnswer: { stepId: "port", value: "banana" },
    });
    expect(page.querySelector(".custodian__structured-response")).toBeNull();
    expect(page.querySelector(".custodian__wizard-step")).not.toBeNull();
    expect(page.querySelector(".chat-group.user")).toBeNull();
  });

  it("keeps Slack guidance visible in one typed card and formats its manifest", async () => {
    const manifest = JSON.stringify(
      {
        display_information: {
          name: "OpenClaw",
          description: "OpenClaw connector for OpenClaw",
        },
      },
      null,
      2,
    );
    const question = "How do you want to provide this Slack bot token?";
    const request = vi.fn().mockResolvedValue({
      sessionId: "slack-wizard-session",
      reply: [
        [
          "**Slack socket mode tokens**",
          "1) Create the Slack app from the manifest below",
          "2) Enable Socket Mode",
        ].join("\n"),
        manifest,
        [
          question,
          "1. Enter Slack bot token — Stores the credential directly in OpenClaw config",
          "2. Use external secret provider — Stores a reference to an external provider",
          "Reply with a number.",
          "Say `cancel` to stop this setup.",
        ].join("\n"),
      ].join("\n\n"),
      action: "none",
      wizardInputPending: true,
      step: {
        id: "slack-token-source",
        type: "select",
        message: question,
        options: [
          {
            label: "Enter Slack bot token",
            value: "direct",
            hint: "Stores the credential directly in OpenClaw config",
          },
          {
            label: "Use external secret provider",
            value: "secret-ref",
            hint: "Stores a reference to an external provider",
          },
        ],
      },
    });
    const { context } = createContext(request);
    const { page } = await mountPage(context);

    await waitForFast(() =>
      expect(page.querySelector(".custodian__wizard-guidance")).not.toBeNull(),
    );
    expect(page.querySelector(".chat-group.assistant")).toBeNull();
    expect(page.querySelector("details")).toBeNull();
    expect(page.querySelector(".custodian__wizard-guidance ol")).not.toBeNull();
    expect(page.querySelector(".custodian__wizard-guidance .code-block-wrapper")).not.toBeNull();
    const copyButton = page.querySelector<HTMLButtonElement>(
      ".custodian__wizard-guidance .code-block-copy",
    );
    expect(copyButton).not.toBeNull();
    copyButton?.click();
    await waitForFast(() => expect(copyButton?.getAttribute("aria-label")).not.toBe("Copy code"));
    expect(page.querySelector(".custodian__wizard-guidance")?.textContent).toContain(
      "Slack socket mode tokens",
    );
    expect((page.textContent ?? "").split(question)).toHaveLength(2);
    expect(page.textContent).not.toContain("Reply with a number");
    expect(page.textContent).not.toContain("Say cancel");
  });
});
