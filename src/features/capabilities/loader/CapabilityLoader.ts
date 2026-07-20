/**
 * SPYRAL OS — Capability Loader (Features Layer)
 *
 * Handles dynamic loading, manifest validation, initialization,
 * and route mounting for capabilities.
 *
 * Responsibilities:
 *   - Resolve dependencies between capabilities
 *   - Validate capability manifests
 *   - Initialize capabilities
 *   - Mount/unmount routes
 *   - Expose navigation entries
 */

import type { Capability } from "@/kernel/contracts/Capability";
import type { CapabilityManifest } from "@/kernel/contracts/CapabilityManifest";
import { CapabilityRegistry } from "../registry/CapabilityRegistry";

// ─── Validation ────────────────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate a capability manifest against the schema.
 * Returns a list of validation errors (empty = valid).
 */
export function validateManifest(manifest: CapabilityManifest): ValidationResult {
  const errors: string[] = [];

  if (!manifest.title || manifest.title.trim().length === 0) {
    errors.push("Manifest must have a non-empty title.");
  }
  if (!manifest.description || manifest.description.trim().length === 0) {
    errors.push("Manifest must have a non-empty description.");
  }
  if (!manifest.author || manifest.author.trim().length === 0) {
    errors.push("Manifest must specify an author.");
  }
  if (!manifest.version || !/^\d+\.\d+\.\d+$/.test(manifest.version)) {
    errors.push("Manifest version must be valid SemVer (e.g. '1.0.0').");
  }
  if (!manifest.category || manifest.category.trim().length === 0) {
    errors.push("Manifest must specify a category.");
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate a full capability object.
 */
export function validateCapability(capability: Capability): ValidationResult {
  const errors: string[] = [];

  if (!capability.id || capability.id.trim().length === 0) {
    errors.push("Capability must have a non-empty id.");
  }
  if (!capability.name || capability.name.trim().length === 0) {
    errors.push("Capability must have a non-empty name.");
  }
  if (!capability.version || !/^\d+\.\d+\.\d+$/.test(capability.version)) {
    errors.push("Capability version must be valid SemVer (e.g. '1.0.0').");
  }
  if (!Array.isArray(capability.routes)) {
    errors.push("Capability routes must be an array.");
  }
  if (!Array.isArray(capability.permissions)) {
    errors.push("Capability permissions must be an array.");
  }

  // Validate nested manifest
  if (capability.manifest) {
    const manifestResult = validateManifest(capability.manifest);
    errors.push(...manifestResult.errors.map((e) => `manifest.${e}`));
  } else {
    errors.push("Capability must have a manifest.");
  }

  return { valid: errors.length === 0, errors };
}

// ─── Route Management ──────────────────────────────────────────────────────

export interface NavigationEntry {
  /** The route path. */
  path: string;

  /** Display label for navigation UI. */
  label: string;

  /** Optional icon identifier. */
  icon?: string;

  /** Parent capability ID. */
  capabilityId: string;
}

/**
 * Extract navigation entries from a capability.
 * Maps routes to displayable navigation items.
 */
export function getNavigationEntries(capability: Capability): NavigationEntry[] {
  // Use the capability name as the label for its primary route
  return capability.routes.map((route) => ({
    path: route,
    label: capability.manifest.title,
    icon: capability.icon,
    capabilityId: capability.id,
  }));
}

/**
 * Get all navigation entries from all enabled capabilities.
 */
export function getAllNavigationEntries(): NavigationEntry[] {
  const entries: NavigationEntry[] = [];
  for (const cap of CapabilityRegistry.getEnabled()) {
    entries.push(...getNavigationEntries(cap));
  }
  return entries;
}

// ─── Initialization ────────────────────────────────────────────────────────

export interface LoadResult {
  loaded: Capability[];
  failed: { capability: Capability; errors: string[] }[];
}

/**
 * Load and register capabilities, validating each one.
 * Invalid capabilities are rejected gracefully with error details.
 */
export function loadCapabilities(capabilities: Capability[]): LoadResult {
  const loaded: Capability[] = [];
  const failed: { capability: Capability; errors: string[] }[] = [];

  for (const cap of capabilities) {
    const validation = validateCapability(cap);
    if (!validation.valid) {
      failed.push({ capability: cap, errors: validation.errors });
      continue;
    }

    try {
      CapabilityRegistry.register(cap);
      loaded.push(cap);
    } catch (e) {
      failed.push({
        capability: cap,
        errors: [(e as Error).message],
      });
    }
  }

  return { loaded, failed };
}
