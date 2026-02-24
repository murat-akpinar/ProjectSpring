# Architecture

## Tech Stack

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Java | 17 | Runtime |
| Spring Boot | 3.2.0 | Application framework |
| Spring Security | 6.x | Authentication & authorization |
| Spring Data JPA | 3.x | ORM / Data access |
| Hibernate | 6.x | JPA implementation |
| PostgreSQL | 15 | Relational database |
| HikariCP | 5.x | JDBC connection pool (with keepalive & leak detection) |
| Liquibase | Latest | Database migrations |
| jjwt | 0.12.3 | JWT token generation & validation |
| Bucket4j | 8.7.0 | Rate limiting |
| Spring LDAP | 3.x | LDAP integration |
| Lombok | Latest | Boilerplate reduction |
| Spring AOP | 3.x | Cross-cutting concerns (logging) |
| Maven | 3.x | Build tool & dependency management |

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 | UI framework |
| TypeScript | Type safety |
| Vite | Build tool & dev server |
| React Router | Client-side routing |
| Axios | HTTP client |
| date-fns | Date utilities |

### Infrastructure
| Technology | Purpose |
|------------|---------|
| Docker & Docker Compose | Containerization |
| Nginx | Reverse proxy / load balancer (optional) |
| PostgreSQL 15 Alpine | Database container |

---

## Project Structure

```
ProjectSpring/
├── Backend/
│   ├── src/main/java/com/projectspring/
│   │   ├── config/              # Configuration classes
│   │   │   ├── SecurityConfig.java      # Spring Security filter chain, CORS, BCrypt
│   │   │   └── JwtConfig.java           # JWT secret validation on startup
│   │   ├── controller/          # REST API controllers
│   │   │   ├── AuthController.java      # Login, register, current user
│   │   │   ├── AdminController.java     # Admin CRUD (users, teams, roles)
│   │   │   ├── TaskController.java      # Task CRUD and status updates
│   │   │   ├── ProjectController.java   # Project CRUD
│   │   │   ├── TeamController.java      # Team listing
│   │   │   ├── DashboardController.java # Dashboard statistics
│   │   │   ├── CalendarController.java  # Calendar data by year/month
│   │   │   ├── UserProfileController.java # User profile & password
│   │   │   ├── LdapSettingsController.java # LDAP configuration
│   │   │   ├── LdapImportController.java   # LDAP user search & import
│   │   │   ├── SystemLogController.java    # System log viewing
│   │   │   ├── TaskLogController.java      # Task audit log viewing
│   │   │   ├── HealthController.java       # Basic health check
│   │   │   └── SystemHealthController.java # Detailed system health
│   │   ├── dto/                 # Data Transfer Objects (36 DTOs)
│   │   │   ├── LoginRequest.java / LoginResponse.java
│   │   │   ├── CreateTaskRequest.java / TaskDTO.java
│   │   │   ├── CreateProjectRequest.java / ProjectDTO.java
│   │   │   ├── CreateUserRequest.java / UserDTO.java
│   │   │   ├── CreateTeamRequest.java / TeamDTO.java
│   │   │   ├── DashboardStatsDTO.java / DashboardDetailsDTO.java
│   │   │   ├── SystemLogDTO.java / TaskLogDTO.java
│   │   │   ├── LdapSettingsDTO.java / LdapUserDTO.java
│   │   │   └── ... (and more)
│   │   ├── model/               # JPA Entity classes
│   │   │   ├── User.java
│   │   │   ├── Team.java
│   │   │   ├── Task.java
│   │   │   ├── Project.java
│   │   │   ├── Subtask.java
│   │   │   ├── RoleEntity.java
│   │   │   ├── TaskStatusHistory.java
│   │   │   ├── TaskLog.java
│   │   │   ├── SystemLog.java
│   │   │   ├── LoginAttempt.java
│   │   │   ├── LdapSettings.java
│   │   │   └── enums/
│   │   │       ├── TaskStatus.java    # OPEN, IN_PROGRESS, TESTING, COMPLETED, POSTPONED, CANCELLED, OVERDUE
│   │   │       ├── TaskType.java      # TASK, FEATURE, BUG, IMPROVEMENT, RESEARCH, DOCUMENTATION, TEST, MAINTENANCE, MEETING
│   │   │       ├── Priority.java      # NORMAL, HIGH, URGENT
│   │   │       ├── ProjectStatus.java # ACTIVE, COMPLETED, ON_HOLD, CANCELLED
│   │   │       └── Role.java          # ADMIN, BIRIM_AMIRI, YAZILIMCI, DEVOPS, IS_ANALISTI, TESTCI
│   │   ├── repository/          # Spring Data JPA repositories
│   │   ├── service/             # Business logic services
│   │   ├── security/            # JWT filter, entry point
│   │   │   ├── JwtAuthenticationFilter.java
│   │   │   └── JwtAuthenticationEntryPoint.java
│   │   └── aspect/              # AOP aspects
│   │       └── LoggingAspect.java     # Automatic controller method logging
│   ├── src/main/resources/
│   │   ├── application.yml              # Main configuration
│   │   └── db/changelog/
│   │       ├── db.changelog-master.xml  # Liquibase master changelog
│   │       └── changes/                 # Individual migration files (V1-V17)
│   ├── Dockerfile
│   └── pom.xml
├── Frontend/
│   ├── src/
│   ├── Dockerfile
│   └── package.json
├── ldap_test/                   # LDAP test environment
│   ├── docker-compose.yml
│   ├── init-users.sh
│   └── README.md
├── docker-compose.yml           # Main Docker Compose
├── docs/                        # This documentation
├── todo/                        # Development planning
└── README.md
```

---

## Design Patterns & Principles

### Layered Architecture
The backend follows a strict layered architecture:

```
Controller (REST API) → Service (Business Logic) → Repository (Data Access) → Database
     ↑                       ↑                          ↑
   DTOs                   Entities                 JPA Queries
```

- **Controllers** handle HTTP requests, input validation, and response formatting
- **Services** contain all business logic, authorization checks, and entity-DTO mapping
- **Repositories** extend `JpaRepository` with custom JPQL/native queries

### Key Design Decisions

1. **Stateless Authentication (JWT)**: No server-side sessions. Each request carries a JWT token, enabling horizontal scaling without sticky sessions.

2. **Soft Delete**: Users and Teams use an `isActive` boolean flag instead of hard delete, preserving referential integrity and audit trails.

3. **Database-Driven LDAP Config**: LDAP settings are stored in the database (not config files), allowing runtime changes without restarting the application.

4. **Hybrid Auth**: LDAP authentication is tried first; if it fails or is disabled, local user authentication is attempted. This allows mixed environments.

5. **AES-256 Encrypted Secrets**: Sensitive data like LDAP passwords are encrypted at rest using AES-256 before being stored in the database.

6. **Liquibase Migrations**: All schema changes are version-controlled through Liquibase XML changelogs, ensuring repeatable deployments.

7. **Smart AOP Logging**: The `LoggingAspect` uses a selective logging strategy — only **write operations** (POST/PUT/DELETE) and **errors** are persisted to the database. Read-only requests (GET) are logged to console only at DEBUG level. Health check endpoints are excluded entirely. Logging failures are handled gracefully — if the database is unavailable, log writes fail silently to the console logger without affecting the actual API response. A `LogCleanupService` automatically purges old entries (system logs: 30 days, task logs: 90 days).

8. **Rate Limiting**: IP-based rate limiting using Bucket4j to prevent brute-force attacks, combined with account lockout after repeated failures.

9. **Connection Pool (HikariCP)**: The database connection pool is configured with keepalive probes, connection validation, and leak detection to ensure resilient database connectivity. Dead connections are automatically evicted and replaced.

---

## Entity Relationship Overview

```
User ──M:N── RoleEntity        (user_roles join table)
User ──M:N── Team              (user_teams join table)
Team ──1:N── Task
Team ──1:1── User (leader)
Task ──M:1── User (createdBy)
Task ──M:N── User (assignees)  (task_assignees join table)
Task ──1:N── Subtask
Task ──1:N── TaskStatusHistory
Task ──M:1── Project (optional)
Project ──M:N── Team           (project_teams join table)
Project ──M:1── User (createdBy)
Subtask ──M:1── User (assignee, optional)
TaskStatusHistory ──M:1── User (changedBy)
TaskLog ──M:1── Task (nullable, preserved on delete)
TaskLog ──M:1── User (changedBy)
SystemLog ──M:1── User (optional)
```

---

## Service Layer Summary

| Service | Responsibility |
|---------|---------------|
| `TaskService` | Task CRUD, filtering by team/year/month/project, status transitions, overdue detection |
| `ProjectService` | Project CRUD, team assignments, task linking |
| `TeamService` | Team retrieval, access control checks |
| `UserService` | User profile updates, password changes |
| `AdminService` | Admin operations: user/team/role CRUD, soft delete |
| `LdapAuthService` | LDAP authentication, hybrid auth (LDAP → Local fallback) |
| `LdapSettingsService` | LDAP config management with AES-256 encryption |
| `LdapImportService` | Search LDAP directory, import users into local DB |
| `JwtService` | JWT token generation, validation, claims extraction |
| `UserDetailsServiceImpl` | Spring Security `UserDetailsService` implementation |
| `DashboardService` | Team statistics, leaderboard data, progress metrics |
| `RoleService` | Role CRUD operations |
| `SystemLogService` | System log recording and querying (backend + frontend) |
| `TaskLogService` | Task operation audit logging |
| `LoginAttemptService` | Rate limiting, account lockout tracking |
| `SystemHealthService` | Health checks for backend, database, and frontend |
| `EncryptionService` | AES-256 encrypt/decrypt for sensitive data |
| `LogCleanupService` | Scheduled job to purge old system_logs (30d) and task_logs (90d) |
| `OverdueTaskService` | Scheduled job to detect and mark overdue tasks |
