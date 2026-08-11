#!/usr/bin/env bash
# Proves hosted npm installation plus dedicated-prefix source installation.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
source "$ROOT_DIR/scripts/lib/docker-e2e-image.sh"

IMAGE_NAME="$(docker_e2e_resolve_image "natesclaw-cli-installer-distribution:local")"
PACKAGE_TGZ="$(
  docker_e2e_prepare_package_tgz cli-installer-distribution "${NATESCLAW_CURRENT_PACKAGE_TGZ:-}"
)"
HOSTED_PROOF_CONTAINER="natesclaw-hosted-installer-proof-$$"
SOURCE_PROOF_CONTAINER="natesclaw-source-installer-proof-$$"
SOURCE_BUNDLE="$(mktemp "${TMPDIR:-/tmp}/natesclaw-source.XXXXXX.bundle")"
SOURCE_PROOF_SCRIPT="$(mktemp "${TMPDIR:-/tmp}/natesclaw-source-proof.XXXXXX.sh")"
SOURCE_SHA="$(git -C "$ROOT_DIR" rev-parse HEAD)"
SOURCE_MEMORY="${NATESCLAW_CLI_INSTALLER_SOURCE_MEMORY:-16g}"

cleanup() {
  docker_e2e_docker_cmd rm -f \
    "$HOSTED_PROOF_CONTAINER" \
    "$SOURCE_PROOF_CONTAINER" >/dev/null 2>&1 || true
  docker_e2e_cleanup_package_tgz "$PACKAGE_TGZ"
  rm -f "$SOURCE_BUNDLE" "$SOURCE_PROOF_SCRIPT"
}
trap cleanup EXIT

git -C "$ROOT_DIR" bundle create "$SOURCE_BUNDLE" HEAD
cat >"$SOURCE_PROOF_SCRIPT" <<'SOURCE_PROOF'
#!/usr/bin/env bash
set -euo pipefail

test -r "$0"
test -x "$0"
command -v curl >/dev/null
git clone -q /tmp/natesclaw-source.bundle /tmp/natesclaw-source
git -C /tmp/natesclaw-source checkout -q --detach "$NATESCLAW_SOURCE_SHA"
bash /tmp/natesclaw-source/scripts/install-cli.sh \
  --install-method git \
  --git-dir /tmp/natesclaw-source \
  --version "$NATESCLAW_SOURCE_SHA" \
  --no-git-update \
  --prefix /tmp/natesclaw-prefix \
  --node-version 24.15.0 \
  --no-onboard

prefix_node=/tmp/natesclaw-prefix/tools/node/bin/node
prefix_cli=/tmp/natesclaw-prefix/bin/natesclaw
test -x "$prefix_node"
test -x "$prefix_cli"
grep -Fq "exec \"$prefix_node\"" "$prefix_cli"
grep -Fq "/tmp/natesclaw-source/dist/entry.js" "$prefix_cli"
export PATH="/tmp/natesclaw-prefix/bin:$PATH"
test "$(command -v natesclaw)" = "$prefix_cli"
test "$(git -C /tmp/natesclaw-source rev-parse HEAD)" = "$NATESCLAW_SOURCE_SHA"
natesclaw_version="$(natesclaw --version)"
natesclaw --help >/tmp/natesclaw-help
test -s /tmp/natesclaw-help
status_json="$(natesclaw update status --json)"
STATUS_JSON="$status_json" node -e "
  const status = JSON.parse(process.env.STATUS_JSON);
  if (status.update?.installKind !== \"git\") {
    throw new Error(\`expected git install kind, got \${status.update?.installKind}\`);
  }
"
printf "prefixNode=%s@%s\n" "$prefix_node" "$("$prefix_node" --version)"
printf "prefixNatesclaw=%s@%s\n" "$prefix_cli" "$natesclaw_version"
printf "sourceHead=%s installKind=git\n" "$NATESCLAW_SOURCE_SHA"
printf "sourceOnboard=disabled\n"
touch /tmp/natesclaw-proof-ready
exec sleep infinity
SOURCE_PROOF
chmod 0555 "$SOURCE_PROOF_SCRIPT"

docker_e2e_build_or_reuse \
  "$IMAGE_NAME" \
  cli-installer-distribution \
  "$ROOT_DIR/scripts/e2e/Dockerfile" \
  "$ROOT_DIR" \
  bare

echo "==> Hosted install.sh exact-candidate proof"
docker_e2e_docker_run_cmd run -d \
  --name "$HOSTED_PROOF_CONTAINER" \
  -e HOME=/tmp/natesclaw-hosted-home \
  -e NATESCLAW_NO_ONBOARD=1 \
  -e NATESCLAW_NO_PROMPT=1 \
  -v "$PACKAGE_TGZ:/tmp/natesclaw-current.tgz:ro" \
  -v "$ROOT_DIR/scripts/install.sh:/tmp/install.sh:ro" \
  "$IMAGE_NAME" \
  bash -lc '
    set -euo pipefail
    mkdir -p "$HOME"
    bash /tmp/install.sh \
      --install-method npm \
      --version file:/tmp/natesclaw-current.tgz \
      --no-onboard \
      --no-prompt
    source "$HOME/.bashrc"
    hash -r
    natesclaw_path="$(command -v natesclaw)"
    test -n "$natesclaw_path"
    node_path="$(command -v node)"
    node_version="$(node --version)"
    natesclaw_version="$(natesclaw --version)"
    natesclaw --help >/tmp/natesclaw-help
    test -s /tmp/natesclaw-help
    printf "hostedNode=%s@%s\n" "$node_path" "$node_version"
    printf "hostedNatesclaw=%s@%s\n" "$natesclaw_path" "$natesclaw_version"
    printf "hostedOnboard=disabled\n"
    touch /tmp/natesclaw-proof-ready
    exec sleep infinity
  ' >/dev/null

# A full source install builds every workspace package; the shared 8g cap OOMs before wrapper creation.
echo "==> install-cli.sh dedicated-prefix source-checkout proof"
docker_e2e_docker_run_cmd run -d \
  --name "$SOURCE_PROOF_CONTAINER" \
  --memory "$SOURCE_MEMORY" \
  -e HOME=/tmp/natesclaw-source-home \
  -e NATESCLAW_NO_ONBOARD=1 \
  -e NATESCLAW_NO_PROMPT=1 \
  -e COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
  -e "NATESCLAW_SOURCE_SHA=$SOURCE_SHA" \
  --user root \
  -v "$SOURCE_BUNDLE:/tmp/natesclaw-source.bundle:ro" \
  -v "$SOURCE_PROOF_SCRIPT:/tmp/source-proof.sh:ro" \
  "$IMAGE_NAME" \
  bash -lc '
    set -euo pipefail
    apt-get update
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends curl
    rm -rf /var/lib/apt/lists/*
    command -v curl >/dev/null
    install -d -o appuser -g appuser "$HOME"
    exec runuser -u appuser -- env \
      HOME="$HOME" \
      NATESCLAW_NO_ONBOARD="$NATESCLAW_NO_ONBOARD" \
      NATESCLAW_NO_PROMPT="$NATESCLAW_NO_PROMPT" \
      COREPACK_ENABLE_DOWNLOAD_PROMPT="$COREPACK_ENABLE_DOWNLOAD_PROMPT" \
      NATESCLAW_SOURCE_SHA="$NATESCLAW_SOURCE_SHA" \
      bash /tmp/source-proof.sh
  ' >/dev/null

wait_for_proof() {
  local container_name="$1"
  for _ in $(seq 1 1200); do
    if docker exec "$container_name" test -f /tmp/natesclaw-proof-ready; then
      docker logs "$container_name"
      return 0
    fi
    if [ "$(docker inspect --format '{{.State.Running}}' "$container_name")" != "true" ]; then
      docker logs "$container_name" >&2
      return 1
    fi
    sleep 1
  done
  docker logs "$container_name" >&2
  return 1
}

wait_for_proof "$HOSTED_PROOF_CONTAINER"
wait_for_proof "$SOURCE_PROOF_CONTAINER"
echo "CLI installer distribution proof passed."
