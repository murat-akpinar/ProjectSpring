# Deployment Guide

## Docker Deployment (Recommended)

### Prerequisites
- Docker Engine 20+
- Docker Compose v2+

### Quick Start

```bash
git clone <repository-url>
cd ProjectSpring
chmod +x build.sh
./build.sh --full
```

### Build Script (`build.sh`)

| Command | Description |
|---------|-------------|
| `./build.sh --full` | Full rebuild: wipe everything (DB included), pull base images, build from scratch |
| `./build.sh --app` | Quick deploy: rebuild backend & frontend only, **keep database intact** |
| `./build.sh --fix-db` | Fix PostgreSQL password mismatch without losing data |
| `./build.sh --pull` | Pull latest base images only |
| `./build.sh --down` | Stop and remove all containers and volumes |
| `./build.sh --logs` | Follow all container logs |
| `./build.sh --status` | Show container status |

> Most common usage after code changes: `./build.sh --app`

This starts three containers:
| Container | Port | Description |
|-----------|------|-------------|
| `projectspring-db` | 127.0.0.1:5432 | PostgreSQL 15 database (localhost only) |
| `projectspring-backend` | 8081 → 8080 | Spring Boot API |
| `projectspring-frontend` | 80 | React app (Nginx) |

**Access the application:**
- Frontend: http://localhost (port 80)
- Backend API: http://localhost:8081
- Database: `localhost:5432` (user: `postgres`, password: `postgres`)

> Database tables are automatically created via Liquibase migrations on first startup.

---

## Environment Variables

### Required for Production

Create a `.env` file in the project root:

```env
# JWT Configuration (MUST change in production)
JWT_SECRET=your-very-long-secret-key-at-least-256-bits-for-hs256-algorithm
JWT_EXPIRATION=86400000

# Encryption Key (MUST change in production, min 32 chars)
ENCRYPTION_KEY=your-production-encryption-key-minimum-32-characters

# CORS (set to your frontend URL in production)
CORS_ALLOWED_ORIGINS=https://your-domain.com
```

### All Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| **Database** | | |
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_NAME` | `projectspring` | Database name |
| `DB_USER` | `postgres` | Database user |
| `DB_PASSWORD` | `postgres` | Database password |
| **JWT** | | |
| `JWT_SECRET` | `your-secret-key-...` | JWT signing secret (min 256 bits) |
| `JWT_EXPIRATION` | `86400000` | Token expiration in ms (24 hours) |
| **Security** | | |
| `ENCRYPTION_KEY` | `default-encryption-...` | AES-256 encryption key (min 32 chars) |
| `CORS_ALLOWED_ORIGINS` | `*` | Allowed CORS origins (comma-separated) |
| `RATE_LIMIT_MAX_ATTEMPTS` | `5` | Max login attempts per IP per window |
| `RATE_LIMIT_WINDOW_MINUTES` | `15` | Rate limit time window |
| `ACCOUNT_LOCKOUT_MAX_ATTEMPTS` | `10` | Max failed attempts before lockout |
| `ACCOUNT_LOCKOUT_DURATION_MINUTES` | `30` | Lockout duration |
| **Connection Pool (HikariCP)** | | |
| `HIKARI_MAX_POOL_SIZE` | `20` | Maximum database connections in the pool |
| `HIKARI_MIN_IDLE` | `5` | Minimum idle connections maintained |
| **Log Retention** | | |
| `LOG_RETENTION_SYSTEM_DAYS` | `30` | Days to keep system logs before auto-cleanup |
| `LOG_RETENTION_TASK_DAYS` | `90` | Days to keep task audit logs before auto-cleanup |
| **Application** | | |
| `SERVER_PORT` | `8080` | Backend server port |
| `FRONTEND_URL` | `http://frontend:80` | Frontend URL (for health checks) |
| `SEED_SAMPLE_DATA` | `0` | Set to `1` to seed sample data on startup |
| `SHOW_SQL` | `false` | Show SQL queries in logs |
| `LOG_LEVEL` | `INFO` | Application log level |
| `SECURITY_LOG_LEVEL` | `DEBUG` | Spring Security log level |

---

## Docker Compose Services

### PostgreSQL
```yaml
postgres:
  image: postgres:15-alpine
  entrypoint: ["/bin/bash", "/entrypoint-wrapper.sh"]
  environment:
    POSTGRES_DB: projectspring
    POSTGRES_USER: postgres
    POSTGRES_PASSWORD: postgres
  ports:
    - "127.0.0.1:5432:5432"
  volumes:
    - postgres_data:/var/lib/postgresql/data
    - ./db/entrypoint-wrapper.sh:/entrypoint-wrapper.sh:ro
    - ./db/init:/docker-entrypoint-initdb.d:ro
  shm_size: '256mb'
  restart: unless-stopped
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U postgres && PGPASSWORD=postgres psql -U postgres -d projectspring -c 'SELECT 1' > /dev/null 2>&1"]
    interval: 10s
```

Key settings:
- **Custom entrypoint wrapper** (`db/entrypoint-wrapper.sh`) — Runs `ALTER USER ... PASSWORD` on every container start, ensuring the password always matches the `POSTGRES_PASSWORD` environment variable. This permanently solves the Docker volume password desync issue.
- **Auth-aware healthcheck** — Validates not just that PostgreSQL is ready (`pg_isready`), but also that password authentication actually works. If the password is wrong, the healthcheck fails and Docker restarts the container.
- **Init scripts** (`db/init/01-setup.sql`) — Runs on first volume creation to set up extensions and ensure correct initial password.
- `127.0.0.1:5432:5432` — Database port only accessible from localhost, not from the network.
- `shm_size: '256mb'` — Prevents shared memory errors under heavy queries.
- `restart: unless-stopped` — Auto-restarts the container on crash or host reboot.

### Backend
- Builds from `./Backend/Dockerfile`
- Depends on PostgreSQL being healthy
- Health check: `GET /health` every 30 seconds, 90s startup grace period
- Internal port: 8080, mapped to host port 8081
- `restart: unless-stopped` — Auto-restarts on crash

### Frontend
- Builds from `./Frontend/Dockerfile`
- Depends on both PostgreSQL and Backend being healthy
- Nginx serves the React build on port 80
- `restart: unless-stopped` — Auto-restarts on crash

---

## Horizontal Scaling

The stateless JWT architecture enables horizontal scaling of backend instances:

```bash
docker-compose up -d --scale backend=3
```

For production scaling, uncomment the Nginx load balancer section in `docker-compose.yml`:

```yaml
nginx:
  image: nginx:alpine
  container_name: projectspring-nginx
  ports:
    - "8000:80"
  volumes:
    - ./nginx.conf:/etc/nginx/nginx.conf:ro
  depends_on:
    - backend
    - frontend
```

> Since JWT tokens are self-contained and stateless, no sticky sessions or shared session store is needed.

---

## LDAP Test Environment

A built-in LDAP test environment is available in the `ldap_test/` directory:

```bash
# Start LDAP test server (from project root)
cd ldap_test
docker-compose up -d

# Add test users
docker exec ldap-test bash /init-users.sh
```

| Service | Port | Credentials |
|---------|------|-------------|
| LDAP Server | 389 | `cn=admin,dc=test,dc=local` / `admin123` |
| phpLDAPadmin | 8082 | Same as above |

**Test Users:**
| Username | Password |
|----------|----------|
| `ldap_user1` | `ldappass123` |
| `ldap_user2` | `ldappass123` |
| `testuser1` | `testpass123` |
| `testuser2` | `testpass123` |
| `adminuser` | `adminpass123` |

Configure in admin panel:
- URLs: `ldap://ldap-test:389`
- Base: `dc=test,dc=local`
- Username: `cn=admin,dc=test,dc=local`
- Password: `admin123`
- User Search Base: `ou=users,dc=test,dc=local`
- User Search Filter: `(uid={0})`

---

## Sample Data Seeding

To populate the database with test data:

1. Set `SEED_SAMPLE_DATA=1` in your `.env` file
2. Restart the backend: `docker-compose restart backend`

This creates:
- 5 users per team (1 department head + 4 staff)
- Department heads automatically assigned as team leaders
- 15-35 tasks per month for the current year
- 5 sample projects
- Subtasks on ~30% of tasks

> Sample data is only seeded once. Existing data prevents re-seeding.

---

## Connection Pool (HikariCP)

The backend uses HikariCP for database connection pooling with the following defaults:

| Setting | Value | Description |
|---------|-------|-------------|
| `maximum-pool-size` | 20 | Max simultaneous database connections |
| `minimum-idle` | 5 | Connections kept ready even when idle |
| `connection-timeout` | 20s | How long to wait for a connection from the pool |
| `idle-timeout` | 5 min | Idle connections are closed after this period |
| `max-lifetime` | 10 min | Connections are recycled after this period |
| `keepalive-time` | 60s | Probe interval to detect dead connections |
| `connection-test-query` | `SELECT 1` | Validates connections before use |
| `leak-detection-threshold` | 30s | Logs a warning if a connection is held longer than this |

Additional resilience settings:
- `initialization-fail-timeout: -1` — The application starts even if the database is initially unavailable. HikariCP will keep retrying in the background until a connection succeeds.
- `register-mbeans: true` — Exposes pool metrics via JMX for monitoring.

These settings ensure:
- Dead or stale connections are detected and replaced automatically
- Connection leaks are logged for debugging
- The pool recovers gracefully after temporary database outages
- The application survives PostgreSQL restarts without manual intervention

---

## Troubleshooting

### PostgreSQL Password Authentication Failed

**Symptom**: Backend logs show `FATAL: password authentication failed for user "postgres"` even though the password in `docker-compose.yml` is correct.

**Root Cause**: PostgreSQL's `POSTGRES_PASSWORD` environment variable is **only applied during the initial database setup** (when the data volume is first created). If the volume already contains data from a previous run, the password stored in the volume takes precedence over the environment variable.

**Permanent Fix (Already Applied)**: The custom entrypoint wrapper (`db/entrypoint-wrapper.sh`) runs `ALTER USER ... PASSWORD` on every container start, syncing the password with the environment variable. This should prevent this issue from recurring.

**If it still happens** (e.g., running an old image without the wrapper):
```bash
# Quick fix (preserves data)
./build.sh --fix-db

# Or manually:
docker exec -it projectspring-db psql -U postgres -c "ALTER USER postgres PASSWORD 'postgres';"
docker compose restart backend

# Nuclear option (loses all data)
./build.sh --full
```

### Backend Freezing / All Requests Timeout

**Symptom**: The application works initially but then all requests start timing out or "freezing."

**Possible Causes**:
1. **Connection pool exhaustion**: All HikariCP connections are in use or dead. Check backend logs for `HikariPool-1 - Connection is not available` errors.
2. **Database connectivity lost**: PostgreSQL container crashed or became unresponsive. Check with `docker compose ps` and `docker logs projectspring-db`.
3. **Cascading failure from AOP logging**: If the `LoggingAspect` fails to write logs, it could block API responses. (Fixed: logging now fails gracefully to console.)

**Diagnosis**:
```bash
# Check container health status
docker compose ps

# Check backend logs for connection pool errors
docker logs projectspring-backend 2>&1 | grep -i "hikari\|connection\|pool\|timeout"

# Check PostgreSQL logs
docker logs projectspring-db 2>&1 | grep -i "fatal\|error\|connection"

# Check if PostgreSQL is accepting connections
docker exec -it projectspring-db pg_isready -U postgres
```

### Health Check Causing Excessive Database Load

**Symptom**: `system_logs` table grows rapidly with health check entries; database load is unexpectedly high.

**Root Cause (Fixed)**: The `LoggingAspect` was intercepting `HealthController` and `SystemHealthController` endpoints, writing a database record for every Docker health check probe (every 10-30 seconds).

**Fix**: `HealthController` and `SystemHealthController` are now excluded from AOP logging. If you are running an older version, update the `LoggingAspect.java` pointcut expression to exclude these controllers.

### Container Keeps Restarting

**Symptom**: `docker compose ps` shows a container with status `Restarting`.

**Diagnosis**:
```bash
# Check the exit code and logs
docker logs --tail 50 projectspring-backend

# If the container is restarting due to health check failures,
# increase the start_period in docker-compose.yml
```

---

## Production Checklist

- [ ] Change `JWT_SECRET` to a strong, unique secret (min 256 bits)
- [ ] Change `ENCRYPTION_KEY` to a strong key (min 32 characters)
- [ ] Change default admin password after first login
- [ ] Set `CORS_ALLOWED_ORIGINS` to your frontend domain
- [ ] Change default PostgreSQL credentials
- [ ] Set `SEED_SAMPLE_DATA=0` (or don't set it at all)
- [ ] Set `SHOW_SQL=false`
- [ ] Set `LOG_LEVEL=WARN` or `INFO`
- [ ] Set `SECURITY_LOG_LEVEL=WARN`
- [ ] Configure HTTPS (TLS termination at reverse proxy)
- [ ] Set up database backups
- [ ] Monitor application health via `/api/admin/health`
- [ ] Tune `HIKARI_MAX_POOL_SIZE` based on expected concurrent users
- [ ] Verify `restart: unless-stopped` is set for all services
