// Device Pair API module exposes the plugin public contract.
export {
  approveDevicePairing,
  clearDeviceBootstrapTokens,
  issueDeviceBootstrapToken,
  PAIRING_SETUP_BOOTSTRAP_PROFILE,
  listDevicePairing,
  revokeDeviceBootstrapToken,
  type DeviceBootstrapProfile,
} from "natesclaw/plugin-sdk/device-bootstrap";
export { definePluginEntry, type NatesclawPluginApi } from "natesclaw/plugin-sdk/plugin-entry";
export {
  resolveGatewayBindUrl,
  resolveGatewayPort,
  resolveTailnetHostWithRunner,
  resolveTailscaleServeGatewayUrlsWithRunner,
} from "natesclaw/plugin-sdk/core";
export { resolveAdvertisedLanHost } from "natesclaw/plugin-sdk/gateway-runtime";
export {
  resolvePreferredNatesclawTmpDir,
  runPluginCommandWithTimeout,
} from "natesclaw/plugin-sdk/sandbox";
export { renderQrPngBase64, renderQrPngDataUrl, writeQrPngTempFile } from "./qr-image.js";
