import { NatesclawFilePreviewModal } from "./file-preview-modal.ts";

if (!customElements.get("natesclaw-file-preview-modal")) {
  customElements.define("natesclaw-file-preview-modal", NatesclawFilePreviewModal);
}
