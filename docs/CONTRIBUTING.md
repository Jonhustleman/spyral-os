# Contributing to SPYRAL OS

> **Document Version:** v1.0.0  
> **Last Updated:** 2026-07-20

Thank you for your interest in contributing to SPYRAL OS! This document provides guidelines for contributing to the project.

---

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Workflow](#development-workflow)
4. [Project Structure](#project-structure)
5. [Coding Standards](#coding-standards)
6. [Testing Guidelines](#testing-guidelines)
7. [Pull Request Process](#pull-request-process)
8. [Architecture Decisions](#architecture-decisions)

---

## Code of Conduct

By participating in this project, you agree to:

- Be respectful and inclusive
- Focus on constructive feedback
- Accept responsibility for your contributions
- Prioritize what's best for the community

---

## Getting Started

### Prerequisites

- Node.js ≥ 18.x
- npm ≥ 9.x
- Git
- A code editor (VS Code recommended)

### Setup

```bash
# Fork the repository
git clone https://github.com/YOUR_USERNAME/spyral-os.git
cd spyral-os

# Add upstream remote
git remote add upstream https://github.com/Jonhustleman/spyral-os.git

# Install dependencies
npm install

# Build all packages
npm run build

# Verify setup
npm test
```

---

## Development Workflow

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
```

Branch naming conventions:
- `feature/*` — New features
- `fix/*` — Bug fixes
- `docs/*` — Documentation changes
- `refactor/*` — Code refactoring
- `test/*` — Test additions or modifications

### 2. Make Changes

- Follow the [coding standards](#coding-standards)
- Write or update tests
- Update documentation as needed
- Keep changes focused and atomic

### 3. Run Tests

```bash
# Run all tests
npm test

# Run with coverage
npx vitest --coverage

# Run specific tests
npx vitest packages/capabilities/src/__tests__/

# Architecture compliance
npx vitest src/test/architecture-compliance.test.ts
```

### 4. Commit Changes

```bash
git add .
git commit -m "type: brief description"
```

Commit message format:

```
<type>: <description>

[optional body]

[optional footer]
```

Types:
- `feat` — New feature
- `fix` — Bug fix
- `docs` — Documentation
- `refactor` — Code refactoring
- `test` — Test changes
- `chore` — Build/config changes

### 5. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

---

## Project Structure

```
spyral-os/
├── apps/
│   └── mcp-server/          # Express + MCP server
│       └── src/
│           ├── index.ts      # Entry point
│           ├── tools/        # MCP tool handlers
│           └── services/     # Express middleware
├── packages/
│   ├── kernel/              # Domain types & ports
│   ├── capabilities/        # Business logic
│   ├── infrastructure/      # Adapters & I/O
│   └── sdk/                 # Shared utilities
├── docs/                    # Documentation
├── src/test/                # Test config
└── package.json             # Workspace root
```

### Package Relationships

```
@spyral-os/mcp-server → @spyral-os/infrastructure → @spyral-os/capabilities → @spyral-os/kernel
```

---

## Coding Standards

### TypeScript

- Use **strict TypeScript** configuration
- Prefer `interface` over `type` for object shapes
- Use `type` for unions, intersections, and primitives
- Explicitly define return types for public APIs
- Use `as const` for literal types
- Avoid `any` — use `unknown` if type is truly unknown

### Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Classes | PascalCase | `DecisionCapability` |
| Interfaces | PascalCase | `DecisionRepository` |
| Types | PascalCase | `SystemStatus` |
| Functions | camelCase | `createDecision()` |
| Variables | camelCase | `decisionId` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| Files | kebab-case | `decision-repository.ts` |
| Directories | kebab-case | `sqlite-repositories/` |

### Imports Order

1. External dependencies (npm packages)
2. Internal project packages (`@spyral-os/*`)
3. Relative imports

```typescript
import { z } from 'zod';
import { Decision } from '@spyral-os/kernel';
import { validateConfig } from './config-validator';
```

### Formatting

- Use **Prettier** for code formatting
- Run `npm run format` before committing
- Use 2-space indentation
- Maximum line length: 100 characters
- Semicolons required
- Single quotes preferred

### Linting

ESLint is configured with:
- `@typescript-eslint` rules
- Import ordering
- No unused variables
- Prefer const over let

```bash
npm run lint
```

---

## Testing Guidelines

### Test Types

| Test Type | Location | Purpose |
|-----------|----------|---------|
| Unit Tests | `*.test.ts` alongside source | Test individual functions/classes |
| Integration Tests | `src/test/` | Test cross-layer interaction |
| Architecture Tests | `src/test/architecture-compliance.test.ts` | Enforce layer rules |

### Writing Tests

```typescript
import { describe, it, expect } from 'vitest';

describe('DecisionCapability', () => {
  it('should create a decision with valid input', () => {
    // Arrange
    const capability = new DecisionCapability(mockRepository);
    
    // Act
    const decision = capability.createDecision({
      title: 'Test',
      description: 'Test description'
    });
    
    // Assert
    expect(decision.title).toBe('Test');
    expect(decision.status).toBe('pending');
  });
});
```

### Testing Principles

1. **Test behavior, not implementation**
2. **Mock external dependencies** (repositories, services)
3. **Arrange-Act-Assert** pattern
4. **Descriptive test names** — should read like a sentence
5. **One assertion per test** where practical
6. **Cover edge cases** — empty input, invalid data, error conditions

---

## Pull Request Process

### Before Submitting

1. [ ] All tests pass (`npm test`)
2. [ ] Linting passes (`npm run lint`)
3. [ ] Code is formatted (`npm run format`)
4. [ ] Documentation is updated if needed
5. [ ] Architecture compliance tests pass
6. [ ] No new TypeScript errors

### PR Template

```markdown
## Description
Brief description of the changes.

## Type of Change
- [ ] feat: New feature
- [ ] fix: Bug fix
- [ ] docs: Documentation
- [ ] refactor: Code refactoring
- [ ] test: Test changes
- [ ] chore: Build/config

## How Has This Been Tested?
- [ ] Unit tests
- [ ] Integration tests
- [ ] Manual testing

## Checklist
- [ ] My code follows the project style
- [ ] I have updated the documentation
- [ ] All tests pass
- [ ] No new TypeScript errors
```

### Review Process

1. At least one maintainer review required
2. All automated checks must pass
3. Address review feedback promptly
4. Squash commits before merging

---

## Architecture Decisions

### Hexagonal Architecture

SPYRAL OS uses hexagonal architecture (ports and adapters):

- **Kernel** — Domain types and repository interfaces (ports)
- **Capabilities** — Business logic (use cases)
- **Infrastructure** — Adapters (SQLite, file system)
- **MCP Server** — Presentation (HTTP transport)

### Layer Rules

```
Kernel ← Capabilities ← Infrastructure ← MCP Server
```

- Inner layers never import from outer layers
- No circular dependencies
- Repository interfaces in kernel, implementations in infrastructure

### Key Patterns

- **Dependency Injection** — Capabilities receive repository interfaces
- **Repository Pattern** — Data access abstracted behind interfaces
- **Unit of Work** — Transactional operations
- **Middleware Chain** — Cross-cutting concerns in HTTP layer

---

## Getting Help

- **Issues** — Use GitHub Issues for bugs and feature requests
- **Discussions** — Use GitHub Discussions for questions
- **Documentation** — See `docs/` for detailed guides

---

*Thank you for contributing to SPYRAL OS!*
