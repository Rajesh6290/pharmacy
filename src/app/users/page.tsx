import type { Metadata } from "next";
import dynamic from "next/dynamic";
import UserLayout from "@/shared/layouts/user/index";

export const metadata: Metadata = {
  title: "My Orders",
  description:
    "View your order history, track deliveries, and manage your account at Sidheswar Drugs House.",
  robots: { index: false, follow: false },
};

const UserDashboardPage = dynamic(
  () => import("@/features/user/pages/UserDashboardPage"),
  {
    loading: () => (
      <div className="bg-accent-100 h-64 animate-pulse rounded-xl" />
    ),
  }
);

export default function UsersRoute() {
  return (
    <UserLayout>
      <UserDashboardPage />
    </UserLayout>
  );
}
