// Discord plugin module implements approval runtime behavior.
export {
  isChannelExecApprovalClientEnabledFromConfig,
  matchesApprovalRequestFilters,
  getExecApprovalReplyMetadata,
} from "natesclaw/plugin-sdk/approval-client-runtime";
export { resolveApprovalApprovers } from "natesclaw/plugin-sdk/approval-auth-runtime";
export { createApproverRestrictedNativeApprovalCapability } from "natesclaw/plugin-sdk/approval-delivery-runtime";
export {
  createChannelApproverDmTargetResolver,
  createChannelNativeOriginTargetResolver,
} from "natesclaw/plugin-sdk/approval-native-runtime";
