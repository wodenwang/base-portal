#!/usr/bin/env bash
set -euo pipefail

VERSION="v0.1.0"
HOST="bpmt@120.24.236.92"
REMOTE_DIR="/home/bpmt/base-portal"
DOMAIN="base-portal.riversoft.com.cn"
SERVER_IP="120.24.236.92"
LOCAL_PLACEHOLDER_IMAGE="base-portal:v0.1.0"
IMAGE="${BASE_PORTAL_IMAGE:-}"
SKIP_DNS=0
SKIP_NGINX=0

usage() {
  cat <<'EOF'
Usage: ./install.sh [options]

Options:
  --version VERSION       Target version. Default: v0.1.0
  --host USER@HOST        SSH target. Default: bpmt@120.24.236.92
  --remote-dir PATH       Remote install dir. Default: /home/bpmt/base-portal
  --image IMAGE:TAG       Immutable production image tag. Required for production.
  --domain DOMAIN         Public domain. Default: base-portal.riversoft.com.cn
  --server-ip IP          DNS A record target. Default: 120.24.236.92
  --skip-dns              Do not create/update Aliyun DNS record.
  --skip-nginx            Do not configure remote certificate/nginx.
  -h, --help              Show this help.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --version) VERSION="${2:?missing value for --version}"; shift 2 ;;
    --host) HOST="${2:?missing value for --host}"; shift 2 ;;
    --remote-dir) REMOTE_DIR="${2:?missing value for --remote-dir}"; shift 2 ;;
    --image) IMAGE="${2:?missing value for --image}"; shift 2 ;;
    --domain) DOMAIN="${2:?missing value for --domain}"; shift 2 ;;
    --server-ip) SERVER_IP="${2:?missing value for --server-ip}"; shift 2 ;;
    --skip-dns) SKIP_DNS=1; shift ;;
    --skip-nginx) SKIP_NGINX=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown option: $1" >&2; usage >&2; exit 2 ;;
  esac
done

APP_VERSION="${VERSION#v}"

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "Missing required command: $1" >&2
    exit 1
  }
}

reject_latest_image() {
  if [[ -z "$IMAGE" ]]; then
    echo "Production image is required. Pass --image <registry>/base-portal:$VERSION or set BASE_PORTAL_IMAGE." >&2
    exit 1
  fi
  if [[ "$IMAGE" == "$LOCAL_PLACEHOLDER_IMAGE" ]]; then
    echo "Refusing local placeholder image for production deploy: $IMAGE" >&2
    echo "Pass an immutable registry image, for example <registry>/base-portal:$VERSION." >&2
    exit 1
  fi
  if [[ "$IMAGE" == *":latest" || "$IMAGE" != *":"* ]]; then
    echo "Production image must use an explicit immutable version tag, not latest: $IMAGE" >&2
    exit 1
  fi
}

configure_dns() {
  if [[ "$SKIP_DNS" -eq 1 ]]; then
    echo "DNS step skipped."
    return
  fi

  require_cmd aliyun
  aliyun sts GetCallerIdentity >/dev/null

  local record_json record_id current_value
  record_json="$(aliyun alidns DescribeSubDomainRecords --SubDomain "$DOMAIN")"
  record_id="$(printf '%s' "$record_json" | python3 -c 'import json,sys; data=json.load(sys.stdin); records=data.get("DomainRecords",{}).get("Record",[]); print(records[0].get("RecordId","") if records else "")')"
  current_value="$(printf '%s' "$record_json" | python3 -c 'import json,sys; data=json.load(sys.stdin); records=data.get("DomainRecords",{}).get("Record",[]); print(records[0].get("Value","") if records else "")')"

  if [[ -z "$record_id" ]]; then
    aliyun alidns AddDomainRecord \
      --DomainName riversoft.com.cn \
      --RR base-portal \
      --Type A \
      --Value "$SERVER_IP" >/dev/null
    echo "DNS A record created: $DOMAIN -> $SERVER_IP"
  elif [[ "$current_value" != "$SERVER_IP" ]]; then
    aliyun alidns UpdateDomainRecord \
      --RecordId "$record_id" \
      --RR base-portal \
      --Type A \
      --Value "$SERVER_IP" >/dev/null
    echo "DNS A record updated: $DOMAIN -> $SERVER_IP"
  else
    echo "DNS A record already correct: $DOMAIN -> $SERVER_IP"
  fi

  dig +short "$DOMAIN" || true
}

sync_release_files() {
  ssh "$HOST" "mkdir -p $REMOTE_DIR/deploy $REMOTE_DIR/releases/$VERSION $REMOTE_DIR/backups $REMOTE_DIR/data/postgres $REMOTE_DIR/.deploy"
  COPYFILE_DISABLE=1 tar --no-xattrs -cf - \
    DEPLOY.md README.md install.sh upgrade.sh \
    deploy/docker-compose.yml deploy/.env.example deploy/web.Dockerfile \
    | ssh "$HOST" "rm -rf $REMOTE_DIR/releases/$VERSION && mkdir -p $REMOTE_DIR/releases/$VERSION && tar -xf - -C $REMOTE_DIR/releases/$VERSION"
  ssh "$HOST" "cp $REMOTE_DIR/releases/$VERSION/deploy/docker-compose.yml $REMOTE_DIR/deploy/docker-compose.yml && cp $REMOTE_DIR/releases/$VERSION/deploy/.env.example $REMOTE_DIR/deploy/.env.example"
}

remote_install() {
  ssh "$HOST" "TARGET_VERSION='$VERSION' APP_VERSION='$APP_VERSION' BASE_PORTAL_IMAGE='$IMAGE' REMOTE_DIR='$REMOTE_DIR' bash -s" <<'REMOTE'
set -euo pipefail
cd "$REMOTE_DIR"

command -v docker >/dev/null 2>&1 || {
  echo "Missing remote command: docker" >&2
  exit 1
}
docker compose version >/dev/null

if [[ -f .deploy/version ]]; then
  echo "Existing install detected at $REMOTE_DIR with version $(cat .deploy/version)." >&2
  echo "Use upgrade.sh for version-to-version upgrades." >&2
  exit 1
fi

if [[ ! -f deploy/.env ]]; then
  cp deploy/.env.example deploy/.env
  chmod 600 deploy/.env
  echo "Created deploy/.env from deploy/.env.example." >&2
  echo "Fill real production values on the server, then rerun install.sh. Secret values were not printed." >&2
  exit 2
fi

if grep -q '^PORTAL_ENABLE_MOCK_AUTH=true' deploy/.env; then
  echo "Refusing production install with PORTAL_ENABLE_MOCK_AUTH=true." >&2
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
  echo "Update deploy/.env on the server, then rerun install.sh." >&2
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
echo "Installed $TARGET_VERSION at $REMOTE_DIR."
REMOTE
}

configure_nginx() {
  if [[ "$SKIP_NGINX" -eq 1 ]]; then
    echo "nginx/certificate step skipped."
    return
  fi

  ssh "$HOST" "DOMAIN='$DOMAIN' REMOTE_DIR='$REMOTE_DIR' bash -s" <<'REMOTE'
set -euo pipefail
NGINX_DIR="$HOME/nginx"
NGINX_CONF="$NGINX_DIR/nginx.conf"
CERT_DIR_ON_HOST="$HOME/bpmt-lite/nginx/certs"
CERT_FULLCHAIN="$CERT_DIR_ON_HOST/fullchain.pem"
CERT_PRIVKEY="$CERT_DIR_ON_HOST/privkey.pem"
BEGIN_MARKER="# BEGIN base-portal managed block"
END_MARKER="# END base-portal managed block"

if [[ ! -d "$NGINX_DIR" ]]; then
  echo "Remote nginx directory not found: $NGINX_DIR" >&2
  exit 1
fi
if [[ ! -f "$NGINX_CONF" ]]; then
  echo "Remote nginx.conf not found: $NGINX_CONF" >&2
  exit 1
fi
if [[ ! -f "$CERT_FULLCHAIN" || ! -f "$CERT_PRIVKEY" ]]; then
  echo "Wildcard certificate files were not found in $CERT_DIR_ON_HOST." >&2
  echo "Install or renew the riversoft.com.cn wildcard certificate before configuring nginx." >&2
  exit 1
fi

HOST_WEB_PORT="$(grep -E '^HOST_WEB_PORT=' "$REMOTE_DIR/deploy/.env" | tail -1 | cut -d= -f2-)"
HOST_WEB_PORT="${HOST_WEB_PORT:-3000}"

tmp_conf="$(mktemp)"
awk -v begin="$BEGIN_MARKER" -v end="$END_MARKER" '
  $0 == begin { skip = 1; next }
  $0 == end { skip = 0; next }
  skip != 1 { print }
' "$NGINX_CONF" > "$tmp_conf"

cat >> "$tmp_conf" <<NGINX

$BEGIN_MARKER
server {
    listen 80;
    server_name $DOMAIN;

    location / {
        return 301 https://\$host\$request_uri;
    }
}

server {
    listen 443 ssl;
    http2 on;
    server_name $DOMAIN;

    ssl_certificate /etc/nginx/certs/fullchain.pem;
    ssl_certificate_key /etc/nginx/certs/privkey.pem;

    location / {
        proxy_pass http://host.docker.internal:$HOST_WEB_PORT;
        proxy_http_version 1.1;
        proxy_set_header Host \$http_host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
$END_MARKER
NGINX

backup="$NGINX_CONF.backup.$(date +%Y%m%d%H%M%S)"
cp "$NGINX_CONF" "$backup"
cat "$tmp_conf" > "$NGINX_CONF"
rm -f "$tmp_conf"

if ! docker exec system-nginx nginx -t; then
  cp "$backup" "$NGINX_CONF"
  echo "nginx config validation failed; restored $backup." >&2
  exit 1
fi

if [[ -f "$NGINX_DIR/docker-compose.yml" ]]; then
  (cd "$NGINX_DIR" && docker compose up -d --force-recreate)
elif [[ -f "$NGINX_DIR/compose.yml" ]]; then
  (cd "$NGINX_DIR" && docker compose -f compose.yml up -d --force-recreate)
else
  nginx -t && nginx -s reload
fi

curl -fsS "https://$DOMAIN/health" >/dev/null
curl -fsS "https://$DOMAIN/ready" >/dev/null
echo "nginx proxy verified for https://$DOMAIN"
REMOTE
}

main() {
  require_cmd ssh
  require_cmd tar
  require_cmd python3
  reject_latest_image
  configure_dns
  sync_release_files
  remote_install
  configure_nginx
}

main "$@"
