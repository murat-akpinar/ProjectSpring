#!/bin/bash
set -e

# Start PostgreSQL using the official entrypoint in background
docker-entrypoint.sh postgres &
PG_PID=$!

# Wait for PostgreSQL to accept local connections (unix socket = trust auth)
echo "Waiting for PostgreSQL to start..."
for i in $(seq 1 30); do
    if pg_isready -U postgres > /dev/null 2>&1; then
        # Ensure password matches the environment variable on every startup
        psql -U postgres -c "ALTER USER ${POSTGRES_USER:-postgres} PASSWORD '${POSTGRES_PASSWORD:-postgres}';" > /dev/null 2>&1 && \
            echo "Password synced for user ${POSTGRES_USER:-postgres}" || true
        break
    fi
    sleep 1
done

# Hand control back to the PostgreSQL process
wait $PG_PID
