/**
 * Execution Studio — Sprint 6 route page.
 *
 * Renders the ExecutionStudio component for managing plans, milestones, and tasks.
 * Per ADR-0030, the route is /execution but the visible title is "Execution Studio".
 */

"use client";

import { ExecutionStudio } from "@/features/execution";

export default function ExecutionStudioPage() {
  return (
    <div className="flex-1 px-6 py-8 max-w-6xl mx-auto w-full">
      <ExecutionStudio />
    </div>
  );
}
