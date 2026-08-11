// Applies Natesclaw's default fs-safe runtime configuration.
import { configureFsSafeNative } from "@natesclaw/fs-safe/config";

// Natesclaw does not rely on native helpers for normal filesystem safety. Tests
// and operators can still opt in with fs-safe's documented env override.
const hasModeOverride = Object.keys(process.env).some((key) =>
  /^(?:NATESCLAW_)?FS_SAFE_(?:NATIVE|PYTHON)_MODE$/u.test(
    process.platform === "win32" ? key.toUpperCase() : key,
  ),
);

if (!hasModeOverride) {
  configureFsSafeNative({ mode: "off" });
}
