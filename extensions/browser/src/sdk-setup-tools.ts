/**
 * Browser-local SDK setup/tooling bridge for CLI, media, and action helpers.
 */
export {
  callGatewayTool,
  listNodes,
  resolveNodeIdFromList,
} from "natesclaw/plugin-sdk/agent-harness-runtime";
export type { AnyAgentTool } from "natesclaw/plugin-sdk/agent-harness-runtime";
export {
  imageResultFromFile,
  jsonResult,
  readPositiveIntegerParam,
  readStringParam,
} from "natesclaw/plugin-sdk/channel-actions";
export {
  formatCliCommand,
  formatHelpExamples,
  inheritOptionFromParent,
  note,
  theme,
} from "natesclaw/plugin-sdk/cli-runtime";
export { danger, info } from "natesclaw/plugin-sdk/runtime-env";
export {
  IMAGE_REDUCE_QUALITY_STEPS,
  buildImageResizeSideGrid,
  getImageMetadata,
  isImageProcessorUnavailableError,
  resizeToJpeg,
} from "natesclaw/plugin-sdk/media-runtime";
export { detectMime } from "natesclaw/plugin-sdk/media-mime";
export { ensureMediaDir, saveMediaBuffer } from "natesclaw/plugin-sdk/media-runtime";
export { describeImageFile } from "natesclaw/plugin-sdk/media-understanding-runtime";
export { formatDocsLink } from "natesclaw/plugin-sdk/setup-tools";
