# Development Roadmap

This document outlines planned features, improvements, and known issues. Use this as a guide when picking up new development work.

> Turkish version: [todo/todo.md](../todo/todo.md)

---

## Completed Features

The following features are already implemented and available:

- **Admin Panel**: Full user CRUD, team CRUD, role management, LDAP settings UI, LDAP user import
- **Team Management**: Leader assignment, member management, custom colors and icons
- **Task Audit Logging**: TaskLog system tracking all CRUD operations with old/new values
- **Kanban Board**: Status-based Kanban board view per team
- **Gantt Chart**: Timeline-based Gantt chart with subtask hierarchy
- **Task Types & Priorities**: TASK/FEATURE/BUG types, NORMAL/HIGH/URGENT priorities
- **Subtask Support**: Child tasks with assignee, dates, and completion tracking
- **Postponement Tracking**: Postponed date tracking with original date preservation
- **Overdue Detection**: Scheduled job to automatically detect overdue tasks
- **Rate Limiting**: IP-based rate limiting with Bucket4j
- **Account Lockout**: Failed login attempt tracking and lockout
- **Hybrid Auth**: LDAP + Local user authentication with JWT
- **System Logs**: Backend and frontend log collection and viewing
- **System Health**: Backend, database, and frontend health monitoring
- **Docker**: Full containerized deployment with Docker Compose
- **Liquibase**: Versioned database migrations (V1–V17)

---

## Short Term (High Priority)

### 1. Notification System
**Goal**: Real-time notifications for task assignments and status changes.

- [ ] Create `notifications` table (user_id, type, message, is_read, related_entity_id, created_at)
- [ ] Create NotificationService to generate notifications on:
  - Task assigned to user
  - Task status changed
  - Task deadline approaching (1 day before)
  - User mentioned in task content
- [ ] Create NotificationController with endpoints:
  - `GET /api/notifications` — list user's notifications
  - `PUT /api/notifications/{id}/read` — mark as read
  - `PUT /api/notifications/read-all` — mark all as read
  - `GET /api/notifications/unread-count` — unread count
- [ ] Frontend: notification bell icon in Header with unread badge
- [ ] Frontend: notification dropdown/panel
- [ ] Optional: WebSocket (STOMP) for real-time push
- [ ] Optional: email notification preferences per user

### 2. Task Comments
**Goal**: Allow users to discuss tasks with threaded comments.

- [ ] Create `task_comments` table (id, task_id, user_id, content, parent_comment_id, created_at, updated_at)
- [ ] Create TaskCommentService and TaskCommentController
- [ ] Endpoints:
  - `GET /api/tasks/{id}/comments` — list comments for a task
  - `POST /api/tasks/{id}/comments` — add a comment
  - `PUT /api/tasks/{id}/comments/{commentId}` — edit own comment
  - `DELETE /api/tasks/{id}/comments/{commentId}` — delete own comment
- [ ] Frontend: comment section in TaskModal
- [ ] Support @mentions with user autocomplete
- [ ] Trigger notifications on new comments

### 3. File Attachments
**Goal**: Allow file uploads on tasks.

- [ ] Create `task_attachments` table (id, task_id, filename, file_path, file_size, content_type, uploaded_by, created_at)
- [ ] Create file storage service (local filesystem or S3-compatible)
- [ ] Endpoints:
  - `POST /api/tasks/{id}/attachments` — upload file
  - `GET /api/tasks/{id}/attachments` — list attachments
  - `GET /api/tasks/{id}/attachments/{attachmentId}` — download file
  - `DELETE /api/tasks/{id}/attachments/{attachmentId}` — delete file
- [ ] Frontend: file upload area in TaskModal
- [ ] File size limits and allowed types configuration

### 4. Task Templates
**Goal**: Predefined task templates for common workflows.

- [ ] Create `task_templates` table (id, name, title_template, content_template, task_type, priority, team_id, subtask_templates JSON, created_by, created_at)
- [ ] CRUD endpoints for templates
- [ ] Frontend: "Create from template" option in task creation
- [ ] Team-specific and global templates

### 5. Recurring Tasks
**Goal**: Automatically create tasks on a schedule.

- [ ] Create `recurring_task_rules` table (id, template fields, recurrence_type, recurrence_interval, next_run_date, is_active)
- [ ] Scheduled job to create tasks based on rules
- [ ] Recurrence types: DAILY, WEEKLY, BIWEEKLY, MONTHLY
- [ ] Frontend: recurrence settings in task creation modal

### 6. Bulk CSV User Import
**Goal**: Import multiple users at once from a CSV file.

- [ ] CSV upload endpoint with validation
- [ ] Frontend: CSV upload UI in admin panel
- [ ] Error reporting for invalid rows

---

## Medium Term

### 7. Reporting & Analytics
**Goal**: Comprehensive reporting with export capabilities.

- [ ] Weekly/monthly performance reports per team
- [ ] Cross-team comparison charts
- [ ] Individual productivity metrics (tasks completed, avg completion time)
- [ ] Process duration analysis (open → completed time)
- [ ] Team-level reporting
- [ ] Export to PDF and Excel
- [ ] Endpoints:
  - `GET /api/reports/team/{id}` — team report
  - `GET /api/reports/user/{id}` — user report
  - `GET /api/reports/export` — export with format parameter

### 8. Advanced Calendar Features
**Goal**: Enhanced calendar functionality.

- [ ] Drag-and-drop task rescheduling on calendar
- [ ] Daily detailed view
- [ ] Holiday and leave day markers
- [ ] Google Calendar / Outlook integration (iCal export)
- [ ] Print-friendly calendar view

### 9. Sprint / Milestone Support
**Goal**: Agile project management capabilities.

- [ ] Create `milestones` table (id, project_id, name, target_date, status)
- [ ] Create `sprints` table (id, project_id, name, start_date, end_date, goal)
- [ ] Link tasks to sprints/milestones
- [ ] Sprint board view
- [ ] Burndown chart
- [ ] Project progress percentage widget

### 10. Global Search
**Goal**: Search across all entities.

- [ ] `GET /api/search?q=term` — search tasks, projects, users
- [ ] Full-text search with PostgreSQL `tsvector`/`tsquery`
- [ ] Frontend: search bar in Header with instant results
- [ ] Search result grouping by entity type
- [ ] Advanced filters (date range, priority, status combinations)
- [ ] Saved searches / filters

---

## Long Term

### 11. Mobile Application
**Goal**: Native mobile experience.

- [ ] React Native or Flutter mobile app
- [ ] Push notifications
- [ ] Offline mode with sync
- [ ] Camera integration for file attachments

### 12. Integrations & Automation
**Goal**: Connect with external tools.

- [ ] Webhook system for external integrations
- [ ] Slack / Microsoft Teams notification integration
- [ ] Email-to-task creation
- [ ] Automatic task assignment rules (round-robin, skill-based)
- [ ] SLA tracking with configurable thresholds

### 13. Enhanced Security
**Goal**: Enterprise-grade security.

- [ ] Two-factor authentication (2FA) — TOTP
- [ ] Comprehensive audit log (all entity changes)
- [ ] Database backup and restore UI
- [ ] API key authentication for external integrations
- [ ] IP whitelist for admin panel

### 14. AI Features
**Goal**: Intelligent assistance.

- [ ] Task priority suggestion based on historical data
- [ ] Automatic time estimation for tasks
- [ ] Smart task assignment (workload balancing)
- [ ] Duplicate task detection
- [ ] Natural language task creation

### 15. Internationalization (i18n)
**Goal**: Multi-language support.

- [ ] Extract all UI strings to translation files
- [ ] Turkish and English language support
- [ ] Language preference per user
- [ ] Date/time format localization

### 16. Theme Support
**Goal**: User-customizable appearance.

- [ ] Dark/Light theme toggle
- [ ] Theme preference stored per user
- [ ] Additional Catppuccin flavors (Latte, Frappe, Macchiato)

---

## Known Issues & Improvements

### Code Quality
- [ ] Increase unit test coverage (backend & frontend)
- [ ] Add integration tests for API endpoints
- [ ] Add E2E tests (Cypress or Playwright)

### UX Improvements
- [ ] More user-friendly error messages
- [ ] Consistent loading states across all views
- [ ] Stronger form validation with inline feedback
- [ ] Improved responsive design for tablets and mobile
- [ ] Accessibility (WCAG) compliance
- [ ] Keyboard shortcuts for common actions

### Performance
- [ ] Implement pagination on task list views
- [ ] Add caching layer (Redis) for dashboard statistics
- [ ] Optimize database queries with proper indexing review
- [ ] Lazy loading for heavy components (Gantt chart)
- [ ] Image/asset optimization

### DevOps
- [ ] CI/CD pipeline (GitHub Actions / GitLab CI)
- [ ] Automated testing in pipeline
- [ ] Staging environment configuration
- [ ] Health check alerting (Prometheus + Grafana)
- [ ] Log aggregation (ELK stack or similar)
- [ ] Database backup automation

---

## How to Pick Up Work

1. Choose an item from the lists above
2. Check the [database schema docs](./database-schema.md) for related tables
3. Check the [API reference](./api-reference.md) for existing endpoints in the same domain
4. Follow the patterns described in the [Development Guide](./development-guide.md)
5. Update this roadmap and [todo.md](../todo/todo.md) when the feature is complete
