"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Pill,
  Package,
  ShoppingCart,
  Users,
  Truck,
  ReceiptText,
  AlertTriangle,
  Settings,
  BarChart2,
  X,
  ChevronRight,
  ClipboardList,
} from "lucide-react";
import { useAuth } from "@/shared/hooks/useAuth";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const ALL_NAV_ITEMS = [
  {
    label: "Dashboard",
    href: "/admin/dashboard",
    icon: <LayoutDashboard size={18} />,
    roles: ["admin", "pharmacist"],
  },
  {
    label: "Medicines",
    href: "/admin/medicines",
    icon: <Pill size={18} />,
    roles: ["admin", "pharmacist"],
  },
  {
    label: "Inventory",
    href: "/admin/inventory",
    icon: <Package size={18} />,
    roles: ["admin", "pharmacist"],
  },
  {
    label: "POS Billing",
    href: "/admin/pos",
    icon: <ReceiptText size={18} />,
    roles: ["admin", "pharmacist"],
  },
  {
    label: "Orders",
    href: "/admin/orders",
    icon: <ShoppingCart size={18} />,
    roles: ["admin", "pharmacist"],
  },
  {
    label: "Prescriptions",
    href: "/admin/prescriptions",
    icon: <ClipboardList size={18} />,
    roles: ["admin", "pharmacist"],
  },
  {
    label: "Vendors",
    href: "/admin/vendors",
    icon: <Truck size={18} />,
    roles: ["admin", "pharmacist"],
  },
  {
    label: "Alerts",
    href: "/admin/alerts",
    icon: <AlertTriangle size={18} />,
    roles: ["admin", "pharmacist"],
  },
  {
    label: "Users",
    href: "/admin/users",
    icon: <Users size={18} />,
    roles: ["admin"],
  },
  {
    label: "Analytics",
    href: "/admin/analytics",
    icon: <BarChart2 size={18} />,
    roles: ["admin"],
  },
  {
    label: "Settings",
    href: "/admin/settings",
    icon: <Settings size={18} />,
    roles: ["admin"],
  },
];

const AdminSidebar = ({ isOpen, onClose }: SidebarProps) => {
  const pathname = usePathname();
  const { user } = useAuth();
  const navItems = ALL_NAV_ITEMS.filter((item) =>
    item.roles.includes(user?.role ?? "")
  );

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`border-accent-200 fixed top-0 left-0 z-50 flex h-dvh w-64 flex-col border-r bg-white transition-transform duration-300 lg:static lg:z-auto lg:translate-x-0 lg:transition-none ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar Header */}
        <div className="border-accent-200 flex h-16 items-center justify-between border-b px-5">
          <Link href="/admin/dashboard">
            <Image
              src="/logo.svg"
              alt="Sidheswar Drugs House"
              width={130}
              height={44}
              className="h-9 w-auto object-contain"
            />
          </Link>
          <button
            onClick={onClose}
            className="text-accent-400 hover:bg-accent-100 rounded-lg p-1 lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <p className="text-accent-400 mb-2 px-3 text-[10px] font-semibold tracking-widest uppercase">
            Main Menu
          </p>
          <ul className="space-y-0.5">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/admin/dashboard" &&
                  pathname.startsWith(item.href));
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={`group flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                      isActive
                        ? "bg-primary-500 text-white shadow-sm"
                        : "text-accent-600 hover:bg-accent-100 hover:text-accent-900"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span
                        className={
                          isActive
                            ? "text-white"
                            : "text-accent-400 group-hover:text-primary-500"
                        }
                      >
                        {item.icon}
                      </span>
                      {item.label}
                    </span>
                    {isActive && <ChevronRight size={14} />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Sidebar Footer */}
        <div className="border-accent-200 border-t px-5 py-4">
          <p className="text-accent-400 text-xs">SIDHESWAR DRUGS HOUSE</p>
          <p className="text-accent-300 text-[10px]">Admin Panel v1.0</p>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
