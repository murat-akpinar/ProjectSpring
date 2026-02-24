# Deployment Guide

## Docker Deployment (Recommended)

### Prerequisites
- Docker Engine 20+
- Docker Compose v2+

### Quick Start

```bash
git clone <repository-url>
cd ProjectSpring
docker-compose up -d
```

This starts three containers:
| Container | Port | Description |
|-----------|------|-------------|
| `projectspring-db` | 5432 | PostgreSQL 15 database |
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
  environment:
    POSTGRES_DB: projectspring
    POSTGRES_USER: postgres
    POSTGRES_PASSWORD: postgres
  ports:
    - "5432:5432"
  volumes:
    - postgres_data:/var/lib/postgresql/data
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U postgres"]
    interval: 10s
```

### Backend
- Builds from `./Backend/Dockerfile`
- Depends on PostgreSQL being healthy
- Health check: `GET /health` every 10 seconds, 60s startup grace period
- Internal port: 8080, mapped to host port 8081

### Frontend
- Builds from `./Frontend/Dockerfile`
- Depends on both PostgreSQL and Backend being healthy
- Nginx serves the React build on port 80

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
