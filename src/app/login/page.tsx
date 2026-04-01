import type { Metadata } from "next";
import dynamic from "next/dynamic";
import PublicLayout from "@/shared/layouts/public/Index";

export const metadata: Metadata = {
  title: "Login",
  description:
    "Sign in to your Sidheswar Drugs House account to manage orders, track deliveries, and upload prescriptions.",
  robots: { index: false, follow: false },
};

const LoginPage = dynamic(() => import("@/features/auth/pages/LoginPage"), {
  loading: () => <div className="bg-accent-50 min-h-dvh" />,
});

export default function LoginRoute() {
  return (
    <PublicLayout>
      <LoginPage />
    </PublicLayout>
  );
}
