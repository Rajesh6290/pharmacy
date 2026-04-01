import type { Metadata } from "next";
import dynamic from "next/dynamic";
import PublicLayout from "@/shared/layouts/public/Index";

export const metadata: Metadata = {
  title: "Online Pharmacy — Medicines Delivered to Your Door",
  description:
    "Shop genuine prescription & OTC medicines at Sidheswar Drugs House. Upload your prescription, browse 1000+ medicines, and get fast delivery.",
  keywords:
    "online pharmacy, buy medicines, OTC medicines, prescription medicines, medicine delivery, Sidheswar Drugs House",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Sidheswar Drugs House — Online Pharmacy",
    description:
      "Shop genuine prescription & OTC medicines. Upload your prescription and get fast delivery.",
    url: "/",
    type: "website",
  },
};

const LandingPage = dynamic(
  () => import("@/features/public/pages/LandingPage"),
  { loading: () => <div className="min-h-dvh bg-white" /> }
);

export default function Home() {
  return (
    <PublicLayout>
      <LandingPage />
    </PublicLayout>
  );
}
