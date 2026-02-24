# ProjectSpring Documentation

> A calendar-focused project and task management platform for departments/teams.

## Table of Contents

| Document | Description |
|----------|-------------|
| [Architecture](./architecture.md) | System architecture, tech stack, project structure, and design patterns |
| [Database Schema](./database-schema.md) | Complete database tables, columns, relationships, indexes, and migrations |
| [API Reference](./api-reference.md) | All REST API endpoints with request/response examples |
| [Authentication & Security](./authentication.md) | JWT, LDAP, hybrid auth flow, role-based access, rate limiting |
| [Deployment](./deployment.md) | Docker setup, environment variables, scaling, and production config |
| [Development Guide](./development-guide.md) | Local setup, coding conventions, adding features, and project structure |
| [Frontend](./frontend.md) | React frontend architecture, components, state management, and views |
| [Roadmap](./roadmap.md) | Planned features, improvements, and known issues for future development |

## Quick Overview

ProjectSpring is a full-stack web application built with **Spring Boot 3.2** (Java 17) and **React 18** (TypeScript). It provides:

- **Multi-level authorization**: Admin > Department Head > Staff
- **Hybrid authentication**: LDAP + Local users with JWT tokens
- **Task management**: Calendar, Gantt chart, and Kanban board views
- **Project management**: Multi-team projects with progress tracking
- **Admin panel**: User, team, role, LDAP, and log management
- **Dashboard**: Real-time statistics with charts and leaderboards
- **Logging**: System logs (backend/frontend) and task operation audit logs
- **Security**: Rate limiting, account lockout, AES-256 encryption, BCrypt passwords

## Default Credentials

| User | Password | Role | Access |
|------|----------|------|--------|
| `admin` | `admin` | ADMIN | Full access to all teams and features |

> **Important**: Change the default password after first login.
