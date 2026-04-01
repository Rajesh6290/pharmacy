import React from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";

const PublicLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
};

export default PublicLayout;
