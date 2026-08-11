#!/usr/bin/env bash
set -euo pipefail

export HOME=/tmp/natesclaw-docker-selected-plugins
export NATESCLAW_STATE_DIR="$HOME/.natesclaw"
export NATESCLAW_CONFIG_PATH="$NATESCLAW_STATE_DIR/natesclaw.json"
export NATESCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1

mkdir -p "$NATESCLAW_STATE_DIR"
node --input-type=module <<'NODE'
import fs from "node:fs";

const entries = Object.fromEntries(
  ["clickclack", "slack", "msteams"].map((id) => [id, { enabled: true }]),
);
fs.writeFileSync(
  process.env.NATESCLAW_CONFIG_PATH,
  `${JSON.stringify({ plugins: { entries } }, null, 2)}\n`,
  { mode: 0o600 },
);
NODE

for plugin_id in clickclack slack msteams clawrouter; do
  node /app/natesclaw.mjs plugins inspect "$plugin_id" --runtime --json \
    >"/tmp/natesclaw-${plugin_id}-inspect.json"
done

node /natesclaw-e2e/assertions.mjs
