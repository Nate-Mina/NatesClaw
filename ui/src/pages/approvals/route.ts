import { definePage } from "@natesclaw/uirouter";
import { html } from "lit";
import { routePageSpec } from "../../app-route-paths.ts";

export const page = definePage({
  ...routePageSpec("approvals"),
  component: () =>
    import("./approvals-page.ts").then(() => ({
      header: true,
      render: () => html`<natesclaw-approvals-page></natesclaw-approvals-page>`,
    })),
});
