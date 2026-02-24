#!/bin/bash
set -e

PROJECT="projectspring"
COMPOSE="docker compose"

echo "============================================"
echo "  ProjectSpring - Quick Deploy"
echo "  (Preserves database volume)"
echo "============================================"

echo ""
echo "[1/4] Stopping backend & frontend..."
$COMPOSE stop backend frontend 2>/dev/null || true
$COMPOSE rm -f backend frontend 2>/dev/null || true

echo ""
echo "[2/4] Removing old app images..."
docker rmi ${PROJECT}-backend ${PROJECT}-frontend 2>/dev/null || true

echo ""
echo "[3/4] Rebuilding app images..."
$COMPOSE build --no-cache backend frontend

echo ""
echo "[4/4] Starting all services..."
$COMPOSE up -d

echo ""
echo "============================================"
echo "  Deploy complete!"
echo "============================================"
echo ""

sleep 5
$COMPOSE ps

echo ""
echo "Frontend : http://localhost"
echo "Backend  : http://localhost:8081"
echo ""
echo "Logs: docker compose logs -f backend"
