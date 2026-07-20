/**
 * Navigation Studio Page — SPYRAL OS v0.2
 *
 * The front door of SPYRAL.
 * Per ADR-0046, this is the first product-layer capability.
 * Per ADR-0047, Navigation is conversational.
 * Per ADR-0048, NavigationSession is a product contract.
 *
 * Golden Rule: Never ask for information unless you can immediately use it.
 */

"use client";

import { NavigationStudio } from "@/features/navigation/components/NavigationStudio";

export default function NavigatePage() {
  return (
    <div className="flex-1 w-full">
      <NavigationStudio />
    </div>
  );
}
