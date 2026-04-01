import type { Metadata } from "next";
import dynamic from "next/dynamic";
import StoreLayout from "@/shared/layouts/store";

export const metadata: Metadata = {
  title: "Your Cart",
  description:
    "Review the medicines in your cart, apply discounts, and proceed to checkout securely.",
  robots: { index: false, follow: false },
};

const CartPage = dynamic(() => import("@/features/store/pages/CartPage"), {
  loading: () => <div className="p-8 text-center text-sm">Loading cart...</div>,
});

export default function CartRoute() {
  return (
    <StoreLayout>
      <CartPage />
    </StoreLayout>
  );
}
