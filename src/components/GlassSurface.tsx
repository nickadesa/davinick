import { lazy, Suspense, type ReactNode } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { usePreferences } from "@/lib/preferences";
const Glass = lazy(() => import("@/vendor/glisse/src/glass").then((m) => ({ default: m.Glass })));
export function GlassSurface({ children, className = "" }: { children: ReactNode; className?: string }) {
  const { preferences } = usePreferences();
  if (!preferences.glass) return <div className={className}>{children}</div>;
  return <ClientOnly fallback={<div className={className}>{children}</div>}><Suspense fallback={<div className={className}>{children}</div>}><Glass className={`workspace-glass glass-${preferences.glassPreset.toLowerCase()} ${className}`}>{children}</Glass></Suspense></ClientOnly>;
}