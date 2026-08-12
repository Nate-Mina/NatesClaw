import { definePage } from "@openclaw/uirouter";
import { html } from "lit";
import { routePageSpec } from "../../app-route-paths.ts";

export const page = definePage({
  ...routePageSpec("memory-import"),
  component: () =>
    import("./memory-import-page.ts").then(() => ({
      header: true,
      render: () => html`<natesclaw-memory-import-page></natesclaw-memory-import-page>`,
    })),
});
