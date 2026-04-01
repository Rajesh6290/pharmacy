import type { Metadata } from "next";
import dynamic from "next/dynamic";
import AdminLayout from "@/shared/layouts/Admin/index";

export const metadata: Metadata = {
  title: "Prescriptions | Admin — Sidheswar Drugs House",
  description:
    "Review customer prescription uploads and manage follow-up calls.",
  robots: { index: false, follow: false },
};

const PrescriptionsPage = dynamic(
  () => import("@/features/admin/pages/PrescriptionsPage"),
  {
    loading: () => (
      <div className="bg-accent-100 h-64 animate-pulse rounded-xl" />
    ),
  }
);

export default function AdminPrescriptionsRoute() {
  return (
    <AdminLayout>
      <PrescriptionsPage />
    </AdminLayout>
  );
}
