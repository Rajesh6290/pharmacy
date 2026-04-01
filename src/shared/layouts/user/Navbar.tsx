"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, LogOut, Menu } from "lucide-react";
import { useAuth } from "@/shared/hooks/useAuth";
import CustomButton from "@/shared/common/CustomButton";

interface UserNavbarProps {
  onToggleSidebar: () => void;
}

const UserNavbar = ({ onToggleSidebar }: UserNavbarProps) => {
  const { user, logout } = useAuth();
  return (
    <header className="border-accent-200 sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-white px-4 shadow-sm sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="text-accent-500 hover:bg-accent-100 rounded-lg p-1.5 lg:hidden"
        >
          <Menu size={20} />
        </button>
        <Link href="/store">
          <Image
            src="/logo.svg"
            alt="Sidheswar Drugs House"
            width={130}
            height={44}
            className="h-9 w-auto"
          />
        </Link>
      </div>
      <div className="flex items-center gap-3">
        <Link
          href="/cart"
          className="text-accent-600 hover:text-primary-600 p-2"
        >
          <ShoppingCart size={20} />
        </Link>
        <span className="text-accent-700 hidden text-sm font-medium sm:block">
          {user?.name?.split(" ")[0]}
        </span>
        <CustomButton
          variant="cancel"
          size="small"
          fullWidth={false}
          onClick={logout}
          startIcon={<LogOut size={14} />}
        >
          <span className="hidden sm:inline">Logout</span>
        </CustomButton>
      </div>
    </header>
  );
};

export default UserNavbar;
