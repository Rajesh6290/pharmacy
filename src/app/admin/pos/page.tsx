import type { Metadata } from "next";
import dynamic from "next/dynamic";
import AdminLayout from "@/shared/layouts/Admin/index";

export const metadata: Metadata = {
  title: "POS Billing | Admin",
  robots: { index: false, follow: false },
};

const POSPage = dynamic(() => import("@/features/admin/pages/POSPage"), {
  loading: () => (
    <div className="bg-accent-100 h-64 animate-pulse rounded-xl" />
  ),
});

export default function AdminPOSRoute() {
  return (
    <AdminLayout>
      <POSPage />
    </AdminLayout>
  );
}
