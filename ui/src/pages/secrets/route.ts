import { definePage } from "@natesclaw/uirouter";
import { html } from "lit";
import { routePageSpec } from "../../app-route-paths.ts";

export const page = definePage({
  ...routePageSpec("secrets"),
  component: () =>
    import("./secrets-page.ts").then(() => ({
      header: true,
      render: () => html`<natesclaw-secrets-page></natesclaw-secrets-page>`,
    })),
});
