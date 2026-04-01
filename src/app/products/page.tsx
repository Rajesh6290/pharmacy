import type { Metadata } from "next";
import dynamic from "next/dynamic";
import PublicLayout from "@/shared/layouts/public/Index";

export const metadata: Metadata = {
  title: "All Medicines",
  description:
    "Browse our full catalogue of prescription and over-the-counter medicines. Filter by category and find what you need at Sidheswar Drugs House.",
  keywords:
    "medicines catalogue, all medicines, OTC drugs, prescription medicines, pharmacy catalogue",
  alternates: { canonical: "/products" },
  openGraph: {
    title: "All Medicines | Sidheswar Drugs House",
    description:
      "Browse prescription and OTC medicines. Filter by category and find what you need.",
    url: "/products",
    type: "website",
  },
};

const ProductsPage = dynamic(
  () => import("@/features/public/pages/ProductsPage"),
  {
    loading: () => (
      <div className="mx-auto max-w-360 px-4 py-8">
        <div className="bg-accent-100 mb-4 h-10 w-64 animate-pulse rounded-lg" />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="bg-accent-100 h-64 animate-pulse rounded-2xl"
            />
          ))}
        </div>
      </div>
    ),
  }
);

export default function ProductsRoute() {
  return (
    <PublicLayout>
      <ProductsPage />
    </PublicLayout>
  );
}
