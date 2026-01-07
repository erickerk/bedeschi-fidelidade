"use client";

import { AppProvider } from "@/lib/app-context";
import { CacheCleaner } from "@/components/cache-cleaner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <CacheCleaner />
      {children}
    </AppProvider>
  );
}
