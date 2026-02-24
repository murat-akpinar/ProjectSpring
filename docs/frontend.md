# Frontend Architecture

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.2 | UI framework |
| TypeScript | 5.2 | Type safety |
| Vite | 5.0 | Build tool & dev server |
| React Router | 6.20 | Client-side routing |
| Axios | 1.6 | HTTP client |
| date-fns | 2.30 | Date manipulation |
| react-icons | 5.5 | Icon library |

---

## Directory Structure

```
Frontend/src/
├── components/           # Reusable UI components
│   ├── admin/            # Admin panel components
│   │   ├── LdapImport        # LDAP user search & import
│   │   ├── RoleManagement     # Role CRUD
│   │   ├── SystemHealth       # Health monitoring dashboard
│   │   ├── SystemLogs         # System log viewer with filters
│   │   ├── TaskLogs           # Task audit log viewer
│   │   ├── TeamManagement     # Team CRUD
│   │   ├── TeamModal          # Team create/edit dialog
│   │   ├── UserManagement     # User CRUD
│   │   └── UserModal          # User create/edit dialog
│   ├── calendar/         # Calendar & view components
│   │   ├── CalendarView       # Monthly calendar grid
│   │   ├── GanttChartView     # Timeline-based Gantt chart
│   │   ├── KanbanBoardView    # Status-based Kanban board
│   │   ├── MonthView          # 12-month overview grid
│   │   ├── TaskCard           # Task display card
│   │   ├── TeamPlannerView    # Team planning view
│   │   └── WeekView           # Weekly task view
│   ├── common/           # Shared components
│   │   └── ConfirmDialog      # Reusable confirmation dialog
│   ├── dashboard/        # Dashboard components
│   │   └── TeamDashboard      # Team stats, charts, leaderboard
│   ├── layout/           # App layout components
│   │   ├── Header             # Top bar (year selector, user, admin link)
│   │   └── Sidebar            # Left navigation (teams, views)
│   ├── profile/          # User profile components
│   │   └── UserProfile        # Profile view & edit
│   ├── project/          # Project components
│   │   └── ProjectModal       # Project create/edit dialog
│   └── task/             # Task components
│       └── TaskModal          # Task create/edit dialog with subtasks
├── context/              # React Context providers
│   └── AuthContext.tsx         # Authentication state management
├── hooks/                # Custom React hooks
│   ├── useAuth.ts             # Auth context consumer hook
│   ├── useSidebar.ts          # Sidebar toggle state (localStorage)
│   └── useTasks.ts            # Task fetching with loading/error
├── pages/                # Page-level route components
│   ├── LoginPage              # Login form (LDAP/Standard tabs)
│   ├── CalendarPage           # Main view with view mode switcher
│   ├── DashboardPage          # Dashboard with team stats overview
│   ├── ProjectsPage           # Project list with filters
│   ├── ProjectDetailPage      # Single project with Gantt & tasks
│   ├── AdminPanelPage         # Admin panel with tabbed interface
│   ├── UserProfilePage        # User profile management
│   └── NotFoundPage           # 404 page
├── services/             # API service modules
│   ├── api.ts                 # Axios instance with interceptors
│   ├── authService.ts         # Login, logout, getCurrentUser
│   ├── taskService.ts         # Task CRUD, status updates
│   ├── projectService.ts      # Project CRUD
│   ├── teamService.ts         # Team operations
│   ├── userService.ts         # User profile operations
│   ├── adminService.ts        # Admin user/team/role operations
│   ├── dashboardService.ts    # Dashboard statistics
│   ├── calendarService.ts     # Calendar data
│   ├── logService.ts          # System & task log operations
│   ├── ldapService.ts         # LDAP import operations
│   ├── ldapSettingsService.ts # LDAP settings management
│   └── systemHealthService.ts # System health checks
├── styles/               # Global styles
│   └── catppuccin-mocha.css   # Theme CSS custom properties
├── types/                # TypeScript type definitions
│   ├── Task.ts                # Task, Subtask, TaskStatus, etc.
│   ├── Project.ts             # Project types
│   ├── Team.ts                # Team types
│   ├── User.ts                # User types
│   ├── Calendar.ts            # Calendar view types
│   ├── Dashboard.ts           # Dashboard stat types
│   ├── Admin.ts               # Admin panel types
│   ├── Log.ts                 # Log types
│   └── SystemHealth.ts        # Health check types
├── utils/                # Utility functions
│   ├── dateUtils.ts           # Date formatting helpers
│   ├── errorLogger.ts         # Frontend error logging to backend
│   ├── jwtUtils.ts            # JWT token parsing & expiry check
│   └── statusColors.ts        # Task status → color mapping
├── App.tsx               # Root component with routing
├── App.css               # Global app styles
├── main.tsx              # Entry point
└── index.css             # Base CSS reset & global styles
```

---

## Routing

| Path | Page | Auth | Role | Description |
|------|------|------|------|-------------|
| `/login` | LoginPage | Public | — | Login (redirects to `/` if authenticated) |
| `/` | CalendarPage | Required | Any | Main calendar view (default) |
| `/dashboard` | DashboardPage | Required | Any | Team dashboard overview |
| `/projects` | ProjectsPage | Required | Any | Project list |
| `/projects/:id` | ProjectDetailPage | Required | Any | Project detail view |
| `/admin` | AdminPanelPage | Required | ADMIN | Admin panel |
| `/profile` | UserProfilePage | Required | Any | User profile |
| `*` | NotFoundPage | — | — | 404 catch-all |

Route protection is implemented via wrapper components in `App.tsx` that check `AuthContext`.

---

## State Management

### Authentication (Context API)

`AuthContext.tsx` provides global auth state:

| Property / Method | Type | Description |
|-------------------|------|-------------|
| `user` | `User \| null` | Current authenticated user |
| `loading` | `boolean` | Auth loading state |
| `login(username, password)` | `async function` | Authenticate and store token |
| `logout()` | `function` | Clear token and redirect to login |
| `isAuthenticated` | `boolean` | Whether user is logged in |
| `hasRole(role)` | `function` | Check if user has a specific role |

**Token management:**
- JWT stored in `localStorage`
- Token expiry checked every 5 seconds
- Auto-logout on expiration
- Token attached to every API request via Axios interceptor

### Component-Level State

Individual components use `useState` for local state. No global state library (Redux, Zustand) is used — the app relies on prop drilling and context.

### Sidebar State

`useSidebar` hook manages sidebar collapse state persisted to `localStorage`.

---

## API Layer

### Axios Configuration (`services/api.ts`)

```
Base URL: /api (proxied by Vite dev server or Nginx)

Request Interceptor:
  → Reads JWT from localStorage
  → Adds "Authorization: Bearer <token>" header

Response Interceptor:
  → 401 on /auth/me → auto logout
  → 403 → redirect or show error
```

### Service Pattern

Each domain has a dedicated service file:

```typescript
// Example: taskService.ts
import api from './api';

export const getTasks = (params) => api.get('/tasks', { params });
export const getTaskById = (id) => api.get(`/tasks/${id}`);
export const createTask = (data) => api.post('/tasks', data);
export const updateTask = (id, data) => api.put(`/tasks/${id}`, data);
export const deleteTask = (id) => api.delete(`/tasks/${id}`);
export const updateTaskStatus = (id, data) => api.put(`/tasks/${id}/status`, data);
```

---

## Theme & Styling

### Catppuccin Mocha

The application uses the [Catppuccin Mocha](https://github.com/catppuccin/catppuccin) dark color palette, defined as CSS custom properties in `styles/catppuccin-mocha.css`.

**Key colors:**

| Variable | Hex | Usage |
|----------|-----|-------|
| `--ctp-base` | #1e1e2e | Main background |
| `--ctp-mantle` | #181825 | Sidebar / deeper background |
| `--ctp-crust` | #11111b | Darkest background |
| `--ctp-surface0` | #313244 | Card / elevated surfaces |
| `--ctp-surface1` | #45475a | Hover states |
| `--ctp-text` | #cdd6f4 | Primary text |
| `--ctp-subtext0` | #a6adc8 | Secondary text |
| `--ctp-blue` | #89b4fa | Primary accent, links |
| `--ctp-green` | #a6e3a1 | Success, completed |
| `--ctp-yellow` | #f9e2af | Warning, open tasks |
| `--ctp-red` | #f38ba8 | Error, urgent, overdue |
| `--ctp-peach` | #fab387 | Postponed items |
| `--ctp-mauve` | #cba6f7 | Feature type accent |

### Task Status Colors
| Status | Color Variable | Visual |
|--------|---------------|--------|
| OPEN | `--ctp-yellow` | Yellow |
| IN_PROGRESS | `--ctp-blue` | Blue |
| TESTING | `--ctp-mauve` | Purple |
| COMPLETED | `--ctp-green` | Green |
| POSTPONED | `--ctp-peach` | Peach |
| CANCELLED | `--ctp-overlay0` | Gray |
| OVERDUE | `--ctp-red` | Red |

### Priority Icons
| Priority | Icon | Color |
|----------|------|-------|
| NORMAL | ⚪ | Gray |
| HIGH | 🟠 | Yellow |
| URGENT | 🔴 | Red |

### Typography
- **Primary Font**: Cascadia Mono (Nerd Font variants)
- Monospaced throughout for a clean, technical look

### Styling Approach
- **Component-scoped CSS**: Each component has its own `.css` file
- **CSS Custom Properties**: Theme values defined globally, consumed by components
- **No CSS-in-JS**: Pure CSS files, no styled-components or emotion
- **Responsive Design**: Media queries for desktop (4 cols), tablet (2-3 cols), mobile (1 col)

---

## View Modes

### Calendar View
- Monthly grid with day cells
- Tasks displayed as colored blocks within day cells
- Weekend days rendered with reduced opacity
- Click on a task to open the task modal

### Gantt Chart View
- Horizontal timeline with week selection
- Tasks shown as bars spanning start → end date
- Hierarchical subtask support
- Responsive scaling based on viewport

### Kanban Board View
- Columns per task status (OPEN, IN_PROGRESS, TESTING, COMPLETED, etc.)
- Task cards in each column
- Per-team filtering
- Responsive column layout

### Month Overview
- 12-month grid with seasonal colors
- Quick stats per month (task counts by status)
- Click a month to navigate to detailed view

---

## Error Handling

### Frontend Error Logger (`utils/errorLogger.ts`)
- Captures unhandled errors and sends them to `POST /api/admin/logs/system/frontend`
- Includes: error message, stack trace, current route, user info
- Stored in the `system_logs` table with source `FRONTEND`

### API Error Handling
- Axios response interceptor catches 401/403 errors globally
- Individual components handle other errors with local state
- Error messages displayed in UI with appropriate styling

---

## Build & Deploy

### Development
```bash
npm run dev          # Start Vite dev server (port 5173)
```

### Production Build
```bash
npm run build        # Output to dist/
npm run preview      # Preview production build locally
```

### Docker Build
The `Frontend/Dockerfile` performs a multi-stage build:
1. **Build stage**: `node:20-alpine` — installs deps, runs `npm run build`
2. **Serve stage**: `nginx:alpine` — serves the `dist/` directory

Nginx is configured to route all paths to `index.html` (SPA fallback) and proxy `/api` requests to the backend service.
