/**
 * Validation Studio — Sprint 7 route page.
 *
 * Renders the ValidationStudio component for comparing expected vs observed results.
 * Per ADR-0030, the route is /validation but the visible title is "Validation Studio".
 */

"use client";

import { ValidationStudio } from "@/features/validation";

export default function ValidationStudioPage() {
  return (
    <div className="flex-1 px-6 py-8 max-w-6xl mx-auto w-full">
      <ValidationStudio />
    </div>
  );
}
