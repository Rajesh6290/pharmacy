import type { Metadata } from "next";
import dynamic from "next/dynamic";
import StoreLayout from "@/shared/layouts/store/index";

export const metadata: Metadata = {
  title: "Upload Prescription | Sidheswar Drugs House",
  description:
    "Securely upload your doctor's prescription. Our licensed pharmacist will review it and call you to help fulfil your medicine order.",
  keywords:
    "upload prescription, online pharmacy, buy prescription medicines, Sidheswar Drugs House",
  robots: { index: true, follow: true },
  openGraph: {
    title: "Upload Your Prescription — Sidheswar Drugs House",
    description:
      "Upload your doctor's prescription securely. A pharmacist reviews it and calls you back.",
    url: "/prescription",
    siteName: "Sidheswar Drugs House",
    type: "website",
    images: [
      {
        url: "/logo.svg",
        width: 400,
        height: 133,
        alt: "Sidheswar Drugs House Logo",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Upload Prescription | Sidheswar Drugs House",
    description:
      "Securely upload your prescription. A pharmacist reviews it and calls you back.",
  },
};

const PrescriptionUploadPage = dynamic(
  () => import("@/features/public/pages/PrescriptionUploadPage"),
  {
    loading: () => (
      <div className="bg-accent-100 h-64 animate-pulse rounded-xl" />
    ),
  }
);

export default function PrescriptionRoute() {
  return (
    <StoreLayout>
      <PrescriptionUploadPage />
    </StoreLayout>
  );
}
