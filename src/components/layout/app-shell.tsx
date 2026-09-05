"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "./sidebar";
import { BottomNav } from "./bottom-nav";
import { MobileTopbar } from "./mobile-topbar";
import { useAppStore } from "@/lib/store";
import { PinLockScreen } from "@/components/pin-lock-screen";
import { Skeleton } from "@/components/ui/skeleton";

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const hydrated = useAppStore((s) => s.hydrated);
  const onboardingComplete = useAppStore((s) => s.settings.onboardingComplete);
  const pinEnabled = useAppStore((s) => s.settings.pinEnabled);
  const pinHash = useAppStore((s) => s.settings.pinHash);
  const closeCompletedMonths = useAppStore((s) => s.closeCompletedMonths);
  const [unlocked, setUnlocked] = React.useState(false);

  React.useEffect(() => {
    if (hydrated && !onboardingComplete) {
      router.replace("/onboarding");
    }
  }, [hydrated, onboardingComplete, router]);

  React.useEffect(() => {
    if (hydrated && onboardingComplete) {
      closeCompletedMonths();
    }
  }, [hydrated, onboardingComplete, closeCompletedMonths]);

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="w-full max-w-sm space-y-3">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (!onboardingComplete) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Skeleton className="h-8 w-40" />
      </div>
    );
  }

  if (pinEnabled && pinHash && !unlocked) {
    return <PinLockScreen pinHash={pinHash} onUnlock={() => setUnlocked(true)} />;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <MobileTopbar />
        <main className="flex-1 pb-24 md:pb-8">{children}</main>
        <BottomNav />
      </div>
    </div>
  );
}
