#!/usr/bin/env bash
set -euo pipefail

FROM_VERSION=""
TO_VERSION="v0.1.0"
HOST="bpmt@120.24.236.92"
REMOTE_DIR="/home/bpmt/base-portal"
LOCAL_PLACEHOLDER_IMAGE="base-portal:v0.1.0"
IMAGE="${BASE_PORTAL_IMAGE:-}"

usage() {
  cat <<'EOF'
Usage: ./upgrade.sh [options]

Options:
  --from VERSION        Expected currently installed version.
  --to VERSION          Target version. Default: v0.1.0
  --host USER@HOST      SSH target. Default: bpmt@120.24.236.92
  --remote-dir PATH     Remote install dir. Default: /home/bpmt/base-portal
  --image IMAGE:TAG     Immutable target image tag. Required for production.
  -h, --help            Show this help.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --from) FROM_VERSION="${2:?missing value for --from}"; shift 2 ;;
    --to) TO_VERSION="${2:?missing value for --to}"; shift 2 ;;
    --host) HOST="${2:?missing value for --host}"; shift 2 ;;
    --remote-dir) REMOTE_DIR="${2:?missing value for --remote-dir}"; shift 2 ;;
    --image) IMAGE="${2:?missing value for --image}"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown option: $1" >&2; usage >&2; exit 2 ;;
  esac
done

APP_VERSION="${TO_VERSION#v}"

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "Missing required command: $1" >&2
    exit 1
  }
}

reject_latest_image() {
  if [[ -z "$IMAGE" ]]; then
    echo "Production image is required. Pass --image <registry>/base-portal:$TO_VERSION or set BASE_PORTAL_IMAGE." >&2
    exit 1
  fi
  if [[ "$IMAGE" == "$LOCAL_PLACEHOLDER_IMAGE" ]]; then
    echo "Refusing local placeholder image for production deploy: $IMAGE" >&2
    echo "Pass an immutable registry image, for example <registry>/base-portal:$TO_VERSION." >&2
    exit 1
  fi
  if [[ "$IMAGE" == *":latest" || "$IMAGE" != *":"* ]]; then
    echo "Production image must use an explicit immutable version tag, not latest: $IMAGE" >&2
    exit 1
  fi
}

sync_release_files() {
  ssh "$HOST" "mkdir -p $REMOTE_DIR/releases/$TO_VERSION $REMOTE_DIR/backups"
  COPYFILE_DISABLE=1 tar --no-xattrs -cf - \
    DEPLOY.md README.md install.sh upgrade.sh \
    deploy/docker-compose.yml deploy/.env.example deploy/web.Dockerfile \
    | ssh "$HOST" "rm -rf $REMOTE_DIR/releases/$TO_VERSION && mkdir -p $REMOTE_DIR/releases/$TO_VERSION && tar -xf - -C $REMOTE_DIR/releases/$TO_VERSION"
  ssh "$HOST" "cp $REMOTE_DIR/releases/$TO_VERSION/deploy/docker-compose.yml $REMOTE_DIR/deploy/docker-compose.yml && cp $REMOTE_DIR/releases/$TO_VERSION/deploy/.env.example $REMOTE_DIR/deploy/.env.example"
}

remote_upgrade() {
  ssh "$HOST" "EXPECTED_FROM='$FROM_VERSION' TARGET_VERSION='$TO_VERSION' APP_VERSION='$APP_VERSION' BASE_PORTAL_IMAGE='$IMAGE' REMOTE_DIR='$REMOTE_DIR' bash -s" <<'REMOTE'
set -euo pipefail
cd "$REMOTE_DIR"

command -v docker >/dev/null 2>&1 || {
  echo "Missing remote command: docker" >&2
  exit 1
}
docker compose version >/dev/null

if [[ ! -f .deploy/version ]]; then
  echo "No existing install marker found. Use install.sh for first install." >&2
  exit 1
fi

CURRENT_VERSION="$(cat .deploy/version)"
if [[ -n "$EXPECTED_FROM" && "$CURRENT_VERSION" != "$EXPECTED_FROM" ]]; then
  echo "Expected current version $EXPECTED_FROM but found $CURRENT_VERSION." >&2
  exit 1
fi
if [[ "$CURRENT_VERSION" == "$TARGET_VERSION" ]]; then
  echo "Refusing same-version upgrade: $CURRENT_VERSION." >&2
  exit 1
fi
if [[ "$TARGET_VERSION" < "$CURRENT_VERSION" ]]; then
  echo "Refusing downgrade from $CURRENT_VERSION to $TARGET_VERSION." >&2
  exit 1
fi

if [[ ! -f deploy/.env ]]; then
  echo "Missing remote deploy/.env. Refusing upgrade without runtime config." >&2
  exit 1
fi

BACKUP_SUFFIX="$(date +%Y%m%d%H%M%S)"
cp deploy/.env "backups/.env.${CURRENT_VERSION}.to.${TARGET_VERSION}.${BACKUP_SUFFIX}"
chmod 600 "backups/.env.${CURRENT_VERSION}.to.${TARGET_VERSION}.${BACKUP_SUFFIX}"

missing_keys=()
while IFS='=' read -r key _; do
  [[ -z "$key" || "$key" == \#* ]] && continue
  if ! grep -q "^${key}=" deploy/.env; then
    missing_keys+=("$key")
  fi
done < deploy/.env.example

if [[ "${#missing_keys[@]}" -gt 0 ]]; then
  echo "Remote deploy/.env is missing required keys:" >&2
  printf ' - %s\n' "${missing_keys[@]}" >&2
  echo "Secret values were not printed. Update deploy/.env, then rerun upgrade.sh." >&2
  exit 2
fi

if grep -q '^PORTAL_ENABLE_MOCK_AUTH=true' deploy/.env; then
  echo "Refusing production upgrade with PORTAL_ENABLE_MOCK_AUTH=true." >&2
  exit 1
fi

env_value() {
  local key="$1"
  awk -F= -v key="$key" '$1 == key { value = substr($0, index($0, "=") + 1) } END { print value }' deploy/.env
}

env_issues=()
for key in POSTGRES_PASSWORD DATABASE_URL FEISHU_IAM_CLIENT_SECRET FEISHU_IAM_DEVELOPER_API_TOKEN; do
  if ! grep -q "^${key}=" deploy/.env; then
    env_issues+=("missing:${key}")
  elif [[ -z "$(env_value "$key")" ]]; then
    env_issues+=("empty:${key}")
  fi
done

if [[ "$(env_value POSTGRES_PASSWORD)" == "change-me" ]]; then
  env_issues+=("placeholder:POSTGRES_PASSWORD")
fi
if [[ "$(env_value DATABASE_URL)" == *"change-me"* ]]; then
  env_issues+=("placeholder:DATABASE_URL")
fi
if [[ "$(env_value PORTAL_WEB_ORIGIN)" != "https://base-portal.riversoft.com.cn" ]]; then
  env_issues+=("unexpected:PORTAL_WEB_ORIGIN")
fi
if [[ "$(env_value COOKIE_SECURE)" != "true" ]]; then
  env_issues+=("unsafe:COOKIE_SECURE")
fi

if [[ "${#env_issues[@]}" -gt 0 ]]; then
  echo "Remote deploy/.env is not production-ready. Only key names are shown; values were not printed:" >&2
  printf ' - %s\n' "${env_issues[@]}" >&2
  echo "Update deploy/.env on the server, then rerun upgrade.sh." >&2
  exit 2
fi

export BASE_PORTAL_VERSION="$TARGET_VERSION"
export APP_VERSION="$APP_VERSION"
export BASE_PORTAL_IMAGE="$BASE_PORTAL_IMAGE"
export GIT_COMMIT="${GIT_COMMIT:-unknown}"

docker compose --env-file deploy/.env -f deploy/docker-compose.yml config >/dev/null
docker compose --env-file deploy/.env -f deploy/docker-compose.yml pull db
if ! docker image inspect "$BASE_PORTAL_IMAGE" >/dev/null 2>&1; then
  docker compose --env-file deploy/.env -f deploy/docker-compose.yml pull web
fi
docker compose --env-file deploy/.env -f deploy/docker-compose.yml up -d --no-build

HOST_WEB_PORT="$(grep -E '^HOST_WEB_PORT=' deploy/.env | tail -1 | cut -d= -f2-)"
HOST_WEB_PORT="${HOST_WEB_PORT:-3000}"
for path in /health /ready; do
  for _ in $(seq 1 30); do
    if curl -fsS "http://127.0.0.1:${HOST_WEB_PORT}${path}" >/dev/null; then
      break
    fi
    sleep 2
  done
  curl -fsS "http://127.0.0.1:${HOST_WEB_PORT}${path}" >/dev/null
done

printf '%s\n' "$TARGET_VERSION" > .deploy/version
echo "Upgraded $CURRENT_VERSION -> $TARGET_VERSION at $REMOTE_DIR."
REMOTE
}

main() {
  require_cmd ssh
  require_cmd tar
  reject_latest_image
  sync_release_files
  remote_upgrade
}

main "$@"
