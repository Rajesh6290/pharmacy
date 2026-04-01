import type { Metadata } from "next";
import dynamic from "next/dynamic";
import PublicLayout from "@/shared/layouts/public/Index";

export const metadata: Metadata = {
  title: "Create Account",
  description:
    "Create a free account at Sidheswar Drugs House to order medicines online, upload prescriptions, and track deliveries.",
  robots: { index: false, follow: false },
};

const RegisterPage = dynamic(
  () => import("@/features/auth/pages/RegisterPage"),
  { loading: () => <div className="bg-accent-50 min-h-dvh" /> }
);

export default function RegisterRoute() {
  return (
    <PublicLayout>
      <RegisterPage />
    </PublicLayout>
  );
}
