# Development Guide

## Local Development Setup

### Prerequisites
| Tool | Version | Purpose |
|------|---------|---------|
| Java | 17+ | Backend runtime |
| Maven | 3.x | Backend build |
| Node.js | 20+ | Frontend runtime |
| npm | 9+ | Frontend package manager |
| Docker | 20+ | PostgreSQL (and optional full stack) |
| Git | 2.x | Version control |

### 1. Start the Database

```bash
# Start only PostgreSQL via Docker
docker-compose up -d postgres
```

This starts PostgreSQL on `localhost:5432` with default credentials (`postgres`/`postgres`).

### 2. Start the Backend

```bash
cd Backend
mvn spring-boot:run
```

The backend starts on `http://localhost:8080`. Liquibase migrations run automatically.

### 3. Start the Frontend

```bash
cd Frontend
npm install
npm run dev
```

The frontend starts on `http://localhost:5173` (Vite dev server) with hot module replacement.

---

## Project Structure Conventions

### Backend Package Structure

```
com.projectspring/
├── config/       # @Configuration classes (Security, JWT, etc.)
├── controller/   # @RestController classes (one per domain)
├── dto/          # Data Transfer Objects (request/response)
├── model/        # @Entity JPA classes
│   └── enums/    # Java enums (TaskStatus, Priority, etc.)
├── repository/   # JpaRepository interfaces
├── service/      # @Service business logic classes
├── security/     # JWT filter, entry point
└── aspect/       # AOP aspects (logging)
```

### Naming Conventions

| Layer | Pattern | Example |
|-------|---------|---------|
| Entity | `{Name}.java` | `Task.java`, `User.java` |
| Repository | `{Name}Repository.java` | `TaskRepository.java` |
| Service | `{Name}Service.java` | `TaskService.java` |
| Controller | `{Name}Controller.java` | `TaskController.java` |
| DTO (Request) | `Create{Name}Request.java` | `CreateTaskRequest.java` |
| DTO (Response) | `{Name}DTO.java` | `TaskDTO.java` |
| DTO (Update) | `Update{Name}Request.java` | `UpdateUserRequest.java` |
| DTO (Filter) | `{Name}FilterRequest.java` | `TaskLogFilterRequest.java` |

### Frontend File Structure

```
src/
├── components/   # Reusable UI components (by domain)
│   ├── admin/    # Admin panel components
│   ├── calendar/ # Calendar/Gantt/Kanban views
│   ├── common/   # Shared components (dialogs, etc.)
│   ├── dashboard/# Dashboard components
│   ├── layout/   # Header, Sidebar
│   ├── profile/  # User profile
│   ├── project/  # Project modals
│   └── task/     # Task modals
├── context/      # React Context providers
├── hooks/        # Custom React hooks
├── pages/        # Page-level components (route targets)
├── services/     # API service modules (Axios)
├── styles/       # Global styles and theme
├── types/        # TypeScript type definitions
└── utils/        # Utility functions
```

---

## Adding a New Feature

### Backend: New Entity + CRUD

1. **Create the entity** in `model/`:
   ```java
   @Entity
   @Table(name = "new_entities")
   @Data @NoArgsConstructor @AllArgsConstructor
   public class NewEntity {
       @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
       private Long id;
       // fields...
       private LocalDateTime createdAt;
       private LocalDateTime updatedAt;
       @PrePersist protected void onCreate() { ... }
       @PreUpdate protected void onUpdate() { ... }
   }
   ```

2. **Create DTOs** in `dto/`:
   - `CreateNewEntityRequest.java` (incoming data)
   - `NewEntityDTO.java` (outgoing data)

3. **Create the repository** in `repository/`:
   ```java
   public interface NewEntityRepository extends JpaRepository<NewEntity, Long> {
       // custom queries
   }
   ```

4. **Create the service** in `service/`:
   - Inject the repository
   - Implement business logic
   - Map between entities and DTOs

5. **Create the controller** in `controller/`:
   - Define REST endpoints
   - Use `@PreAuthorize` for access control
   - Delegate to service layer

6. **Create Liquibase migration** in `resources/db/changelog/changes/`:
   - Name: `V{N}__{description}.xml`
   - Add to `db.changelog-master.xml`

### Frontend: New Page + API

1. **Define types** in `types/NewEntity.ts`
2. **Create API service** in `services/newEntityService.ts`
3. **Create components** in `components/newentity/`
4. **Create page** in `pages/NewEntityPage.tsx`
5. **Add route** in `App.tsx`
6. **Add navigation** in `Sidebar.tsx`

---

## Database Migrations

### Creating a New Migration

1. Create `V{N}__{description}.xml` in `Backend/src/main/resources/db/changelog/changes/`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<databaseChangeLog
    xmlns="http://www.liquibase.org/xml/ns/dbchangelog"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.liquibase.org/xml/ns/dbchangelog
    http://www.liquibase.org/xml/ns/dbchangelog/dbchangelog-latest.xsd">

    <changeSet id="N-1" author="yourname">
        <createTable tableName="new_table">
            <column name="id" type="BIGSERIAL" autoIncrement="true">
                <constraints primaryKey="true" nullable="false"/>
            </column>
            <column name="name" type="VARCHAR(255)">
                <constraints nullable="false"/>
            </column>
            <column name="created_at" type="TIMESTAMP" defaultValueComputed="CURRENT_TIMESTAMP">
                <constraints nullable="false"/>
            </column>
        </createTable>
    </changeSet>

</databaseChangeLog>
```

2. Add to `db.changelog-master.xml`:
```xml
<include file="db/changelog/changes/V{N}__{description}.xml"/>
```

3. Restart the application — migration runs automatically.

### Rollback Considerations
- Liquibase supports rollback for standard operations (createTable, addColumn, etc.)
- For complex changes, add explicit `<rollback>` tags
- Test migrations locally before committing

---

## API Design Conventions

### Endpoint Patterns
| Operation | Method | URL Pattern |
|-----------|--------|-------------|
| List all | GET | `/api/{resources}` |
| Get by ID | GET | `/api/{resources}/{id}` |
| Create | POST | `/api/{resources}` |
| Update | PUT | `/api/{resources}/{id}` |
| Delete | DELETE | `/api/{resources}/{id}` |
| Partial update | PUT | `/api/{resources}/{id}/{field}` |

### Response Conventions
- **Success**: Return the resource DTO with appropriate status (200, 201)
- **Not Found**: Return 404 with error message
- **Validation Error**: Return 400 with field-level errors
- **Auth Error**: Return 401 (not authenticated) or 403 (not authorized)

### Filtering
- Use query parameters for filtering: `?teamId=1&year=2026&month=2`
- Use pagination for large result sets: `?page=0&size=50`

---

## Testing

### Backend Testing
```bash
cd Backend
mvn test
```

Available test dependencies:
- `spring-boot-starter-test` (JUnit 5, Mockito, AssertJ)
- `spring-security-test` (Security test support)

### Frontend Testing
```bash
cd Frontend
npm test
```

> Note: Test coverage is currently minimal. See [Roadmap](./roadmap.md) for testing plans.

---

## Code Quality

### Backend
- **Lombok**: Used for `@Data`, `@NoArgsConstructor`, `@AllArgsConstructor` to reduce boilerplate
- **Validation**: Use `@Valid` and Jakarta Validation annotations on DTOs
- **Null Safety**: Use `Optional<>` for nullable return types in repositories
- **Logging**: Automatic via `LoggingAspect` — no manual logging needed in controllers. Only write operations (POST/PUT/DELETE) and errors are persisted to the database; GET requests are logged at DEBUG level to console only. Health check endpoints are excluded entirely. Logging failures are handled gracefully (fall back to console, never break API responses). Old logs are auto-cleaned by `LogCleanupService` (system logs: 30 days, task logs: 90 days).
- **Connection Pool**: HikariCP is configured with keepalive probes (60s), connection validation (`SELECT 1`), and leak detection (30s threshold). See [Deployment Guide](./deployment.md#connection-pool-hikaricp) for tuning options.

### Frontend
- **TypeScript**: Strict mode for type safety
- **ESLint**: Configured with React hooks and refresh plugins
- **CSS**: Component-scoped CSS files, global theme variables

---

## Important Implementation Notes

### Adding New Controllers

When you create a new controller, it is **automatically** logged by `LoggingAspect`. If your controller is called frequently (e.g., health checks, polling, WebSocket handshakes), you should exclude it from AOP logging:

```java
// In LoggingAspect.java, add to the pointcut exclusion:
@Around("execution(* com.projectspring.controller..*(..)) && " +
        "!execution(* com.projectspring.controller.YourNewController.*(..))")
```

### Database Resilience

The application is designed to handle temporary database outages gracefully:
- **HikariCP** automatically detects and replaces dead connections via keepalive probes
- **LoggingAspect** catches database write failures and falls back to console logging
- **Docker** auto-restarts crashed containers via `restart: unless-stopped`

If you add new services that write to the database during request processing (similar to `SystemLogService`), ensure they handle `DataAccessException` gracefully to prevent cascading failures.
