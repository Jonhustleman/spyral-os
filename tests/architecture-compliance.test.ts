/**
 * Architecture Compliance Test Suite
 *
 * Validates the hexagonal architecture layering rules:
 *   Kernel (ports) ← Capabilities (business logic) ← Infrastructure (adapters) ← MCP Tools (presentation)
 *
 * Rules enforced:
 *   1. Kernel must NOT import from Capabilities, Infrastructure, or MCP Server
 *   2. Capabilities may import from Kernel only
 *   3. Infrastructure may import from Kernel only (not from Capabilities)
 *   4. MCP Server may import from Kernel, Capabilities, and Infrastructure (composition root)
 *   5. No circular dependencies between packages
 *
 * Phase D.4 — Architecture Compliance
 */

import { describe, it, expect } from "vitest";
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

// ─── Helpers ────────────────────────────────────────────────────────────────

const ROOT = resolve(import.meta.dirname, "..");

function readPackageJson(pkgPath: string): { name: string; dependencies?: Record<string, string> } {
  const content = readFileSync(join(pkgPath, "package.json"), "utf-8");
  return JSON.parse(content);
}

// Use a simpler approach — check import statements in source files
function findImports(content: string): string[] {
  const imports: string[] = [];
  // Match both ESM and CJS import patterns
  const esmPattern = /from\s+['"](@spyral\/[^'"]+)['"]/g;
  const requirePattern = /require\(['"](@spyral\/[^'"]+)['"]\)/g;
  const dynamicPattern = /import\(['"](@spyral\/[^'"]+)['"]\)/g;

  let match;
  while ((match = esmPattern.exec(content)) !== null) {
    imports.push(match[1]);
  }
  while ((match = requirePattern.exec(content)) !== null) {
    imports.push(match[1]);
  }
  while ((match = dynamicPattern.exec(content)) !== null) {
    imports.push(match[1]);
  }
  return [...new Set(imports)];
}

const PACKAGES: Record<string, string> = {
  "@spyral/kernel": join(ROOT, "packages", "kernel"),
  "@spyral/capabilities": join(ROOT, "packages", "capabilities"),
  "@spyral/infrastructure": join(ROOT, "packages", "infrastructure"),
  "@spyral/sdk": join(ROOT, "packages", "sdk"),
};

const MCP_SERVER_PATH = join(ROOT, "apps", "mcp-server");

// ─── Allowed Dependencies Per Package ─────────────────────────────────────

// Package can only import from these @spyral/* packages
const ALLOWED_IMPORTS: Record<string, string[]> = {
  "@spyral/kernel": [], // Kernel is the innermost layer — no @spyral/* dependencies
  "@spyral/capabilities": ["@spyral/kernel"],
  "@spyral/infrastructure": ["@spyral/kernel"],
  "@spyral/sdk": ["@spyral/kernel"],
  // MCP server is the composition root — can import from all packages
};

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("Architecture Compliance — Hexagonal Layering", () => {
  describe("Layer 1: Kernel (innermost)", () => {
    const pkgPath = PACKAGES["@spyral/kernel"];

    it("must not depend on any @spyral/* package in package.json", () => {
      const pkg = readPackageJson(pkgPath);
      const deps = Object.keys(pkg.dependencies ?? {});
      const spyralDeps = deps.filter((d) => d.startsWith("@spyral/"));
      expect(spyralDeps).toEqual([]);
    });

    it("must not import from any @spyral/* package in source files", () => {
      const violations = findViolations(pkgPath);
      expect(violations).toEqual([]);
    });
  });

  describe("Layer 2: Capabilities", () => {
    const pkgPath = PACKAGES["@spyral/capabilities"];
    const allowed = ALLOWED_IMPORTS["@spyral/capabilities"];

    it("must only depend on @spyral/kernel in package.json", () => {
      const pkg = readPackageJson(pkgPath);
      const deps = Object.keys(pkg.dependencies ?? {});
      const spyralDeps = deps.filter((d) => d.startsWith("@spyral/"));
      for (const dep of spyralDeps) {
        expect(allowed).toContain(dep);
      }
    });

    it("must not import from @spyral/infrastructure or @spyral/sdk in source files", () => {
      const violations = findViolations(pkgPath, ...allowed);
      expect(violations).toEqual([]);
    });
  });

  describe("Layer 3: Infrastructure", () => {
    const pkgPath = PACKAGES["@spyral/infrastructure"];
    const allowed = ALLOWED_IMPORTS["@spyral/infrastructure"];

    it("must only depend on @spyral/kernel in package.json", () => {
      const pkg = readPackageJson(pkgPath);
      const deps = Object.keys(pkg.dependencies ?? {});
      const spyralDeps = deps.filter((d) => d.startsWith("@spyral/"));
      for (const dep of spyralDeps) {
        expect(allowed).toContain(dep);
      }
    });

    it("must not import from @spyral/capabilities or @spyral/sdk", () => {
      const violations = findViolations(pkgPath, ...allowed);
      expect(violations).toEqual([]);
    });
  });

  describe("Layer 4: SDK", () => {
    const pkgPath = PACKAGES["@spyral/sdk"];
    const allowed = ALLOWED_IMPORTS["@spyral/sdk"];

    it("must only depend on @spyral/kernel in package.json", () => {
      const pkg = readPackageJson(pkgPath);
      const deps = Object.keys(pkg.dependencies ?? {});
      const spyralDeps = deps.filter((d) => d.startsWith("@spyral/"));
      for (const dep of spyralDeps) {
        expect(allowed).toContain(dep);
      }
    });

    it("must not import from other spyral packages in source files", () => {
      const violations = findViolations(pkgPath, ...allowed);
      expect(violations).toEqual([]);
    });
  });

  describe("Composition Root: MCP Server", () => {
    it("may import from any @spyral/* package", () => {
      // MCP server is the composition root — no restrictions
      // Just verify it can find its dependencies
      const pkg = readPackageJson(MCP_SERVER_PATH);
      expect(pkg.dependencies).toBeDefined();
      expect(Object.keys(pkg.dependencies)).toContain("@spyral/kernel");
    });
  });

  describe("No Circular Dependencies", () => {
    it("must not have circular dependencies between spyral packages", () => {
      const graph = buildDependencyGraph();
      const cycles = detectCycles(graph);
      expect(cycles).toEqual([]);
    });
  });
});

// ─── Test Helpers ──────────────────────────────────────────────────────────

function findViolations(pkgPath: string, ...allowedImports: string[]): string[] {
  const violations: string[] = [];
  const srcDir = join(pkgPath, "src");
  if (!existsSync(srcDir)) return violations;

  function walk(dir: string) {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        walk(fullPath);
      } else if (entry.endsWith(".ts") && !entry.endsWith(".d.ts")) {
        const content = readFileSync(fullPath, "utf-8");
        const imports = findImports(content);
        for (const imp of imports) {
          if (imp.startsWith("@spyral/") && !allowedImports.includes(imp)) {
            violations.push(`${fullPath}: imports "${imp}"`);
          }
        }
      }
    }
  }

  walk(srcDir);
  return violations;
}

function buildDependencyGraph(): Record<string, string[]> {
  const graph: Record<string, string[]> = {};
  for (const [name, pkgPath] of Object.entries(PACKAGES)) {
    const pkg = readPackageJson(pkgPath);
    graph[name] = Object.keys(pkg.dependencies ?? {}).filter((d) => d.startsWith("@spyral/"));
  }
  return graph;
}

function detectCycles(graph: Record<string, string[]>): string[] {
  const cycles: string[] = [];
  const visited = new Set<string>();
  const recStack = new Set<string>();

  function dfs(node: string, path: string[]) {
    visited.add(node);
    recStack.add(node);

    for (const neighbor of graph[node] ?? []) {
      if (!visited.has(neighbor)) {
        dfs(neighbor, [...path, neighbor]);
      } else if (recStack.has(neighbor)) {
        // Found a cycle
        const cyclePath = [...path.slice(path.indexOf(neighbor)), neighbor];
        cycles.push(cyclePath.join(" → "));
      }
    }

    recStack.delete(node);
  }

  for (const node of Object.keys(graph)) {
    if (!visited.has(node)) {
      dfs(node, [node]);
    }
  }

  return cycles;
}
