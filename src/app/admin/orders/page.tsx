import type { Metadata } from "next";
import dynamic from "next/dynamic";
import AdminLayout from "@/shared/layouts/Admin/index";

export const metadata: Metadata = {
  title: "Orders | Admin",
  robots: { index: false, follow: false },
};

const OrdersPage = dynamic(() => import("@/features/admin/pages/OrdersPage"), {
  loading: () => (
    <div className="bg-accent-100 h-64 animate-pulse rounded-xl" />
  ),
});

export default function AdminOrdersRoute() {
  return (
    <AdminLayout>
      <OrdersPage />
    </AdminLayout>
  );
}
