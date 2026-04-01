import type { Metadata } from "next";
import dynamic from "next/dynamic";
import StoreLayout from "@/shared/layouts/store/index";

export const metadata: Metadata = {
  title: "Shop Medicines",
  description:
    "Browse and buy genuine prescription and over-the-counter medicines online. Filter by category, search by name, and checkout securely.",
  keywords:
    "buy medicines online, OTC medicines, prescription drugs, medicine store, pharmacy shop",
  alternates: { canonical: "/store" },
  openGraph: {
    title: "Shop Medicines | Sidheswar Drugs House",
    description:
      "Browse 1000+ genuine medicines. Filter by category, search by name, and checkout securely.",
    url: "/store",
    type: "website",
  },
};

const StorePage = dynamic(() => import("@/features/store/pages/StorePage"), {
  loading: () => (
    <div className="bg-accent-100 h-64 animate-pulse rounded-xl" />
  ),
});

export default function StoreRoute() {
  return (
    <StoreLayout>
      <StorePage />
    </StoreLayout>
  );
}
