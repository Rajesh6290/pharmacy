import type { Metadata } from "next";
import dynamic from "next/dynamic";
import AdminLayout from "@/shared/layouts/Admin/index";

export const metadata: Metadata = {
  title: "Inventory | Admin",
  robots: { index: false, follow: false },
};

const InventoryPage = dynamic(
  () => import("@/features/admin/pages/InventoryPage"),
  {
    loading: () => (
      <div className="bg-accent-100 h-64 animate-pulse rounded-xl" />
    ),
  }
);

export default function AdminInventoryRoute() {
  return (
    <AdminLayout>
      <InventoryPage />
    </AdminLayout>
  );
}
