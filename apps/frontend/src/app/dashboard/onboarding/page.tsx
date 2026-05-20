"use client";

/** Onboarding gateway — checks user onboarding status via API and renders either the onboarding flow or the main dashboard. Acts as a routing guard for new users. */
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { OnboardingFlow } from "@/components/OnboardingFlow";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/hooks/useAuth";
import { getOnboardingStatus } from "@/lib/api";
import DashboardPage from "../page";

type PageState = "loading" | "onboarding" | "dashboard";

/**
 * Checks getOnboardingStatus on mount. Shows spinner while loading, renders OnboardingFlow if not completed,
 * or DashboardPage if completed. Handles missing backend by defaulting to onboarding.
 */
export default function DashboardWithOnboarding() {
  const { darkMode } = useTheme();
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [pageState, setPageState] = useState<PageState>("loading");

  useEffect(() => {
    // Esperar a que useAuth resuelva
    if (!user?.id) return;

    const checkOnboarding = async () => {
      try {
        const status = await getOnboardingStatus(user.id!);
        if (status.onboarding_completed) {
          setPageState("dashboard");
        } else {
          setPageState("onboarding");
        }
      } catch {
        // Si falla el backend, asumir que no ha completado onboarding
        setPageState("onboarding");
      }
    };

    checkOnboarding();
  }, [user?.id]);

  const handleOnboardingComplete = () => {
    setPageState("dashboard");
  };

  // Theme-aware loading background
  const bg = darkMode ? "bg-[#0f1117]" : "bg-[#faf9f7]";

  // Show loading state while checking onboarding status
  if (pageState === "loading" || !user?.id) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${bg} transition-colors duration-300`}
      >
        <div className="w-8 h-8 border-2 border-[#f59e0b] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // If user not onboarded, show onboarding flow; otherwise show dashboard
  if (pageState === "onboarding") {
    return (
      <OnboardingFlow userId={user.id} onComplete={handleOnboardingComplete} />
    );
  }

  // If not authenticated, fallback (guarded by ProtectedRoute at layout)
  if (!isAuthenticated) {
    return null;
  }

  // Show dashboard
  return <DashboardPage />;
}
