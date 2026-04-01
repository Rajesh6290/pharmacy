import type { Metadata } from "next";
import dynamic from "next/dynamic";
import PublicLayout from "@/shared/layouts/public/Index";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description:
    "Read the terms and conditions governing the use of Sidheswar Drugs House online pharmacy services, including ordering, delivery, and returns.",
  alternates: { canonical: "/terms-and-conditions" },
  openGraph: {
    title: "Terms & Conditions | Sidheswar Drugs House",
    description: "Terms governing the use of our online pharmacy services.",
    url: "/terms-and-conditions",
    type: "website",
  },
};

const TermsPage = dynamic(() => import("@/features/public/pages/TermsPage"), {
  loading: () => (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-12">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-accent-100 h-24 animate-pulse rounded-xl" />
      ))}
    </div>
  ),
});

export default function TermsRoute() {
  return (
    <PublicLayout>
      <TermsPage />
    </PublicLayout>
  );
}
