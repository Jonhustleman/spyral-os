# SPYRAL OS Architecture

> **Document Version:** v1.0.0  
> **Last Updated:** 2026-07-20

---

## Table of Contents

1. [Architecture Philosophy](#architecture-philosophy)
2. [Hexagonal Architecture (Ports & Adapters)](#hexagonal-architecture-ports--adapters)
3. [Layer Breakdown](#layer-breakdown)
4. [Dependency Rules](#dependency-rules)
5. [Package Dependency Graph](#package-dependency-graph)
6. [Data Flow](#data-flow)
7. [Module Descriptions](#module-descriptions)
8. [Technology Stack](#technology-stack)
9. [Testing Strategy](#testing-strategy)

---

## Architecture Philosophy

SPYRAL OS is built on **Domain-Driven Design (DDD)** principles with a **hexagonal (ports & adapters)** architecture. This enforces:

- **Separation of Concerns** — Each layer has a single, well-defined responsibility.
- **Testability** — Business logic can be tested without infrastructure dependencies.
- **Maintainability** — Changes to one layer do not ripple through the system.
- **Flexibility** — Adapters (database, transport, etc.) can be swapped without affecting core logic.

---

## Hexagonal Architecture (Ports & Adapters)

```
                      ┌────────────────────────────┐
                      │     Presentation Layer      │
                      │  (MCP Tools / HTTP API)     │
                      │  apps/mcp-server/src/       │
                      │  tools/*.ts, services/*.ts  │
                      └──────────┬─────────────────┘
                                 │ Depends on
                      ┌──────────▼─────────────────┐
                      │    Capabilities Layer       │
                      │  (Application Logic)        │
                      │  packages/capabilities/     │
                      │  Capabilities + Services    │
                      └──────────┬─────────────────┘
                                 │ Depends on
                      ┌──────────▼─────────────────┐
                      │   Infrastructure Layer      │
                      │  (Adapters & Implementations)│
                      │  packages/infrastructure/   │
                      │  Sqlite*, File*, Config     │
                      └──────────┬─────────────────┘
                                 │ Depends on
                      ┌──────────▼─────────────────┐
                      │      Domain Kernel          │
                      │  (Core Types & Ports)       │
                      │  packages/kernel/src/       │
                      │  Types + Repository Ports   │
                      └────────────────────────────┘
```

---

## Layer Breakdown

### 1. Domain Kernel (`packages/kernel/`)

The innermost layer — has **zero dependencies** on other project packages.

**Contents:**

| Module | Description |
|--------|-------------|
| `types.ts` | Core domain entities and value objects |
| `repository-ports.ts` | Interface contracts for data access |
| `config.ts` | Configuration type definitions |
| `audit.ts` | Audit trail types |
| `policy-engine.ts` | Policy evaluation types |
| `tenant.ts` | Tenant context types |

**Key Types:**

- `Decision`, `DecisionStatus`, `DecisionFilter`
- `Workspace`, `WorkspaceStatus`
- `User`, `Session`
- `SystemStatus`, `HealthStatus`
- `AuditEntry`
- `PolicyEvaluation`, `PolicyResult`
- `TenantContext`
- `RepositoryPort<T>` (generic repository interface)

**Repository Ports:**

- `DecisionRepository` — `save()`, `findById()`, `findAll()`, `delete()`
- `ExecutionPlanRepository` — `save()`, `findById()`, `findAll()`
- `WorkspaceRepository` — `save()`, `findById()`, `findAll()`, `delete()`
- `LearningRecordRepository` — `save()`, `findById()`, `query()`
- `PatternRepository` — `save()`, `findById()`, `findAll()`, `findBySimilarity()`

---

### 2. Capabilities Layer (`packages/capabilities/`)

The application logic layer — implements use cases by orchestrating domain objects.

**Dependencies:** Kernel only.

**Contents:**

| Capability | Description |
|------------|-------------|
| `DecisionCapability` | Create, retrieve, and manage decisions |
| `ExecutionCapability` | Execute and track decision plans |
| `WorkspaceCapability` | Manage workspaces and their lifecycles |
| `LearningCapability` | Record and query learning data |

**Services:**

| Service | Description |
|---------|-------------|
| `AuthService` | User registration, authentication, session management |
| `WorkflowEngineService` | Workflow orchestration and state management |
| `Logger` | Structured logging with correlation ID support |

**Key Design Decisions:**

- Capabilities accept repository port interfaces (dependency injection)
- Services are stateless where possible — state lives in repositories
- Business rules are enforced before delegating to infrastructure

---

### 3. Infrastructure Layer (`packages/infrastructure/`)

Implements the repository ports defined in the kernel. Contains all I/O concerns.

**Dependencies:** Kernel, Capabilities.

**Contents:**

| Module | Description |
|--------|-------------|
| `sqlite-connection.ts` | SQLite connection management (better-sqlite3) |
| `sqlite-decision-repository.ts` | Decision repository implementation |
| `sqlite-execution-plan-repository.ts` | Execution plan repository implementation |
| `sqlite-workspace-repository.ts` | Workspace repository implementation |
| `sqlite-learning-record-repository.ts` | Learning record repository implementation |
| `sqlite-pattern-repository.ts` | Pattern repository implementation |
| `sqlite-unit-of-work.ts` | Unit of work for transactional operations |
| `migration-manager.ts` | Database schema migration runner |
| `config-validator.ts` | Configuration validation (Zod) |
| `backup.ts` | Backup and restore utilities |
| `factory.ts` | Infrastructure factory for creating configured instances |

**Database:**

- Uses **better-sqlite3** (synchronous, native binding)
- Schema migrations in `sql/migrations/`
- Unit of Work pattern for transactional integrity

---

### 4. Presentation Layer (`apps/mcp-server/`)

The outermost layer — handles HTTP transport and MCP protocol.

**Dependencies:** Infrastructure.

**Contents:**

| Module | Description |
|--------|-------------|
| `index.ts` | Express server setup, middleware chain, route registration |
| `tools/status.ts` | `spyral_get_status` tool handler |
| `tools/decision.ts` | `spyral_create_decision` tool handler |
| `tools/workspace.ts` | `spyral_create_workspace`, `spyral_get_workspace` handlers |
| `tools/query.ts` | `spyral_get_decision`, `spyral_list_decisions` handlers |
| `tools/auth.ts` | `spyral_register`, `spyral_login`, `spyral_get_profile`, `spyral_logout` handlers |
| `services/health.ts` | Health check endpoints (`/health`, `/ready`, `/status`) |
| `services/metrics.ts` | Request metrics middleware and endpoint |
| `services/correlation.ts` | Correlation ID middleware |
| `services/rate-limiter.ts` | Sliding window rate limiter |

**Middleware Chain (order matters):**

```
Request → CORS → JSON Parser → Correlation → Metrics → Rate Limiter → Routes
```

**Routes excluded from rate limiting:** `/health`, `/ready`, `/metrics`

---

## Dependency Rules

```
┌─────────────────────────────────────────────────────────────┐
│                        Layer Rule                           │
├─────────────────────────────────────────────────────────────┤
│ Kernel ← Capabilities ← Infrastructure ← MCP Server         │
│                                                             │
│ Dependency direction: Outer → Inner                          │
│ Inner layers NEVER depend on outer layers                    │
│ No circular dependencies allowed                             │
└─────────────────────────────────────────────────────────────┘
```

**Enforced by:** `src/test/architecture-compliance.test.ts` using TypeScript compiler API.

### What Each Layer Can Import

| Layer | May Import From |
|-------|----------------|
| **Kernel** | External libraries only (Zod, etc.) |
| **Capabilities** | Kernel, external libraries |
| **Infrastructure** | Kernel, Capabilities, external libraries |
| **MCP Server** | Infrastructure, external libraries |

### What Each Layer Cannot Do

- Kernel cannot import from Capabilities, Infrastructure, or MCP Server
- Capabilities cannot import from Infrastructure or MCP Server
- Infrastructure cannot import from MCP Server
- No layer may contain circular imports

---

## Package Dependency Graph

```
@spyral-os/mcp-server
    │
    ├── @spyral-os/infrastructure
    │       │
    │       ├── @spyral-os/capabilities
    │       │       │
    │       │       └── @spyral-os/kernel
    │       │
    │       └── @spyral-os/kernel
    │
    └── @spyral-os/sdk
```

**Workspace packages:**

| Package | Path | Description |
|---------|------|-------------|
| `@spyral-os/kernel` | `packages/kernel/` | Domain types & ports |
| `@spyral-os/capabilities` | `packages/capabilities/` | Business logic |
| `@spyral-os/infrastructure` | `packages/infrastructure/` | Adapters |
| `@spyral-os/sdk` | `packages/sdk/` | Shared utilities |
| `@spyral-os/mcp-server` | `apps/mcp-server/` | Presentation |

---

## Data Flow

### Decision Creation Flow

```
Client (MCP Client)
    │
    ▼
spyral_create_decision (MCP Tool)
    │
    ▼
DecisionCapability.createDecision()
    │  ├── Validates input
    │  ├── Applies policies (PolicyEngine)
    │  ├── Creates AuditEntry
    │  └── Returns Decision
    ▼
SqliteDecisionRepository.save()
    │
    ▼
SQLite Database
```

### Health Check Flow

```
HTTP GET /health
    │
    ▼
Rate Limiter (skip) → Correlation → Metrics
    │
    ▼
Health check handler
    │  ├── Checks system resources
    │  ├── Verifies database connectivity
    │  └── Returns HealthStatus
    ▼
JSON Response
```

---

## Module Descriptions

### Kernel Module

**Purpose:** Define the domain vocabulary that all other layers speak.

The kernel contains:
- **Entities** — Objects with identity (Decision, Workspace, User)
- **Value Objects** — Immutable objects with no identity (Status, Context)
- **Repository Ports** — Interface contracts for data access
- **Domain Events** — Things that happened in the domain

### Capabilities Module

**Purpose:** Implement the "what" of the application — the use cases.

Each capability:
1. Accepts repository interfaces (DI)
2. Implements business logic
3. Returns domain objects
4. Never references infrastructure concerns

### Infrastructure Module

**Purpose:** Implement the "how" — actual I/O and external communication.

Key patterns:
- **Repository Pattern** — Concrete implementations of kernel repository ports
- **Unit of Work** — Transaction management across repositories
- **Factory Pattern** — `InfrastructureFactory` creates configured instances
- **Migration Pattern** — Schema versioning and migration

### MCP Server Module

**Purpose:** Expose capabilities over the network via MCP protocol.

Key patterns:
- **Tool Handlers** — Map MCP tool calls to capability methods
- **Middleware Chain** — Cross-cutting concerns (auth, logging, metrics)
- **Transport Layer** — MCP StreamableHTTPServerTransport
- **Error Handling** — Consistent error responses with correlation IDs

---

## Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Runtime** | Node.js ≥ 18 | JavaScript runtime |
| **Framework** | Next.js 16 (App Router) | Web framework |
| **HTTP Server** | Express 5 | REST API server |
| **MCP SDK** | @modelcontextprotocol/sdk ^1.16.1 | Model Context Protocol |
| **Database** | SQLite (better-sqlite3) | Embedded database |
| **Validation** | Zod 3.24 | Runtime type validation |
| **Testing** | Vitest 4 | Unit & integration tests |
| **TypeScript** | ^5.x | Type-safe JavaScript |
| **Monorepo** | npm workspaces | Package management |
| **Linting** | ESLint | Code quality |

---

## Testing Strategy

| Test Type | Location | Focus |
|-----------|----------|-------|
| Unit Tests | Co-located with source (`*.test.ts`) | Individual functions and classes |
| Integration Tests | `src/test/` | Cross-layer interaction |
| Architecture Tests | `src/test/architecture-compliance.test.ts` | Layer rules and dependency validation |
| E2E Tests | `src/test/e2e/` | Full request-response cycles |

**Testing principles:**
- Kernel: Pure unit tests (no mocks needed)
- Capabilities: Unit tests with mocked repositories
- Infrastructure: Integration tests with test SQLite database
- MCP Server: Integration tests with HTTP requests

---

*For questions about the architecture, please open an issue or refer to the API documentation.*
