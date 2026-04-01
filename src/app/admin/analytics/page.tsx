import type { Metadata } from "next";
import dynamic from "next/dynamic";
import AdminLayout from "@/shared/layouts/Admin/index";

export const metadata: Metadata = {
  title: "Analytics | Admin",
  robots: { index: false, follow: false },
};

const AnalyticsPage = dynamic(
  () => import("@/features/admin/pages/AnalyticsPage"),
  {
    loading: () => (
      <div className="bg-accent-100 h-64 animate-pulse rounded-xl" />
    ),
  }
);

export default function AdminAnalyticsRoute() {
  return (
    <AdminLayout>
      <AnalyticsPage />
    </AdminLayout>
  );
}
