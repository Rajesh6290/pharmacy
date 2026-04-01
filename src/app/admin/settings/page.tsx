import type { Metadata } from "next";
import dynamic from "next/dynamic";
import AdminLayout from "@/shared/layouts/Admin/index";

export const metadata: Metadata = {
  title: "Settings | Admin",
  robots: { index: false, follow: false },
};

const SettingsPage = dynamic(
  () => import("@/features/admin/pages/SettingsPage"),
  {
    loading: () => (
      <div className="bg-accent-100 h-64 animate-pulse rounded-xl" />
    ),
  }
);

export default function AdminSettingsRoute() {
  return (
    <AdminLayout>
      <SettingsPage />
    </AdminLayout>
  );
}
