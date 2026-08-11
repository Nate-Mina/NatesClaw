import { html } from "lit";
import { t } from "../i18n/index.ts";
import "./natesclaw-mascot.ts";

export function renderLoadingState() {
  return html`
    <section
      class="lazy-view-state lazy-view-state--loading"
      role="status"
      aria-live="polite"
      aria-label=${t("common.loading")}
    >
      <natesclaw-mascot mood="thinking" .size=${120}></natesclaw-mascot>
    </section>
  `;
}
