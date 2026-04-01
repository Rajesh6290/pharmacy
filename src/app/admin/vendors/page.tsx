import type { Metadata } from "next";
import dynamic from "next/dynamic";
import AdminLayout from "@/shared/layouts/Admin/index";

export const metadata: Metadata = {
  title: "Vendors | Admin",
  robots: { index: false, follow: false },
};

const VendorsPage = dynamic(
  () => import("@/features/admin/pages/VendorsPage"),
  {
    loading: () => (
      <div className="bg-accent-100 h-64 animate-pulse rounded-xl" />
    ),
  }
);

export default function AdminVendorsRoute() {
  return (
    <AdminLayout>
      <VendorsPage />
    </AdminLayout>
  );
}
