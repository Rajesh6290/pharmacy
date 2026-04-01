"use client";

import { useEffect } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import UserNavbar from "./Navbar";
import UserSidebar from "./Sidebar";
import { useAuth } from "@/shared/hooks/useAuth";

const UserLayout = ({ children }: { children: React.ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace("/login?redirect=/users");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="bg-accent-50 flex h-dvh items-center justify-center">
        <div className="border-primary-200 border-t-primary-600 h-10 w-10 animate-spin rounded-full border-4" />
      </div>
    );
  }

  return (
    <div className="bg-accent-50 flex h-dvh flex-col overflow-hidden">
      <UserNavbar onToggleSidebar={() => setSidebarOpen((v) => !v)} />
      <div className="flex flex-1 overflow-hidden">
        <UserSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
};

export default UserLayout;
