#!/usr/bin/env bash
set -euo pipefail

# Pages of History PWA — single env Docker manager
# Usage:
#   bash scripts/poh.sh                      # default toggle: dev up if down, else down
#   bash scripts/poh.sh <number> [port]      # run a specific action non-interactively, optional port
#   bash scripts/poh.sh <word> [port]        # same actions with words, e.g. dev-up | dev-down | prod-up | prod-down | rebuild | status | fix | check | prep
# Port selection rules:
#   - If you pass a [port] or set POH_PORT, that exact port is used (errors if busy).
#   - Otherwise defaults are:
#       Dev: 5173 (fallback 5174)
#       Prod: 8080 (fallback 8081)

NAME_BASE="poh-pwa"
NETWORK="${NAME_BASE}-net"

# Images
DEV_IMAGE="${NAME_BASE}-dev"
PROD_IMAGE_TAG="${NAME_BASE}:latest"

# Containers
DEV_CONT="${NAME_BASE}-dev"
PROD_CONT="${NAME_BASE}"

# Ports (host:container)
# Defaults favor common Vite conventions for easier debugging.
DEV_HOST_PORT=5173
DEV_CONT_PORT=5173
PROD_HOST_PORT=8080
PROD_CONT_PORT=80

# ---------- Port helpers ----------
port_in_use() {
  # returns 0 if port is busy, 1 if free
  local port="$1"
  if command -v lsof >/dev/null 2>&1; then
    lsof -iTCP -sTCP:LISTEN -P -n 2>/dev/null | grep -E "[:\.]${port}[[:space:]]" >/dev/null && return 0 || return 1
  elif command -v nc >/dev/null 2>&1; then
    nc -z 127.0.0.1 "$port" >/dev/null 2>&1 && return 0 || return 1
  else
    # Fallback: optimistic (assume free)
    return 1
  fi
}

choose_port() {
  # Decide host port with simple, predictable rules.
  # $1: optional explicit port (CLI)
  # $2: preferred default port (when no explicit/env)
  # $3: fallback default port (when preferred is busy)
  local requested="${1:-}"
  local preferred="${2:-}"
  local fallback="${3:-}"
  local env_port="${POH_PORT:-}"

  if [[ -n "$requested" ]]; then
    if port_in_use "$requested"; then
      echo "Requested port $requested is busy. Please free it or choose another." >&2
      return 2
    fi
    echo "$requested"; return 0
  fi

  if [[ -n "$env_port" ]]; then
    if port_in_use "$env_port"; then
      echo "Requested port (POH_PORT=$env_port) is busy. Please free it or choose another." >&2
      return 2
    fi
    echo "$env_port"; return 0
  fi

  if [[ -n "$preferred" ]]; then
    if ! port_in_use "$preferred"; then
      echo "$preferred"; return 0
    fi
  fi
  if [[ -n "$fallback" ]]; then
    if ! port_in_use "$fallback"; then
      echo "$fallback"; return 0
    fi
  fi

  echo "No available port found. Set POH_PORT or pass a custom port." >&2
  return 2
}

need_docker() {
  if ! command -v docker >/dev/null 2>&1; then
    echo "Docker is required but not found. Install Docker Desktop and try again." >&2
    exit 1
  fi
}

ensure_network() {
  if ! docker network ls --format '{{.Name}}' | grep -qx "${NETWORK}"; then
    docker network create "${NETWORK}" >/dev/null
  fi
}

is_running() {
  local name="$1"
  docker ps --filter "name=^/${name}$" --format '{{.Names}}' | grep -qx "${name}"
}

build_dev_image() {
  docker build -f Dockerfile.dev -t "${DEV_IMAGE}" .
}

build_prod_image() {
  docker build -t "${PROD_IMAGE_TAG}" .
}

dev_up() {
  ensure_network
  if ! docker image inspect "${DEV_IMAGE}" >/dev/null 2>&1; then
    build_dev_image
  fi
  local lan_flag="0"
  local port_cli=""
  # Parse optional flags: support --lan as either first or second arg; optional port is numeric
  for arg in "$@"; do
    case "$arg" in
      --lan) lan_flag="1" ;;
      *)
        if [[ -z "$port_cli" && "$arg" =~ ^[0-9]+$ ]]; then
          port_cli="$arg"
        fi
        ;;
    esac
  done

  # Allow env override for LAN publishing
  if [[ "${POH_LAN:-}" == "1" ]]; then
    lan_flag="1"
  fi

  local chosen_port
  if ! chosen_port=$(choose_port "${port_cli:-}" 5173 5174); then
    exit 2
  fi
  DEV_HOST_PORT="$chosen_port"
  if [[ "$DEV_HOST_PORT" != "5173" ]]; then
    echo "Using port $DEV_HOST_PORT (5173 was busy)."
  fi
  if [[ "$lan_flag" == "1" ]]; then
    echo "LAN mode enabled: publishing on 0.0.0.0:${DEV_HOST_PORT}"
    echo "Open from other devices: http://<your-lan-ip>:${DEV_HOST_PORT}/"
  fi
  docker run -it --init --name "${DEV_CONT}" \
    --network "${NETWORK}" \
    -p "$([[ "$lan_flag" == "1" ]] && echo "${DEV_HOST_PORT}:${DEV_CONT_PORT}" || echo "127.0.0.1:${DEV_HOST_PORT}:${DEV_CONT_PORT}")" \
    -v "${PWD}:/app" \
    -v /app/node_modules \
    -e CHOKIDAR_USEPOLLING=true \
    --rm "${DEV_IMAGE}" sh -lc "mkdir -p /app/node_modules \
      && cp -a /opt/node_modules_cache/. /app/node_modules/ 2>/dev/null || true \
      && HUSKY=0 CI=true pnpm install --strict-peer-dependencies=false --prefer-offline \
      && pnpm dev"
}

dev_down() {
  if is_running "${DEV_CONT}"; then
    docker stop "${DEV_CONT}" >/dev/null
  fi
}

prod_up() {
  ensure_network
  if ! docker image inspect "${PROD_IMAGE_TAG}" >/dev/null 2>&1; then
    build_prod_image
  fi
  local chosen_port
  if ! chosen_port=$(choose_port "${1:-}" 8080 8081); then
    exit 2
  fi
  PROD_HOST_PORT="$chosen_port"
  docker run -d --name "${PROD_CONT}" \
    --network "${NETWORK}" \
    -p "127.0.0.1:${PROD_HOST_PORT}:${PROD_CONT_PORT}" \
    --rm "${PROD_IMAGE_TAG}"
  echo "Prod-like container running at http://localhost:${PROD_HOST_PORT} (or http://127.0.0.1:${PROD_HOST_PORT})"
}

prod_down() {
  if is_running "${PROD_CONT}"; then
    docker stop "${PROD_CONT}" >/dev/null
  fi
}

status() {
  echo "Network: ${NETWORK}"
  docker network ls --filter name="^${NETWORK}$" || true
  echo
  echo "Images:"
  docker images | grep -E "(^REPOSITORY|${NAME_BASE})" || true
  echo
  echo "Containers (running):"
  docker ps --filter name="${NAME_BASE}" --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' || true
}

rebuild_all() {
  build_dev_image
  build_prod_image
}

# ---------- Quality commands (inside Docker) ----------
ensure_dev_image() {
  if ! docker image inspect "${DEV_IMAGE}" >/dev/null 2>&1; then
    build_dev_image
  fi
}

run_in_dev_container() {
  # Runs a command in a one-off dev container with project mounted.
  # Ensures deps are installed in an anonymous node_modules volume first.
  # $@: command to run (after ensuring pnpm install)
  ensure_network
  ensure_dev_image
  docker run -it --rm \
    --network "${NETWORK}" \
    -v "${PWD}:/app" \
    -v /app/node_modules \
    -e CI=true \
    -w /app \
    "${DEV_IMAGE}" \
    sh -lc "pnpm install --force && $*"
}

run_fix() {
  echo "Running pnpm fix inside Docker (format + lint autofix)..."
  run_in_dev_container pnpm fix
}

run_check() {
  echo "Running pre-commit checks inside Docker (pnpm precommit:all)..."
  run_in_dev_container pnpm precommit:all
}

run_prep() {
  echo "Running fix then check inside Docker..."
  run_in_dev_container "pnpm fix && pnpm precommit:all"
}

toggle_default() {
  if is_running "${DEV_CONT}"; then
    echo "Dev is running -> stopping..."
    dev_down
  else
    echo "Starting Dev Up..."
    dev_up
  fi
}

menu() {
  cat <<EOF
Pages of History PWA — Docker manager
  - Dev: prefers port 5173; fallback 5174
  - Prod: prefers port 8080; fallback 8081

Choose an action (press Enter for default = 0):
  0) Toggle Dev (up if down, down if up) [default]
  1) Dev Up (foreground, hot reload) [optional: port] [--lan]
  2) Dev Down
  3) Prod Up (detached, nginx) [optional: port]
  4) Prod Down
  5) Rebuild Images (dev + prod)
  6) Status
  7) Fix (pnpm fix)
  8) Check (pnpm precommit:all)
  9) Prep (fix then check) — use this to quickly prep a commit
EOF
  read -r -p "> " choice
  choice=${choice:-0}
  run_choice "$choice"
}

run_choice() {
  # Allow optional port as second argument
  local cmd="${1:-0}"
  shift || true
  # Collect remaining args (port or --lan)
  local extra_args=("$@")
  case "$cmd" in
    0) toggle_default ;;
    1) echo "Starting Dev Up..."; dev_up "${extra_args[@]}" ;;
    2) echo "Stopping Dev..."; dev_down ;;
    3) echo "Starting Prod Up..."; prod_up "${extra_args[@]:0:1}" ;;
    4) echo "Stopping Prod..."; prod_down ;;
    5) echo "Rebuilding images (dev + prod)..."; rebuild_all ;;
    6) status ;;
    7) run_fix ;;
    8) run_check ;;
    9) run_prep ;;
    dev-up) echo "Starting Dev Up..."; dev_up "${extra_args[@]}" ;;
    dev-down) echo "Stopping Dev..."; dev_down ;;
    prod-up) echo "Starting Prod Up..."; prod_up "${extra_args[@]:0:1}" ;;
    prod-down) echo "Stopping Prod..."; prod_down ;;
    rebuild) echo "Rebuilding images (dev + prod)..."; rebuild_all ;;
    status) status ;;
    fix) run_fix ;;
    check) run_check ;;
    prep) run_prep ;;
    help|-h|--help) menu ;;
    *) echo "Unknown option: $cmd" >&2; exit 2 ;;
  esac
}

main() {
  need_docker
  if [ $# -gt 0 ]; then
    # pass both option and optional port
    run_choice "${1:-}" "${2:-}"
  else
    menu
  fi
}

main "$@"
