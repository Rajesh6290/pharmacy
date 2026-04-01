"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, ShoppingCart, ClipboardList, X } from "lucide-react";

interface UserSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const userNav = [
  { label: "My Account", href: "/users", icon: <User size={17} /> },
  {
    label: "My Orders",
    href: "/users/orders",
    icon: <ClipboardList size={17} />,
  },
  { label: "Cart", href: "/cart", icon: <ShoppingCart size={17} /> },
];

const UserSidebar = ({ isOpen, onClose }: UserSidebarProps) => {
  const pathname = usePathname();
  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`border-accent-200 fixed top-0 left-0 z-50 flex h-dvh w-60 flex-col border-r bg-white transition-transform duration-300 lg:static lg:z-auto lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="border-accent-200 flex h-16 items-center justify-between border-b px-5">
          <span className="text-accent-700 text-sm font-semibold">
            My Account
          </span>
          <button
            onClick={onClose}
            className="text-accent-400 hover:bg-accent-100 rounded p-1 lg:hidden"
          >
            <X size={17} />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-0.5">
            {userNav.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                      isActive
                        ? "bg-primary-500 text-white"
                        : "text-accent-600 hover:bg-accent-100"
                    }`}
                  >
                    <span
                      className={isActive ? "text-white" : "text-accent-400"}
                    >
                      {item.icon}
                    </span>
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
};

export default UserSidebar;
