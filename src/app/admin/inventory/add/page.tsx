import type { Metadata } from "next";
import dynamic from "next/dynamic";
import AdminLayout from "@/shared/layouts/Admin/index";

export const metadata: Metadata = {
  title: "Add Inventory | Admin",
  robots: { index: false, follow: false },
};

const AddInventoryPage = dynamic(
  () => import("@/features/admin/pages/AddInventoryPage"),
  {
    loading: () => (
      <div className="bg-accent-100 h-64 animate-pulse rounded-xl" />
    ),
  }
);

export default function AddInventoryRoute() {
  return (
    <AdminLayout>
      <AddInventoryPage />
    </AdminLayout>
  );
}
