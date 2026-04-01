import type { Metadata } from "next";
import dynamic from "next/dynamic";
import AdminLayout from "@/shared/layouts/Admin/index";

export const metadata: Metadata = {
  title: "Users | Admin",
  robots: { index: false, follow: false },
};

const UsersPage = dynamic(() => import("@/features/admin/pages/UsersPage"), {
  loading: () => (
    <div className="bg-accent-100 h-64 animate-pulse rounded-xl" />
  ),
});

export default function AdminUsersRoute() {
  return (
    <AdminLayout>
      <UsersPage />
    </AdminLayout>
  );
}
