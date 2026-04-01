import type { Metadata } from "next";
import dynamic from "next/dynamic";
import AdminLayout from "@/shared/layouts/Admin/index";

export const metadata: Metadata = {
  title: "Alerts | Admin",
  robots: { index: false, follow: false },
};

const AlertsPage = dynamic(() => import("@/features/admin/pages/AlertsPage"), {
  loading: () => (
    <div className="bg-accent-100 h-64 animate-pulse rounded-xl" />
  ),
});

export default function AdminAlertsRoute() {
  return (
    <AdminLayout>
      <AlertsPage />
    </AdminLayout>
  );
}
