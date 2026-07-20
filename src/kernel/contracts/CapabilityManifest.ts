/**
 * SPYRAL OS — Kernel Contract
 * CapabilityManifest — metadata descriptor for every installable module.
 *
 * Rule #005: Everything installable must expose a manifest.
 *
 * Eventually applies to: Workspaces, Experts, Reports, Themes, Integrations.
 */
export interface CapabilityManifest {
  /** Short display title (e.g. "Command Center"). */
  title: string;

  /** One-sentence description of what this capability provides. */
  description: string;

  /** Creator or organization name (e.g. "SPYRAL", "Community"). */
  author: string;

  /** SemVer version of the manifest schema / capability version. */
  version: string;

  /** Category grouping for UI organization (e.g. "core", "business", "medical"). */
  category: string;
}
