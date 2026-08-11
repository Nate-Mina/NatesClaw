#!/usr/bin/env bash
# Installs an Natesclaw package candidate in Docker, performs Telegram
# onboarding/doctor recovery, then runs the Telegram QA live harness.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
source "$ROOT_DIR/scripts/lib/docker-e2e-image.sh"

IMAGE_NAME="$(docker_e2e_resolve_image "natesclaw-npm-telegram-live-e2e" NATESCLAW_NPM_TELEGRAM_LIVE_E2E_IMAGE)"
DOCKER_TARGET="${NATESCLAW_NPM_TELEGRAM_DOCKER_TARGET:-build}"
PACKAGE_SPEC="${NATESCLAW_NPM_TELEGRAM_PACKAGE_SPEC:-natesclaw@beta}"
PACKAGE_TGZ="${NATESCLAW_NPM_TELEGRAM_PACKAGE_TGZ:-${NATESCLAW_CURRENT_PACKAGE_TGZ:-}}"
PACKAGE_DIR="${NATESCLAW_NPM_TELEGRAM_PACKAGE_DIR:-}"
PACKAGE_LABEL="${NATESCLAW_NPM_TELEGRAM_PACKAGE_LABEL:-}"
RUN_ID="${NATESCLAW_NPM_TELEGRAM_RUN_ID:-$(date -u +%Y%m%dT%H%M%SZ)-$$}"
OUTPUT_DIR="${NATESCLAW_NPM_TELEGRAM_OUTPUT_DIR:-.artifacts/qa-e2e/npm-telegram-live/$RUN_ID}"
case "$OUTPUT_DIR" in
  /*) OUTPUT_DIR_HOST="$OUTPUT_DIR" ;;
  *) OUTPUT_DIR_HOST="$ROOT_DIR/$OUTPUT_DIR" ;;
esac
OUTPUT_DIR_CONTAINER_RELATIVE=".artifacts/qa-e2e/npm-telegram-live-output"
OUTPUT_DIR_CONTAINER="/app/$OUTPUT_DIR_CONTAINER_RELATIVE"

resolve_credential_source() {
  if [ -n "${NATESCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE:-}" ]; then
    printf "%s" "$NATESCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE"
    return 0
  fi
  if [ -n "${NATESCLAW_QA_CREDENTIAL_SOURCE:-}" ]; then
    printf "%s" "$NATESCLAW_QA_CREDENTIAL_SOURCE"
    return 0
  fi
  if [ -n "${CI:-}" ] && [ -n "${NATESCLAW_QA_CONVEX_SITE_URL:-}" ]; then
    if [ -n "${NATESCLAW_QA_CONVEX_SECRET_CI:-}" ] || [ -n "${NATESCLAW_QA_CONVEX_SECRET_MAINTAINER:-}" ]; then
      printf "convex"
    fi
  fi
}

resolve_credential_role() {
  if [ -n "${NATESCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE:-}" ]; then
    printf "%s" "$NATESCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE"
    return 0
  fi
  if [ -n "${NATESCLAW_QA_CREDENTIAL_ROLE:-}" ]; then
    printf "%s" "$NATESCLAW_QA_CREDENTIAL_ROLE"
  fi
}

validate_natesclaw_package_spec() {
  local spec="$1"
  if [[ "$spec" =~ ^natesclaw@(alpha|beta|latest|[0-9]{4}\.[1-9][0-9]*\.[1-9][0-9]*(-[1-9][0-9]*|-(alpha|beta)\.[1-9][0-9]*)?)$ ]]; then
    return 0
  fi
  echo "NATESCLAW_NPM_TELEGRAM_PACKAGE_SPEC must be natesclaw@alpha, natesclaw@beta, natesclaw@latest, or an exact Natesclaw release version; got: $spec" >&2
  exit 1
}

resolve_package_tgz() {
  local candidate="$1"
  if [ -z "$candidate" ]; then
    return 0
  fi
  if [ ! -f "$candidate" ]; then
    echo "NATESCLAW_NPM_TELEGRAM_PACKAGE_TGZ must point to an existing .tgz file; got: $candidate" >&2
    exit 1
  fi
  case "$candidate" in
    *.tgz) ;;
    *)
      echo "NATESCLAW_NPM_TELEGRAM_PACKAGE_TGZ must point to a .tgz file; got: $candidate" >&2
      exit 1
      ;;
  esac
  local dir
  local base
  dir="$(cd "$(dirname "$candidate")" && pwd)"
  base="$(basename "$candidate")"
  printf "%s/%s" "$dir" "$base"
}

resolve_package_dir() {
  local candidate="$1"
  if [ -z "$candidate" ]; then
    return 0
  fi
  if [ ! -d "$candidate" ]; then
    echo "NATESCLAW_NPM_TELEGRAM_PACKAGE_DIR must point to an existing directory; got: $candidate" >&2
    exit 1
  fi
  (cd "$candidate" && pwd)
}

read_package_version() {
  tar -xOf "$1" package/package.json |
    node -e '
let raw = "";
process.stdin.on("data", (chunk) => (raw += chunk));
process.stdin.on("end", () => {
  const version = JSON.parse(raw).version;
  if (typeof version !== "string" || !version) {
    throw new Error("package tarball is missing a version");
  }
  process.stdout.write(version);
});
'
}

package_mount_args=()
registry_helper_mount_args=()
package_install_source="$PACKAGE_SPEC"
package_source_kind="npm-package"
resolved_package_tgz="$(resolve_package_tgz "$PACKAGE_TGZ")"
resolved_package_dir="$(resolve_package_dir "$PACKAGE_DIR")"
if [ -n "$resolved_package_dir" ]; then
  if [ -z "$resolved_package_tgz" ]; then
    echo "NATESCLAW_NPM_TELEGRAM_PACKAGE_DIR requires NATESCLAW_NPM_TELEGRAM_PACKAGE_TGZ" >&2
    exit 1
  fi
  case "$resolved_package_tgz" in
    "$resolved_package_dir"/*) ;;
    *)
      echo "NATESCLAW_NPM_TELEGRAM_PACKAGE_TGZ must be inside NATESCLAW_NPM_TELEGRAM_PACKAGE_DIR" >&2
      exit 1
      ;;
  esac
  package_install_source="natesclaw@$(read_package_version "$resolved_package_tgz")"
  package_source_kind="prepared-package-set"
  package_mount_args=(-v "$resolved_package_dir:/package-under-test:ro")
  registry_helper_mount_args=(
    -v "$ROOT_DIR/scripts/lib/bounded-response.mjs:/tmp/lib/bounded-response.mjs:ro"
    -v "$ROOT_DIR/scripts/e2e/lib/plugins/npm-registry-server.mjs:/tmp/natesclaw-e2e/lib/plugins/npm-registry-server.mjs:ro"
  )
elif [ -n "$resolved_package_tgz" ]; then
  package_install_source="/package-under-test/$(basename "$resolved_package_tgz")"
  package_source_kind="packed-tarball"
  package_mount_args=(-v "$resolved_package_tgz:$package_install_source:ro")
else
  validate_natesclaw_package_spec "$PACKAGE_SPEC"
fi
if [ -z "$PACKAGE_LABEL" ]; then
  if [ -n "$resolved_package_tgz" ]; then
    PACKAGE_LABEL="$(basename "$resolved_package_tgz")"
  else
    PACKAGE_LABEL="$PACKAGE_SPEC"
  fi
fi

credential_source="$(resolve_credential_source)"
credential_role="$(resolve_credential_role)"
if [ -z "$credential_role" ] && [ "$credential_source" = "convex" ]; then
  if [ -n "${CI:-}" ]; then
    credential_role="ci"
  else
    credential_role="maintainer"
  fi
fi

validate_credential_preflight() {
  if [ "${NATESCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT:-0}" = "1" ]; then
    return 0
  fi
  if [ "$credential_source" = "convex" ]; then
    if [ -z "${NATESCLAW_QA_CONVEX_SITE_URL:-}" ]; then
      echo "Missing required env for Convex credential mode: NATESCLAW_QA_CONVEX_SITE_URL" >&2
      exit 1
    fi
    if [ "$credential_role" = "ci" ]; then
      if [ -z "${NATESCLAW_QA_CONVEX_SECRET_CI:-}" ]; then
        echo "Missing required env for Convex ci credential mode: NATESCLAW_QA_CONVEX_SECRET_CI" >&2
        exit 1
      fi
      return 0
    fi
    if [ "$credential_role" = "maintainer" ]; then
      if [ -z "${NATESCLAW_QA_CONVEX_SECRET_MAINTAINER:-}" ]; then
        echo "Missing required env for Convex maintainer credential mode: NATESCLAW_QA_CONVEX_SECRET_MAINTAINER" >&2
        exit 1
      fi
      return 0
    fi
    if [ -z "${NATESCLAW_QA_CONVEX_SECRET_CI:-}" ] && [ -z "${NATESCLAW_QA_CONVEX_SECRET_MAINTAINER:-}" ]; then
      echo "Missing required env for Convex credential mode: NATESCLAW_QA_CONVEX_SECRET_CI or NATESCLAW_QA_CONVEX_SECRET_MAINTAINER" >&2
      exit 1
    fi
    return 0
  fi

  local missing=()
  for key in \
    NATESCLAW_QA_TELEGRAM_GROUP_ID \
    NATESCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN \
    NATESCLAW_QA_TELEGRAM_SUT_BOT_TOKEN; do
    if [ -z "${!key:-}" ]; then
      missing+=("$key")
    fi
  done
  if [ "${#missing[@]}" -gt 0 ]; then
    {
      echo "Missing required Telegram QA credential env before Docker work: ${missing[*]}"
      echo "Use one of:"
      echo "  direct Telegram env: NATESCLAW_QA_TELEGRAM_GROUP_ID, NATESCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN, NATESCLAW_QA_TELEGRAM_SUT_BOT_TOKEN"
      echo "  Convex env: NATESCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex plus NATESCLAW_QA_CONVEX_SITE_URL and a role secret"
    } >&2
    exit 1
  fi
}

validate_credential_preflight

docker_e2e_build_or_reuse "$IMAGE_NAME" npm-telegram-live "$ROOT_DIR/scripts/e2e/Dockerfile" "$ROOT_DIR" "$DOCKER_TARGET"

mkdir -p "$ROOT_DIR/.artifacts/qa-e2e"
mkdir -p "$OUTPUT_DIR_HOST"
npm_prefix_host="$(mktemp -d "$ROOT_DIR/.artifacts/qa-e2e/npm-telegram-live-prefix.XXXXXX")"
harness_root="$(mktemp -d "$ROOT_DIR/.artifacts/qa-e2e/npm-telegram-live-harness.XXXXXX")"
harness_package_json="$harness_root/package.json"
cp "$ROOT_DIR/package.json" "$harness_package_json"
node --import tsx "$ROOT_DIR/scripts/e2e/lib/npm-telegram-live/prepare-package.mts" "$harness_package_json"
cleanup() {
  local rc=$?
  trap - EXIT
  printf 'schema=1\nexit_code=%s\nlive_output=job_log\n' "$rc" > "$OUTPUT_DIR_HOST/run-metadata.txt"
  rm -rf "$npm_prefix_host"
  rm -rf "$harness_root"
  exit "$rc"
}
trap cleanup EXIT

docker_env=(
  -e COREPACK_ENABLE_DOWNLOAD_PROMPT=0
  -e NATESCLAW_E2E_COMMAND_TIMEOUT="${NATESCLAW_E2E_COMMAND_TIMEOUT:-300s}"
  -e TMPDIR=/tmp
  -e NATESCLAW_NPM_TELEGRAM_PACKAGE_SPEC="$PACKAGE_SPEC"
  -e NATESCLAW_NPM_TELEGRAM_PACKAGE_LABEL="$PACKAGE_LABEL"
  -e NATESCLAW_NPM_TELEGRAM_OUTPUT_DIR="$OUTPUT_DIR_CONTAINER_RELATIVE"
  -e NATESCLAW_QA_PACKAGE_SOURCE="$package_install_source"
  -e NATESCLAW_QA_PACKAGE_SOURCE_KIND="$package_source_kind"
  -e NATESCLAW_QA_RUNNER="${NATESCLAW_QA_RUNNER:-docker}"
  -e NATESCLAW_NPM_TELEGRAM_FAST="${NATESCLAW_NPM_TELEGRAM_FAST:-1}"
)

forward_env_if_set() {
  local key="$1"
  if [ -n "${!key:-}" ]; then
    docker_env+=(-e "$key")
  fi
}

if [ -n "$credential_source" ]; then
  docker_env+=(-e NATESCLAW_QA_CREDENTIAL_SOURCE="$credential_source")
fi
if [ -n "$credential_role" ]; then
  docker_env+=(-e NATESCLAW_QA_CREDENTIAL_ROLE="$credential_role")
fi

for key in \
  OPENAI_API_KEY \
  ANTHROPIC_API_KEY \
  GEMINI_API_KEY \
  GOOGLE_API_KEY \
  NATESCLAW_LIVE_OPENAI_KEY \
  NATESCLAW_LIVE_ANTHROPIC_KEY \
  NATESCLAW_LIVE_GEMINI_KEY \
  NATESCLAW_QA_TELEGRAM_GROUP_ID \
  NATESCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN \
  NATESCLAW_QA_TELEGRAM_SUT_BOT_TOKEN \
  NATESCLAW_QA_CONVEX_SITE_URL \
  NATESCLAW_QA_CONVEX_SECRET_CI \
  NATESCLAW_QA_CONVEX_SECRET_MAINTAINER \
  NATESCLAW_QA_CREDENTIAL_LEASE_TTL_MS \
  NATESCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS \
  NATESCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS \
  NATESCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS \
  NATESCLAW_QA_CONVEX_ENDPOINT_PREFIX \
  NATESCLAW_QA_CREDENTIAL_OWNER_ID \
  NATESCLAW_QA_ALLOW_INSECURE_HTTP \
  NATESCLAW_QA_REDACT_PUBLIC_METADATA \
  NATESCLAW_QA_PACKAGE_SOURCE_SHA \
  NATESCLAW_QA_TELEGRAM_CANARY_TIMEOUT_MS \
  NATESCLAW_QA_TELEGRAM_SCENARIO_TIMEOUT_MS \
  NATESCLAW_QA_SUITE_PROGRESS \
  NATESCLAW_NPM_TELEGRAM_PROVIDER_MODE \
  NATESCLAW_NPM_TELEGRAM_MODEL \
  NATESCLAW_NPM_TELEGRAM_ALT_MODEL \
  NATESCLAW_NPM_TELEGRAM_SCENARIOS \
  NATESCLAW_NPM_TELEGRAM_RTT_SAMPLES \
  NATESCLAW_NPM_TELEGRAM_RTT_CHECKS \
  NATESCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS \
  NATESCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES \
  NATESCLAW_NPM_TELEGRAM_SKIP_HOTPATH \
  NATESCLAW_NPM_TELEGRAM_SUT_ACCOUNT \
  NATESCLAW_NPM_TELEGRAM_ALLOW_FAILURES; do
  forward_env_if_set "$key"
done

echo "Running package Telegram live Docker E2E ($PACKAGE_LABEL)..."
run_logged_print_heartbeat "npm-telegram-package-install" 60 docker_e2e_docker_run_cmd run --rm \
  -e COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
  -e NATESCLAW_E2E_NPM_INSTALL_TIMEOUT="${NATESCLAW_E2E_NPM_INSTALL_TIMEOUT:-600s}" \
  -e NATESCLAW_NPM_TELEGRAM_INSTALL_SOURCE="$package_install_source" \
  -e NATESCLAW_NPM_TELEGRAM_PACKAGE_LABEL="$PACKAGE_LABEL" \
  -e NATESCLAW_NPM_TELEGRAM_PACKAGE_SET="$([ -n "$resolved_package_dir" ] && printf 1 || printf 0)" \
  ${package_mount_args[@]+"${package_mount_args[@]}"} \
  ${registry_helper_mount_args[@]+"${registry_helper_mount_args[@]}"} \
  -v "$npm_prefix_host:/npm-global" \
  -i "$IMAGE_NAME" bash -s <<'EOF'
set -euo pipefail

export HOME="$(mktemp -d "/tmp/natesclaw-npm-telegram-install.XXXXXX")"
export NPM_CONFIG_PREFIX="/npm-global"
export PATH="$NPM_CONFIG_PREFIX/bin:$PATH"

install_source="${NATESCLAW_NPM_TELEGRAM_INSTALL_SOURCE:?missing NATESCLAW_NPM_TELEGRAM_INSTALL_SOURCE}"
package_label="${NATESCLAW_NPM_TELEGRAM_PACKAGE_LABEL:-$install_source}"
echo "Installing ${package_label} from ${install_source}..."

registry_pid=""
registry_log=""
cleanup_registry() {
  if [ -n "$registry_pid" ]; then
    kill "$registry_pid" >/dev/null 2>&1 || true
    wait "$registry_pid" >/dev/null 2>&1 || true
  fi
  if [ -n "$registry_log" ]; then
    rm -f "$registry_log"
  fi
}
trap cleanup_registry EXIT

if [ "${NATESCLAW_NPM_TELEGRAM_PACKAGE_SET:-0}" = "1" ]; then
  shopt -s nullglob
  package_tgzs=(/package-under-test/*.tgz)
  shopt -u nullglob
  if [ "${#package_tgzs[@]}" -eq 0 ]; then
    echo "prepared package set contains no tgz files" >&2
    exit 1
  fi
  registry_args=()
  for package_tgz in "${package_tgzs[@]}"; do
    package_metadata="$(
      tar -xOf "$package_tgz" package/package.json |
        node -e '
let raw = "";
process.stdin.on("data", (chunk) => (raw += chunk));
process.stdin.on("end", () => {
  const pkg = JSON.parse(raw);
  if (typeof pkg.name !== "string" || !pkg.name || typeof pkg.version !== "string" || !pkg.version) {
    throw new Error("package tarball is missing name or version");
  }
  process.stdout.write(`${pkg.name}\n${pkg.version}\n`);
});
'
    )"
    mapfile -t package_fields <<<"$package_metadata"
    registry_args+=("${package_fields[0]}" "${package_fields[1]}" "$package_tgz")
  done
  registry_port_file="$(mktemp)"
  registry_log="$(mktemp)"
  NATESCLAW_NPM_REGISTRY_UPSTREAM=https://registry.npmjs.org \
    node /tmp/natesclaw-e2e/lib/plugins/npm-registry-server.mjs \
    "$registry_port_file" \
    "${registry_args[@]}" >"$registry_log" 2>&1 &
  registry_pid=$!
  for _ in $(seq 1 100); do
    if [ -s "$registry_port_file" ]; then
      break
    fi
    if ! kill -0 "$registry_pid" >/dev/null 2>&1; then
      cat "$registry_log" >&2
      exit 1
    fi
    sleep 0.1
  done
  if [ ! -s "$registry_port_file" ]; then
    cat "$registry_log" >&2
    echo "prepared package registry did not start" >&2
    exit 1
  fi
  registry_url="http://127.0.0.1:$(cat "$registry_port_file")"
  rm -f "$registry_port_file"
  export NPM_CONFIG_REGISTRY="$registry_url"
  export npm_config_registry="$registry_url"
fi

npm_install_timeout="${NATESCLAW_E2E_NPM_INSTALL_TIMEOUT:-600s}"
run_npm_install() {
  if [ -z "$npm_install_timeout" ] || [ "$npm_install_timeout" = "0" ]; then
    npm install -g "$install_source" --no-fund --no-audit
    return
  fi

  local timeout_bin=""
  if command -v timeout >/dev/null 2>&1; then
    timeout_bin="timeout"
  elif command -v gtimeout >/dev/null 2>&1; then
    timeout_bin="gtimeout"
  fi
  if [ -z "$timeout_bin" ]; then
    echo "timeout or gtimeout is required for NATESCLAW_E2E_NPM_INSTALL_TIMEOUT=$npm_install_timeout" >&2
    return 127
  fi

  if "$timeout_bin" --kill-after=1s 1s true >/dev/null 2>&1; then
    "$timeout_bin" --kill-after=30s "$npm_install_timeout" npm install -g "$install_source" --no-fund --no-audit
  else
    "$timeout_bin" "$npm_install_timeout" npm install -g "$install_source" --no-fund --no-audit
  fi
}
run_npm_install

command -v natesclaw
natesclaw --version
EOF

# Mount the trusted current-source QA harness separately from the installed
# package candidate. The candidate remains the absolute CLI/runtime SUT.
run_logged_print_heartbeat "npm-telegram-live-suite" 60 docker_e2e_run_with_harness \
  "${docker_env[@]}" \
  -v "$ROOT_DIR/.artifacts:/app/.artifacts" \
  -v "$OUTPUT_DIR_HOST:$OUTPUT_DIR_CONTAINER" \
  -v "$harness_package_json:/app/package.json:ro" \
  -v "$ROOT_DIR/dist:/app/dist:ro" \
  -v "$ROOT_DIR/node_modules:/trusted-harness/node_modules:ro" \
  -v "$ROOT_DIR/packages:/app/packages:ro" \
  -v "$ROOT_DIR/extensions:/app/extensions:ro" \
  -v "$ROOT_DIR/taxonomy.yaml:/app/taxonomy.yaml:ro" \
  -v "$ROOT_DIR/qa/scenarios:/app/qa/scenarios:ro" \
  -v "$ROOT_DIR/taxonomy.yaml:/app/taxonomy.yaml:ro" \
  -v "$npm_prefix_host:/npm-global" \
  -i "$IMAGE_NAME" bash -s <<'EOF'
set -euo pipefail
source scripts/lib/natesclaw-e2e-instance.sh

runtime_home="$(mktemp -d "/tmp/natesclaw-npm-telegram-runtime.XXXXXX")"
export HOME="$runtime_home"
export NPM_CONFIG_PREFIX="/npm-global"
export PATH="$NPM_CONFIG_PREFIX/bin:$PATH"
export NATESCLAW_NPM_TELEGRAM_REPO_ROOT="/app"
export NATESCLAW_NPM_TELEGRAM_PACKAGE_VERSION="$(node -e 'const pkg = require("/npm-global/lib/node_modules/natesclaw/package.json"); process.stdout.write(pkg.version)')"
sut_command="/npm-global/bin/natesclaw"

dump_hotpath_logs() {
  local status="$1"
  echo "installed-package onboarding recovery hot path failed with exit code $status" >&2
  for file in \
    /tmp/natesclaw-npm-telegram-onboard.json \
    /tmp/natesclaw-npm-telegram-channel-add.log \
    /tmp/natesclaw-npm-telegram-doctor-fix.log \
    /tmp/natesclaw-npm-telegram-doctor-check.log; do
    if [ -f "$file" ]; then
      echo "--- $file ---" >&2
      natesclaw_e2e_print_log "$file" >&2
    fi
  done
}
trap 'status=$?; dump_hotpath_logs "$status"; exit "$status"' ERR

test -x "$sut_command"
natesclaw_e2e_run_command "$sut_command" --version
mkdir -p /app/node_modules
link_harness_dependency() {
  local source="$1"
  local name="$2"
  local target="/app/node_modules/$name"
  mkdir -p "$(dirname "$target")"
  ln -sfnT "$source" "$target"
}

# External dependencies resolve from the trusted install, not the candidate.
for dependency_dir in /trusted-harness/node_modules/* /trusted-harness/node_modules/.[!.]*; do
  [ -e "$dependency_dir" ] || continue
  dependency_name="$(basename "$dependency_dir")"
  case "$dependency_name" in
    .bin | natesclaw)
      continue
      ;;
    @*)
      [ -d "$dependency_dir" ] || continue
      for scoped_dependency_dir in "$dependency_dir"/*; do
        [ -e "$scoped_dependency_dir" ] || continue
        scoped_dependency_name="$(basename "$scoped_dependency_dir")"
        link_harness_dependency \
          "$scoped_dependency_dir" \
          "$dependency_name/$scoped_dependency_name"
      done
      ;;
    *)
      link_harness_dependency "$dependency_dir" "$dependency_name"
      ;;
  esac
done

# Workspace links must resolve under /app even when pnpm linked them relative to
# the checkout path used by the workflow.
for workspace_dir in /app/packages/* /app/extensions/*; do
  [ -f "$workspace_dir/package.json" ] || continue
  workspace_name="$(node -e \
    'const fs = require("node:fs"); const pkg = JSON.parse(fs.readFileSync(process.argv[1], "utf8")); process.stdout.write(pkg.name || "");' \
    "$workspace_dir/package.json")"
  [ -n "$workspace_name" ] || continue
  link_harness_dependency "$workspace_dir" "$workspace_name"
done
link_harness_dependency /app natesclaw

if [ "${NATESCLAW_NPM_TELEGRAM_SKIP_HOTPATH:-0}" != "1" ]; then
  hotpath_home="$(mktemp -d "/tmp/natesclaw-npm-telegram-hotpath.XXXXXX")"
  export HOME="$hotpath_home"
  echo "Running installed-package onboarding recovery hot path..."
  hotpath_placeholder="natesclaw-npm-telegram-hotpath"
  hotpath_model_value="$(printf '%s%s' s "k-$hotpath_placeholder")"
  if [ -n "${OPENAI_API_KEY:-}" ]; then
    hotpath_model_value="$OPENAI_API_KEY"
  fi
  hotpath_channel_value="$(printf '%s:%s' 123456 "$hotpath_placeholder")"
  OPENAI_API_KEY="$hotpath_model_value" natesclaw_e2e_run_command "$sut_command" onboard \
    --non-interactive --accept-risk \
    --mode local \
    --auth-choice openai-api-key \
    --secret-input-mode ref \
    --gateway-port 18789 \
    --gateway-bind loopback \
    --skip-daemon \
    --skip-ui \
    --skip-skills \
    --skip-health \
    --json >/tmp/natesclaw-npm-telegram-onboard.json </dev/null

  natesclaw_e2e_run_command "$sut_command" channels add --channel telegram --token "$hotpath_channel_value" >/tmp/natesclaw-npm-telegram-channel-add.log 2>&1 </dev/null
  natesclaw_e2e_run_command "$sut_command" doctor --fix --non-interactive >/tmp/natesclaw-npm-telegram-doctor-fix.log 2>&1 </dev/null
  natesclaw_e2e_run_command "$sut_command" doctor --non-interactive >/tmp/natesclaw-npm-telegram-doctor-check.log 2>&1 </dev/null
  export HOME="$runtime_home"
fi

export NATESCLAW_NPM_TELEGRAM_SUT_COMMAND="$sut_command"
trap - ERR
tsx scripts/e2e/npm-telegram-live-runner.ts
EOF

echo "package Telegram live Docker E2E passed ($PACKAGE_LABEL)"
