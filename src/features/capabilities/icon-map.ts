/**
 * Capability Icon Map — Maps capability icon identifiers to Lucide components.
 * Used by Sidebar, BottomNav, and other UI components to render capability icons.
 */

import {
  Compass,
  Command,
  Navigation,
  BookOpen,
  Settings,
  Briefcase,
  Layers,
  GitBranch,
  Play,
  BarChart3,
  Brain,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  Compass,
  Command,
  Navigation,
  BookOpen,
  Settings,
  Briefcase,
  Layers,
  GitBranch,
  Play,
  BarChart3,
  Brain,
};

/**
 * Resolve a capability icon identifier to a Lucide icon component.
 * Falls back to Layers if the icon is not found.
 */
export function getCapabilityIcon(iconId?: string): LucideIcon {
  if (iconId && iconId in iconMap) {
    return iconMap[iconId]!;
  }
  return Layers;
}
