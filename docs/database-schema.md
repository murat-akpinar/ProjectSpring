# Database Schema

## Overview

ProjectSpring uses **PostgreSQL 15** as its database, with **Liquibase** managing all schema migrations. The database is automatically created and migrated when the application starts.

---

## Tables

### `users`

Stores all application users (both LDAP-imported and locally created).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | BIGSERIAL | NO | auto | Primary key |
| `username` | VARCHAR(100) | NO | — | Unique username |
| `email` | VARCHAR(255) | NO | — | Unique email address |
| `full_name` | VARCHAR(255) | NO | — | Display name |
| `ldap_dn` | VARCHAR(500) | YES | NULL | LDAP Distinguished Name (NULL for local users) |
| `password` | VARCHAR(255) | YES | NULL | BCrypt-hashed password (NULL for LDAP users) |
| `is_active` | BOOLEAN | NO | true | Soft delete flag |
| `created_at` | TIMESTAMP | NO | now() | Creation timestamp |
| `updated_at` | TIMESTAMP | NO | now() | Last update timestamp |

**Unique constraints**: `username`, `email`

---

### `roles`

Role definitions for the authorization system.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | BIGSERIAL | NO | auto | Primary key |
| `name` | VARCHAR(50) | NO | — | Unique role name |
| `description` | VARCHAR(255) | YES | NULL | Human-readable description |
| `created_at` | TIMESTAMP | NO | now() | Creation timestamp |

**Unique constraints**: `name`

**Default roles (seeded by V2 migration)**:
| Name | Description |
|------|-------------|
| `ADMIN` | Full system administrator |
| `BIRIM_AMIRI` | Department head / team leader |
| `YAZILIMCI` | Software developer |
| `DEVOPS` | DevOps engineer |
| `IS_ANALISTI` | Business analyst |
| `TESTCI` | QA / Tester |

---

### `teams`

Departments / organizational units.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | BIGSERIAL | NO | auto | Primary key |
| `name` | VARCHAR(100) | NO | — | Unique team name |
| `description` | VARCHAR(500) | YES | NULL | Team description |
| `leader_id` | BIGINT | YES | NULL | FK → `users.id` (team leader) |
| `is_active` | BOOLEAN | NO | true | Soft delete flag |
| `color` | VARCHAR(7) | YES | NULL | Hex color code (e.g., `#89b4fa`) |
| `icon` | VARCHAR(50) | YES | NULL | Emoji icon (e.g., `💻`) |
| `created_at` | TIMESTAMP | NO | now() | Creation timestamp |
| `updated_at` | TIMESTAMP | NO | now() | Last update timestamp |

**Unique constraints**: `name`

**Default teams (seeded by V2/V17 migrations)**:
| Name | Icon | Color |
|------|------|-------|
| Sistem Birimi | 🖥️ | #89b4fa |
| Network Birimi | 🌐 | #a6e3a1 |
| Some Birimi | 📡 | #f9e2af |
| Yazılım Birimi | 💻 | #cba6f7 |
| Test Birimi | 🧪 | #f38ba8 |

---

### `tasks`

Core task/work item records.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | BIGSERIAL | NO | auto | Primary key |
| `title` | VARCHAR(255) | NO | — | Task title |
| `content` | TEXT | YES | NULL | Detailed description |
| `start_date` | DATE | NO | — | Task start date |
| `end_date` | DATE | NO | — | Task due date |
| `status` | VARCHAR(20) | NO | `OPEN` | Task status (enum) |
| `task_type` | VARCHAR(20) | NO | `TASK` | Task type (enum) |
| `priority` | VARCHAR(20) | NO | `NORMAL` | Priority level (enum) |
| `team_id` | BIGINT | NO | — | FK → `teams.id` |
| `project_id` | BIGINT | YES | NULL | FK → `projects.id` |
| `created_by` | BIGINT | NO | — | FK → `users.id` |
| `postponed_to_date` | DATE | YES | NULL | New date after postponement |
| `postponed_from_date` | DATE | YES | NULL | Original date before postponement |
| `is_postponed` | BOOLEAN | NO | false | Whether task has been postponed |
| `created_at` | TIMESTAMP | NO | now() | Creation timestamp |
| `updated_at` | TIMESTAMP | NO | now() | Last update timestamp |

**Status values**: `OPEN`, `IN_PROGRESS`, `TESTING`, `COMPLETED`, `POSTPONED`, `CANCELLED`, `OVERDUE`

**Task type values**: `TASK`, `FEATURE`, `BUG`, `IMPROVEMENT`, `RESEARCH`, `DOCUMENTATION`, `TEST`, `MAINTENANCE`, `MEETING`

**Priority values**: `NORMAL`, `HIGH`, `URGENT`

---

### `subtasks`

Child tasks belonging to a parent task.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | BIGSERIAL | NO | auto | Primary key |
| `task_id` | BIGINT | NO | — | FK → `tasks.id` |
| `title` | VARCHAR(255) | NO | — | Subtask title |
| `content` | TEXT | YES | NULL | Subtask description |
| `start_date` | DATE | YES | NULL | Subtask start date |
| `end_date` | DATE | YES | NULL | Subtask due date |
| `assignee_id` | BIGINT | YES | NULL | FK → `users.id` |
| `is_completed` | BOOLEAN | NO | false | Completion flag |
| `created_at` | TIMESTAMP | NO | now() | Creation timestamp |
| `updated_at` | TIMESTAMP | NO | now() | Last update timestamp |

---

### `projects`

Project containers that group tasks across teams.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | BIGSERIAL | NO | auto | Primary key |
| `name` | VARCHAR(255) | NO | — | Project name |
| `description` | TEXT | YES | NULL | Project description |
| `start_date` | DATE | YES | NULL | Project start date |
| `end_date` | DATE | YES | NULL | Project deadline |
| `status` | VARCHAR(20) | NO | `ACTIVE` | Project status (enum) |
| `created_by` | BIGINT | NO | — | FK → `users.id` |
| `created_at` | TIMESTAMP | NO | now() | Creation timestamp |
| `updated_at` | TIMESTAMP | NO | now() | Last update timestamp |

**Status values**: `ACTIVE`, `COMPLETED`, `ON_HOLD`, `CANCELLED`

---

### `task_status_history`

Audit trail for task status changes.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | BIGSERIAL | NO | auto | Primary key |
| `task_id` | BIGINT | NO | — | FK → `tasks.id` |
| `old_status` | VARCHAR(20) | YES | NULL | Previous status (NULL for creation) |
| `new_status` | VARCHAR(20) | NO | — | New status value |
| `changed_by` | BIGINT | NO | — | FK → `users.id` |
| `change_reason` | VARCHAR(500) | YES | NULL | Optional reason for the change |
| `postponed_to_date` | DATE | YES | NULL | New date (for POSTPONED transitions) |
| `created_at` | TIMESTAMP | NO | now() | When the change occurred |

---

### `task_logs`

Comprehensive audit log for all task operations.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | BIGSERIAL | NO | auto | Primary key |
| `task_id` | BIGINT | YES | NULL | FK → `tasks.id` (nullable for deleted tasks) |
| `task_title` | VARCHAR(255) | YES | NULL | Preserved title (survives task deletion) |
| `action` | VARCHAR(50) | NO | — | Operation type |
| `old_value` | TEXT | YES | NULL | Previous state (JSON) |
| `new_value` | TEXT | YES | NULL | New state (JSON) |
| `changed_by` | BIGINT | NO | — | FK → `users.id` |
| `change_reason` | VARCHAR(500) | YES | NULL | Optional reason |
| `created_at` | TIMESTAMP | NO | now() | When the action occurred |

**Action values**: `CREATED`, `UPDATED`, `DELETED`, `STATUS_CHANGED`, `ASSIGNEE_ADDED`, `ASSIGNEE_REMOVED`

**Indexes**: `task_id`, `changed_by`, `action`, `created_at`

---

### `system_logs`

Application-level logging from both backend and frontend.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | BIGSERIAL | NO | auto | Primary key |
| `level` | VARCHAR(20) | NO | — | Log level |
| `message` | TEXT | NO | — | Log message |
| `source` | VARCHAR(20) | NO | — | Origin system |
| `user_id` | BIGINT | YES | NULL | FK → `users.id` |
| `ip_address` | VARCHAR(45) | YES | NULL | Client IP (supports IPv6) |
| `endpoint` | VARCHAR(255) | YES | NULL | API endpoint path |
| `exception` | TEXT | YES | NULL | Exception stack trace |
| `created_at` | TIMESTAMP | NO | now() | When the log was recorded |

**Level values**: `INFO`, `WARN`, `ERROR`, `DEBUG`

**Source values**: `BACKEND`, `FRONTEND`

**Indexes**: `source`, `level`, `created_at`, `user_id`

---

### `ldap_settings`

LDAP connection configuration (stored in DB for runtime changes).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | BIGSERIAL | NO | auto | Primary key |
| `urls` | VARCHAR(500) | NO | — | LDAP server URL(s) |
| `base` | VARCHAR(500) | NO | — | Base DN |
| `username` | VARCHAR(500) | YES | NULL | Bind DN |
| `password_encrypted` | VARCHAR(500) | YES | NULL | AES-256 encrypted bind password |
| `user_search_base` | VARCHAR(500) | YES | NULL | User search base OU |
| `user_search_filter` | VARCHAR(500) | YES | NULL | User search filter pattern |
| `is_enabled` | BOOLEAN | NO | false | Whether LDAP auth is active |
| `created_at` | TIMESTAMP | NO | now() | Creation timestamp |
| `updated_at` | TIMESTAMP | NO | now() | Last update timestamp |

---

### `login_attempts`

Tracks login attempts for rate limiting and account lockout.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | BIGSERIAL | NO | auto | Primary key |
| `username` | VARCHAR(100) | YES | NULL | Attempted username |
| `ip_address` | VARCHAR(45) | NO | — | Client IP address |
| `attempt_time` | TIMESTAMP | NO | now() | When the attempt occurred |
| `success` | BOOLEAN | NO | — | Whether the attempt succeeded |

**Indexes**: `username`, `ip_address`, `attempt_time`

---

## Join Tables

### `user_roles`
| Column | Type | Description |
|--------|------|-------------|
| `user_id` | BIGINT | FK → `users.id` |
| `role_id` | BIGINT | FK → `roles.id` |

### `user_teams`
| Column | Type | Description |
|--------|------|-------------|
| `user_id` | BIGINT | FK → `users.id` |
| `team_id` | BIGINT | FK → `teams.id` |

### `task_assignees`
| Column | Type | Description |
|--------|------|-------------|
| `task_id` | BIGINT | FK → `tasks.id` |
| `user_id` | BIGINT | FK → `users.id` |

### `project_teams`
| Column | Type | Description |
|--------|------|-------------|
| `project_id` | BIGINT | FK → `projects.id` |
| `team_id` | BIGINT | FK → `teams.id` |

---

## Entity Relationship Diagram

```
┌──────────┐    user_roles    ┌────────────┐
│  users   │◄───────────────►│   roles    │
│          │  M:N             │            │
└──────────┘                  └────────────┘
  │ │ │ │
  │ │ │ └──── user_teams ────► ┌──────────┐
  │ │ │          M:N           │  teams   │
  │ │ │                        │          │◄── leader_id (1:1)
  │ │ │                        └──────────┘
  │ │ │                          │
  │ │ │                          │ 1:N
  │ │ │                          ▼
  │ │ │  created_by           ┌──────────┐    M:1     ┌──────────┐
  │ │ └──────────────────────►│  tasks   │───────────►│ projects │
  │ │    task_assignees  M:N  │          │            │          │
  │ └────────────────────────►│          │            └──────────┘
  │                           └──────────┘              │
  │                             │ │                     │ project_teams
  │                             │ │                     └──────► teams (M:N)
  │                             │ └── 1:N ──► ┌────────────────┐
  │                             │             │ task_status_    │
  │                             │             │ history         │
  │                             │             └────────────────┘
  │                             └──── 1:N ──► ┌──────────┐
  │                                           │ subtasks │
  │                                           └──────────┘
  │
  │  (referenced by)
  ├──► task_logs.changed_by
  ├──► system_logs.user_id
  └──► task_status_history.changed_by
```

---

## Migration History

All migrations are in `Backend/src/main/resources/db/changelog/changes/`:

| Migration | Description |
|-----------|-------------|
| `V1__initial_schema.xml` | Initial tables: users, roles, teams, tasks, subtasks, task_status_history, user_roles, user_teams |
| `V2__seed_data.xml` | Seed default roles and teams |
| `V3__add_password_to_users.xml` | Add `password` column to users table |
| `V4__create_admin_user.xml` | Create default admin user |
| `V5__add_subtask_fields.xml` | Add `start_date`, `end_date`, `assignee_id` to subtasks |
| `V6__add_task_type_and_priority.xml` | Add `task_type` and `priority` columns to tasks |
| `V7__add_team_color_and_icon.xml` | Add `color` and `icon` columns to teams |
| `V8__add_projects.xml` | Create `projects` table, `project_teams` join table, add `project_id` to tasks |
| `V9__add_soft_delete.xml` | Add `is_active` column to users and teams |
| `V10__rename_daire_baskani_to_admin.xml` | Rename `DAIRE_BASKANI` role to `ADMIN` |
| `V11__create_ldap_settings.xml` | Create `ldap_settings` table |
| `V12__create_login_attempts.xml` | Create `login_attempts` table with indexes |
| `V13__create_system_logs.xml` | Create `system_logs` table with indexes |
| `V14__create_task_logs.xml` | Create `task_logs` table with indexes |
| `V15__rename_teams_to_birim.xml` | Update team names to Turkish department names |
| `V16__task_logs_preserve_deleted_task.xml` | Make `task_id` nullable in task_logs, add `task_title` column |
| `V17__add_departments.xml` | Add `BIRIM_AMIRI` role, set team icons and colors |

### Adding New Migrations

1. Create a new XML file in `Backend/src/main/resources/db/changelog/changes/` following the naming convention: `V{N}__{description}.xml`
2. Add the file reference to `db.changelog-master.xml`
3. The migration runs automatically on next application startup
