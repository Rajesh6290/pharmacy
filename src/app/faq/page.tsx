import type { Metadata } from "next";
import dynamic from "next/dynamic";
import PublicLayout from "@/shared/layouts/public/Index";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description:
    "Answers to common questions about ordering medicines, prescription uploads, delivery, returns, and payment at Sidheswar Drugs House.",
  keywords:
    "pharmacy FAQ, medicine delivery questions, prescription upload help, pharmacy help",
  alternates: { canonical: "/faq" },
  openGraph: {
    title: "FAQ | Sidheswar Drugs House",
    description:
      "Answers to common questions about ordering, delivery, and prescriptions.",
    url: "/faq",
    type: "website",
  },
};

const FaqPage = dynamic(() => import("@/features/public/pages/FaqPage"), {
  loading: () => (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-12">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="bg-accent-100 h-14 animate-pulse rounded-xl" />
      ))}
    </div>
  ),
});

export default function FAQRoute() {
  return (
    <PublicLayout>
      <FaqPage />
    </PublicLayout>
  );
}
