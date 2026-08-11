// Channel action schemas describe plugin-declared actions available through channel UIs.

import { QR_PNG_DATA_URL_MAX_LENGTH } from "../../packages/gateway-protocol/src/schema/qr.js";
import { renderQrPngDataUrlWithinLimit } from "../media/qr-image.js";

export { QrPngDataUrlSchema } from "../../packages/gateway-protocol/src/schema/qr.js";

/** Render QR text into the bounded PNG contract accepted by Gateway presentation steps. */
export async function renderGatewayQrPngDataUrl(input: string): Promise<string> {
  return await renderQrPngDataUrlWithinLimit(input, QR_PNG_DATA_URL_MAX_LENGTH);
}
export {
  createUnionActionGate,
  listTokenSourcedAccounts,
} from "../channels/plugins/actions/shared.js";
export { resolveReactionMessageId } from "../channels/plugins/actions/reaction-message-id.js";
export {
  createActionGate,
  imageResultFromFile,
  jsonResult,
  readNonNegativeIntegerParam,
  parseAvailableTags,
  readNumberParam,
  readPositiveIntegerParam,
  readReactionParams,
  readStringArrayParam,
  readStringOrNumberParam,
  readToolStringParam as readStringParam,
  ToolAuthorizationError,
} from "../agents/tools/common.js";
export type { ActionGate } from "../agents/tools/common.js";
export { withNormalizedTimestamp } from "../agents/date-time.js";
export { assertMediaNotDataUrl } from "../agents/sandbox-paths.js";
export { resolvePollMaxSelections } from "../polls.js";
export {
  optionalFiniteNumberSchema,
  optionalNonNegativeIntegerSchema,
  optionalPositiveIntegerSchema,
  optionalStringEnum,
  stringEnum,
} from "../agents/schema/typebox.js";
