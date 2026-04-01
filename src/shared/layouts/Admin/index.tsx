"use client";

import { useEffect } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import AdminNavbar from "./Navbar";
import AdminSidebar from "./Sidebar";
import { useAuth } from "@/shared/hooks/useAuth";

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  const isStaff = user?.role === "admin" || user?.role === "pharmacist";

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || !isStaff) {
      router.replace("/login?redirect=/admin/dashboard");
    }
  }, [isLoading, isAuthenticated, isStaff, router]);

  if (isLoading || !isAuthenticated || !isStaff) {
    return (
      <div className="bg-accent-50 flex h-dvh items-center justify-center">
        <div className="border-primary-200 border-t-primary-600 h-10 w-10 animate-spin rounded-full border-4" />
      </div>
    );
  }

  return (
    <div className="bg-accent-50 flex h-dvh overflow-hidden">
      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminNavbar onToggleSidebar={() => setSidebarOpen((v) => !v)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;
