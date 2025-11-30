"use client";

import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isInitialized } = useSelector((state: RootState) => state.auth);
  const router = useRouter();

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.replace("/auth/login");
    }
  }, [isAuthenticated, isInitialized, router]);

  if (!isInitialized) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
