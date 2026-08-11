import { definePage } from "@natesclaw/uirouter";
import { html } from "lit";
import { routePageSpec } from "../../app-route-paths.ts";

export const page = definePage({
  ...routePageSpec("debug"),
  component: () =>
    import("./debug-page.ts").then(() => ({
      header: true,
      render: () => html`<natesclaw-debug-page></natesclaw-debug-page>`,
    })),
});
