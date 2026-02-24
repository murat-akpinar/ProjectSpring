#!/bin/bash
set -e

PROJECT="projectspring"
COMPOSE="docker compose"

show_help() {
    echo "Usage: ./build.sh [OPTION]"
    echo ""
    echo "Options:"
    echo "  --full      Full rebuild: wipe everything (DB included), pull base images, rebuild"
    echo "  --app       Quick deploy: rebuild backend & frontend only, keep database intact"
    echo "  --pull      Pull latest base images only (no rebuild)"
    echo "  --down      Stop and remove all containers and volumes"
    echo "  --logs      Follow all container logs"
    echo "  --status    Show container status"
    echo "  -h, --help  Show this help"
    echo ""
    echo "Examples:"
    echo "  ./build.sh --full    # First time setup or clean slate"
    echo "  ./build.sh --app     # After code changes (most common)"
    echo "  ./build.sh --down    # Stop everything"
}

pull_images() {
    echo "[*] Pulling latest base images..."
    docker pull postgres:15-alpine
    docker pull node:20-alpine
    docker pull nginx:alpine
    docker pull eclipse-temurin:17-jdk-alpine 2>/dev/null || true
}

full_rebuild() {
    echo "============================================"
    echo "  FULL REBUILD (DB will be wiped!)"
    echo "============================================"
    echo ""

    echo "[1/5] Stopping all containers..."
    $COMPOSE down -v --remove-orphans 2>/dev/null || true

    echo ""
    echo "[2/5] Removing old images..."
    docker rmi ${PROJECT}-backend ${PROJECT}-frontend 2>/dev/null || true
    docker image prune -f 2>/dev/null || true

    echo ""
    echo "[3/5] Pulling base images..."
    pull_images

    echo ""
    echo "[4/5] Building (no cache)..."
    $COMPOSE build --no-cache

    echo ""
    echo "[5/5] Starting services..."
    $COMPOSE up -d

    show_status
}

app_deploy() {
    echo "============================================"
    echo "  QUICK DEPLOY (DB preserved)"
    echo "============================================"
    echo ""

    echo "[1/4] Stopping app containers..."
    $COMPOSE stop backend frontend 2>/dev/null || true
    $COMPOSE rm -f backend frontend 2>/dev/null || true

    echo ""
    echo "[2/4] Removing old app images..."
    docker rmi ${PROJECT}-backend ${PROJECT}-frontend 2>/dev/null || true

    echo ""
    echo "[3/4] Rebuilding (no cache)..."
    $COMPOSE build --no-cache backend frontend

    echo ""
    echo "[4/4] Starting services..."
    $COMPOSE up -d

    show_status
}

stop_all() {
    echo "[*] Stopping all containers and removing volumes..."
    $COMPOSE down -v --remove-orphans
    echo "Done."
}

show_status() {
    echo ""
    sleep 3
    echo "============================================"
    $COMPOSE ps
    echo "============================================"
    echo ""
    echo "Frontend : http://localhost"
    echo "Backend  : http://localhost:8081"
    echo "Database : localhost:5432"
    echo ""
    echo "Logs: ./build.sh --logs"
}

case "${1}" in
    --full)     full_rebuild ;;
    --app)      app_deploy ;;
    --pull)     pull_images ;;
    --down)     stop_all ;;
    --logs)     $COMPOSE logs -f ;;
    --status)   $COMPOSE ps ;;
    -h|--help)  show_help ;;
    *)          show_help ;;
esac
