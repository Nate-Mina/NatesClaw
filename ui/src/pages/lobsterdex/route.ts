import { definePage } from "@natesclaw/uirouter";
import { html } from "lit";
import { routePageSpec } from "../../app-route-paths.ts";

export const page = definePage({
  ...routePageSpec("lobsterdex"),
  component: () =>
    import("./lobsterdex-page.ts").then(() => ({
      header: true,
      render: () => html`<natesclaw-lobsterdex-page></natesclaw-lobsterdex-page>`,
    })),
});
