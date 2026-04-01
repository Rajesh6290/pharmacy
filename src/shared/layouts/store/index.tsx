"use client";

import { CartProvider } from "@/features/store/store/cartContext";
import StoreNavbar from "./Navbar";
import Footer from "@/shared/layouts/public/Footer";

const StoreLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <CartProvider>
      <div className="bg-accent-50 flex min-h-dvh flex-col">
        <StoreNavbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </CartProvider>
  );
};

export default StoreLayout;
