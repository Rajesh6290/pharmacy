import type { Metadata } from "next";
import dynamic from "next/dynamic";
import AdminLayout from "@/shared/layouts/Admin/index";

export const metadata: Metadata = {
  title: "Medicines | Admin",
  robots: { index: false, follow: false },
};

const MedicinesPage = dynamic(
  () => import("@/features/admin/pages/MedicinesPage"),
  {
    loading: () => (
      <div className="bg-accent-100 h-64 animate-pulse rounded-xl" />
    ),
  }
);

export default function AdminMedicinesRoute() {
  return (
    <AdminLayout>
      <MedicinesPage />
    </AdminLayout>
  );
}
