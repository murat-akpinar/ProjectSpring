# Authentication & Security

## Overview

ProjectSpring uses a **hybrid authentication system** combining LDAP and local user authentication, secured with **JWT (JSON Web Tokens)** for stateless session management.

---

## Authentication Flow

```
Client                    Backend                     LDAP Server
  │                         │                              │
  ├─ POST /api/auth/login ─►│                              │
  │   {username, password}  │                              │
  │                         │                              │
  │                         ├── Check rate limit ──────────┤
  │                         │   (IP-based, Bucket4j)       │
  │                         │                              │
  │                         ├── Is LDAP enabled? ──────────┤
  │                         │   (check DB settings)        │
  │                         │                              │
  │                    [If LDAP enabled]                    │
  │                         ├── LDAP bind + search ───────►│
  │                         │                              │
  │                    [If LDAP succeeds]                   │
  │                         ├── Sync user to local DB      │
  │                         │                              │
  │                    [If LDAP fails or disabled]          │
  │                         ├── Check local user (BCrypt)  │
  │                         │                              │
  │                         ├── Record login attempt ──────┤
  │                         │                              │
  │                    [If auth succeeds]                   │
  │                         ├── Generate JWT token         │
  │◄── 200 {token, user} ──┤                              │
  │                         │                              │
  │                    [If auth fails]                      │
  │◄── 401 Unauthorized ───┤                              │
```

---

## JWT Token

### Token Structure
- **Algorithm**: HMAC-SHA256 (HS256)
- **Expiration**: 24 hours (configurable via `JWT_EXPIRATION`)
- **Claims**:
  - `sub`: username
  - `roles`: list of role names
  - `userId`: user ID
  - `iat`: issued at timestamp
  - `exp`: expiration timestamp

### Token Usage
Include the token in every API request:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbiIs...
```

### Token Validation
The `JwtAuthenticationFilter` intercepts every request:
1. Extracts token from `Authorization` header
2. Validates signature and expiration
3. Loads `UserDetails` from database
4. Sets `SecurityContext` for the request

---

## LDAP Authentication

### How It Works
1. Admin configures LDAP settings via the admin panel (stored in `ldap_settings` table)
2. LDAP password is encrypted with AES-256 before storage
3. When a user logs in, the system:
   - Reads LDAP config from the database (no restart needed)
   - Performs LDAP bind with admin credentials
   - Searches for the user using the configured filter
   - Attempts to bind with the user's credentials
   - If successful, syncs the user to the local `users` table

### LDAP Configuration Fields
| Field | Example | Description |
|-------|---------|-------------|
| URLs | `ldap://ldap-server:389` | LDAP server URL |
| Base | `dc=company,dc=com` | Base DN for searches |
| Username | `cn=admin,dc=company,dc=com` | Admin bind DN |
| Password | `adminpassword` | Admin bind password (AES-256 encrypted) |
| User Search Base | `ou=users` | OU to search within |
| User Search Filter | `(uid={0})` | Filter pattern (`{0}` = username) |
| Is Enabled | `true/false` | Toggle LDAP on/off |

### Security Measures
- LDAP injection prevention: Input sanitization on search filters
- Password never stored for LDAP users (only local users have passwords)
- LDAP admin password encrypted at rest with AES-256

---

## Local User Authentication

- Passwords are hashed with **BCrypt** before storage
- Admin can create local users via the admin panel or `/api/auth/register`
- LDAP users who are imported have `ldapDn` set and `password` as NULL

---

## Role-Based Access Control (RBAC)

### Role Hierarchy

```
ADMIN (Full Access)
  └── BIRIM_AMIRI (Department Head)
       └── Staff Roles (YAZILIMCI, DEVOPS, IS_ANALISTI, TESTCI)
```

### Permission Matrix

| Resource | ADMIN | BIRIM_AMIRI | Staff |
|----------|-------|-------------|-------|
| View all teams | ✅ | Only led teams | Only member teams |
| View all tasks | ✅ | Team tasks only | Assigned tasks only |
| Create tasks | ✅ | Own teams | Own teams |
| Edit any task | ✅ | Own team tasks | Own tasks only |
| Delete tasks | ✅ | Own team tasks | ❌ |
| View dashboards | ✅ All | Own teams | Own teams |
| Admin panel | ✅ | ❌ | ❌ |
| User management | ✅ | ❌ | ❌ |
| Team management | ✅ | ❌ | ❌ |
| LDAP settings | ✅ | ❌ | ❌ |
| View system logs | ✅ | ❌ | ❌ |
| View task logs | ✅ | ❌ | ❌ |
| System health | ✅ | ✅ | ❌ |
| Change own profile | ✅ | ✅ | ✅ |
| Change own password | ✅ | ✅ | ✅ |

### Available Roles
| Role | Description |
|------|-------------|
| `ADMIN` | Full system administrator with access to everything |
| `BIRIM_AMIRI` | Department head, can manage their team's tasks and members |
| `YAZILIMCI` | Software developer |
| `DEVOPS` | DevOps engineer |
| `IS_ANALISTI` | Business analyst |
| `TESTCI` | QA / Tester |

Users can have **multiple roles** (many-to-many relationship).

---

## Rate Limiting

### IP-Based Rate Limiting
- **Technology**: Bucket4j (token bucket algorithm)
- **Default limit**: 5 attempts per 15-minute window
- **Scope**: Login endpoint only
- **Configuration**:
  - `RATE_LIMIT_MAX_ATTEMPTS`: Max attempts per IP (default: 5)
  - `RATE_LIMIT_WINDOW_MINUTES`: Time window in minutes (default: 15)

### Account Lockout
- **Default threshold**: 10 failed attempts
- **Lockout duration**: 30 minutes
- **Configuration**:
  - `ACCOUNT_LOCKOUT_MAX_ATTEMPTS`: Max failed attempts (default: 10)
  - `ACCOUNT_LOCKOUT_DURATION_MINUTES`: Lockout duration (default: 30)

### Login Attempt Tracking
Every login attempt (success or failure) is recorded in the `login_attempts` table with:
- Username
- IP address
- Timestamp
- Success/failure flag

---

## Security Configuration

### Spring Security Filter Chain

```
Request
  │
  ├── CORS Filter (configured allowed origins)
  │
  ├── JwtAuthenticationFilter
  │   ├── Extract token from Authorization header
  │   ├── Validate token signature & expiration
  │   └── Set SecurityContext
  │
  ├── Authorization
  │   ├── /api/auth/** → permitAll
  │   ├── /health → permitAll
  │   ├── /api/admin/** → hasRole(ADMIN)
  │   └── /** → authenticated
  │
  └── Session: STATELESS (no server-side sessions)
```

### CORS Configuration
- Allowed origins configurable via `CORS_ALLOWED_ORIGINS` environment variable
- Default: `*` (all origins, development only)
- For production, set to specific frontend URL(s)

### Password Security
- **Local users**: BCrypt (Spring Security default, 10 rounds)
- **LDAP bind password**: AES-256 encryption (stored in `ldap_settings.password_encrypted`)
- **Encryption key**: Configurable via `ENCRYPTION_KEY` env var (minimum 32 characters)

---

## Encryption Service

The `EncryptionService` provides AES-256 encryption for sensitive data:

- **Algorithm**: AES/CBC/PKCS5Padding
- **Key derivation**: SHA-256 hash of the encryption key
- **Usage**: LDAP bind password encryption/decryption
- **Key management**: Set `ENCRYPTION_KEY` environment variable (minimum 32 characters)

> **Important**: Change the default encryption key in production!

---

## Automatic Logging (AOP)

The `LoggingAspect` automatically logs all controller method invocations:
- Method name and parameters
- Response status and timing
- **Sensitive data masking**: Passwords, tokens, and secrets are automatically masked in logs
- Logs are stored in the `system_logs` table with source `BACKEND`

### Excluded Endpoints

The following controllers are **excluded** from AOP logging to prevent unnecessary database writes and cascading failures:

| Controller | Reason |
|------------|--------|
| `HealthController` | Called every 30s by Docker health check — would flood `system_logs` |
| `SystemHealthController` | Same as above, detailed health endpoint |
| `SystemLogController` | Logging the log viewer would create infinite loops |
| `TaskLogController` | Logging the audit viewer would create noise |

### Fault Tolerance

Logging is wrapped in a `safeLog()` method that catches all exceptions. If the database is temporarily unavailable:
- The log write silently falls back to the console logger (`slf4j`)
- The original API response is **not affected** — users will not see errors caused by logging failures
- Once the database recovers, subsequent log writes resume automatically

This prevents a common cascading failure pattern where a database outage causes all API endpoints to fail because the AOP logging aspect cannot write to the database.
