import { formatErrorMessage } from "@natesclaw/normalization-core";
import { redactToolDetail } from "./browser-redact.ts";

export function formatUiError(error: unknown, fallback = ""): string {
  return formatErrorMessage(error, { redact: redactToolDetail }) || fallback;
}
