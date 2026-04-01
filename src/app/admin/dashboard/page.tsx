import type { Metadata } from "next";
import dynamic from "next/dynamic";
import AdminLayout from "@/shared/layouts/Admin/index";

export const metadata: Metadata = {
  title: "Dashboard | Admin",
  robots: { index: false, follow: false },
};

const DashboardPage = dynamic(
  () => import("@/features/admin/pages/DashboardPage"),
  {
    loading: () => (
      <div className="bg-accent-100 h-64 animate-pulse rounded-xl" />
    ),
  }
);

export default function AdminDashboardRoute() {
  return (
    <AdminLayout>
      <DashboardPage />
    </AdminLayout>
  );
}
