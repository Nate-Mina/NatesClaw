import { definePage } from "@natesclaw/uirouter";
import { html } from "lit";
import { routePageSpec } from "../../app-route-paths.ts";

export const page = definePage({
  ...routePageSpec("logs"),
  component: () =>
    import("./logs-page.ts").then(() => ({
      header: true,
      render: () => html`<natesclaw-logs-page></natesclaw-logs-page>`,
    })),
});
