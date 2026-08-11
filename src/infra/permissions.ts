// Exposes cross-platform permission inspection helpers with fs-safe defaults.
import "./fs-safe-defaults.js";

// Permission inspection facades expose fs-safe POSIX and Windows ACL helpers
// after applying Natesclaw's fs-safe defaults.
export {
  formatPermissionDetail,
  formatPermissionRemediation,
  inspectPathPermissions,
  safeStat,
  type PermissionCheck,
  type PermissionCheckOptions,
} from "@natesclaw/fs-safe/permissions";
export {
  createIcaclsResetCommand,
  formatIcaclsResetCommand,
  type PermissionExec as ExecFn,
} from "@natesclaw/fs-safe/advanced";
