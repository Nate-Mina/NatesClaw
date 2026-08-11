import { definePage } from "@natesclaw/uirouter";
import { html } from "lit";
import { routePageSpec } from "../../app-route-paths.ts";

export const page = definePage({
  ...routePageSpec("tasks"),
  component: () =>
    import("./tasks-page.ts").then(() => ({
      header: true,
      render: () => html`<natesclaw-tasks-page></natesclaw-tasks-page>`,
    })),
});
