#!/usr/bin/env bash
# Runs a mocked OpenAI image-generation auth smoke inside Docker against the
# package-installed functional E2E image.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
source "$ROOT_DIR/scripts/lib/docker-e2e-image.sh"

IMAGE_NAME="$(docker_e2e_resolve_image "natesclaw-openai-image-auth-e2e" NATESCLAW_OPENAI_IMAGE_AUTH_E2E_IMAGE)"
SKIP_BUILD="${NATESCLAW_OPENAI_IMAGE_AUTH_E2E_SKIP_BUILD:-0}"

docker_e2e_build_or_reuse "$IMAGE_NAME" openai-image-auth "$ROOT_DIR/scripts/e2e/Dockerfile" "$ROOT_DIR" "" "$SKIP_BUILD"
NATESCLAW_TEST_STATE_SCRIPT_B64="$(docker_e2e_test_state_shell_b64 openai-image-auth empty)"

echo "Running OpenAI image auth Docker E2E..."
# Harness files are mounted read-only; the app under test comes from /app/dist.
docker_e2e_run_logged_with_harness openai-image-auth \
  -e "OPENAI_API_KEY=sk-natesclaw-image-auth-e2e" \
  -e "NATESCLAW_QA_ALLOW_LOCAL_IMAGE_PROVIDER=1" \
  -e "NATESCLAW_TEST_STATE_SCRIPT_B64=$NATESCLAW_TEST_STATE_SCRIPT_B64" \
  -i "$IMAGE_NAME" bash -lc '
set -euo pipefail
source scripts/lib/natesclaw-e2e-instance.sh
natesclaw_e2e_eval_test_state_from_b64 "${NATESCLAW_TEST_STATE_SCRIPT_B64:?missing NATESCLAW_TEST_STATE_SCRIPT_B64}"
export NATESCLAW_SKIP_CHANNELS=1
export NATESCLAW_SKIP_GMAIL_WATCHER=1
export NATESCLAW_SKIP_CRON=1
export NATESCLAW_SKIP_CANVAS_HOST=1

tsx test/e2e/qa-lab/runtime/openai-image-auth-docker-client.ts
'
