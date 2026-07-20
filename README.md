# SPYRAL OS v1.0

**S**elf-**P**ropagating **Y**our **R**eactive **A**utonomous **L**anguage Operating System — a hexagonal-architecture monorepo for building, deploying, and managing autonomous AI agents with MCP (Model Context Protocol) integration.

> **Status:** v1.0 Feature Complete | [Report Issue](https://github.com/Jonhustleman/spyral-os/issues)

---

## Overview

SPYRAL OS is an open-source framework for orchestrating autonomous AI agent workflows. It provides:

- **🧠 Autonomous Decision Engine** — Create, evaluate, and persist AI-driven decisions with full audit trails.
- **⚡ MCP Server** — Model Context Protocol server exposing agent capabilities as composable tools.
- **📐 Hexagonal Architecture** — Clean domain separation with kernel → capabilities → infrastructure → presentation layers.
- **🔒 Security & Governance** — Auth service, rate limiting, correlation tracking, and policy engine.
- **📊 Operational Excellence** — Health checks, metrics, structured logging, backup/restore, and config validation.

---

## Architecture

SPYRAL OS follows **Domain-Driven Design** with hexagonal (ports & adapters) architecture:

```
┌──────────────────────────────────────────────┐
│            MCP Tools / HTTP API              │  ← Presentation
├──────────────────────────────────────────────┤
│              Capabilities Layer              │  ← Application Logic
├──────────────────────────────────────────────┤
│              Infrastructure Layer             │  ← Adapters (SQLite, FS)
├──────────────────────────────────────────────┤
│             Domain Kernel                    │  ← Core Types & Ports
└──────────────────────────────────────────────┘
```

### Layer Rules

| Layer | Dependencies | Responsibility |
|-------|-------------|----------------|
| **Kernel** | None | Domain types, repository ports, value objects |
| **Capabilities** | Kernel | Business logic, use cases, domain services |
| **Infrastructure** | Kernel, Capabilities | DB adapters, file I/O, config, backups |
| **MCP Server** | Infrastructure | HTTP transport, tool handlers, middleware |

---

## Project Structure

```
spyral-os/
├── apps/
│   └── mcp-server/          # Express + MCP server
│       └── src/
│           ├── index.ts      # Entry point, middleware, routes
│           ├── tools/        # MCP tool handlers
│           │   ├── status.ts
│           │   ├── decision.ts
│           │   ├── workspace.ts
│           │   ├── query.ts
│           │   └── auth.ts
│           └── services/     # Express middleware
│               ├── health.ts
│               ├── metrics.ts
│               ├── correlation.ts
│               └── rate-limiter.ts
├── packages/
│   ├── kernel/              # Domain types & repository ports
│   ├── capabilities/        # Business logic layer
│   ├── infrastructure/      # SQLite, file adapters, config
│   └── sdk/                 # Shared utilities
├── docs/                    # Documentation
├── src/test/                # Test configuration
└── package.json             # Workspace root
```

---

## Quick Start

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9

### Setup

```bash
# Clone the repository
git clone https://github.com/Jonhustleman/spyral-os.git
cd spyral-os

# Install dependencies
npm install

# Build all packages
npm run build

# Start the MCP server (development)
npm run dev
```

The MCP server starts on `http://localhost:3001` by default.

---

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run build` | Build all packages and apps |
| `npm run dev` | Start development server with Turbopack |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint across all packages |
| `npm test` | Run Vitest test suite |
| `npm run format` | Format code with Prettier |

---

## Technology Stack

| Component | Technology |
|-----------|-----------|
| Runtime | Node.js ≥ 18 |
| Framework | Next.js 16 (App Router) |
| HTTP Server | Express 5 |
| MCP SDK | @modelcontextprotocol/sdk ^1.16.1 |
| Database | SQLite (better-sqlite3) |
| Validation | Zod 3.24 |
| Testing | Vitest 4 |
| TypeScript | ^5.x |
| Monorepo | npm workspaces |

---

## API Overview

### HTTP Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Liveness probe |
| `/ready` | GET | Readiness probe (checks DB) |
| `/status` | GET | Full system status |
| `/metrics` | GET | Request metrics summary |
| `/sse` | POST | MCP SSE transport |
| `/messages` | POST | MCP message transport |

### MCP Tools

| Tool | Description |
|------|-------------|
| `spyral_get_status` | Get system status and version info |
| `spyral_create_decision` | Create an AI-driven decision |
| `spyral_get_decision` | Retrieve a decision by ID |
| `spyral_list_decisions` | List decisions with optional filters |
| `spyral_create_workspace` | Create a new workspace |
| `spyral_get_workspace` | Get workspace details |
| `spyral_register` | Register a new user |
| `spyral_login` | Authenticate and get session |
| `spyral_get_profile` | Get user profile |
| `spyral_logout` | End user session |

---

## Deployment

See [DEPLOYMENT.md](./docs/DEPLOYMENT.md) for detailed deployment instructions covering:

- Local development setup
- Production deployment
- Environment configuration
- Database migrations
- Backup & restore procedures

---

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](./docs/CONTRIBUTING.md) for guidelines.

---

## License

This project is licensed under the MIT License — see the [LICENSE](./LICENSE) file for details.

---

*Built with ❤️ by the SPYRAL OS Team*
