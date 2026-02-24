#!/bin/bash
set -e

PROJECT="projectspring"
COMPOSE="docker compose"

echo "============================================"
echo "  ProjectSpring - Full Rebuild"
echo "============================================"

echo ""
echo "[1/5] Stopping running containers..."
$COMPOSE down -v --remove-orphans 2>/dev/null || true

echo ""
echo "[2/5] Removing old project images..."
docker rmi ${PROJECT}-backend ${PROJECT}-frontend 2>/dev/null || true
docker image prune -f 2>/dev/null || true

echo ""
echo "[3/5] Pulling latest base images..."
docker pull postgres:15-alpine
docker pull node:20-alpine
docker pull nginx:alpine
docker pull maven:3.9-eclipse-temurin-17-alpine 2>/dev/null || docker pull eclipse-temurin:17-jdk-alpine

echo ""
echo "[4/5] Building fresh images (no cache)..."
$COMPOSE build --no-cache

echo ""
echo "[5/5] Starting all services..."
$COMPOSE up -d

echo ""
echo "============================================"
echo "  Build complete! Waiting for services..."
echo "============================================"
echo ""

sleep 5
$COMPOSE ps

echo ""
echo "Frontend : http://localhost"
echo "Backend  : http://localhost:8081"
echo "Database : localhost:5432"
echo ""
echo "Logs: docker compose logs -f"
