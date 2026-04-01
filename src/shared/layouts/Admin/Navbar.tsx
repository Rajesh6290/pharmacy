"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Bell,
  LogOut,
  User,
  Menu,
  CalendarX,
  AlertTriangle,
  ShoppingCart,
  FileText,
  X,
} from "lucide-react";
import { useRef, useEffect, useState } from "react";
import { useAuth } from "@/shared/hooks/useAuth";
import useSwr from "@/shared/hooks/useSwr";

interface NotificationData {
  expiry: number;
  lowStock: number;
  newOrders: number;
  prescriptions: number;
  total: number;
}

interface AdminNavbarProps {
  onToggleSidebar: () => void;
}

const AdminNavbar = ({ onToggleSidebar }: AdminNavbarProps) => {
  const { user, logout } = useAuth();
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const { data } = useSwr("admin/notifications", {
    refreshInterval: 60_000,
  });
  const notif: NotificationData | undefined = data;

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const notifications = [
    {
      key: "expiry",
      count: notif?.expiry ?? 0,
      label: "Expiry Alerts",
      description: "Batches expiring within 30 days",
      icon: <CalendarX size={16} />,
      iconBg: "bg-error-100 text-error-600",
      href: "/admin/alerts",
    },
    {
      key: "lowStock",
      count: notif?.lowStock ?? 0,
      label: "Low Stock",
      description: "Medicines below stock threshold",
      icon: <AlertTriangle size={16} />,
      iconBg: "bg-warning-100 text-warning-600",
      href: "/admin/alerts",
    },
    {
      key: "newOrders",
      count: notif?.newOrders ?? 0,
      label: "New Orders",
      description: "Pending orders awaiting action",
      icon: <ShoppingCart size={16} />,
      iconBg: "bg-tertiary-100 text-tertiary-600",
      href: "/admin/orders",
    },
    {
      key: "prescriptions",
      count: notif?.prescriptions ?? 0,
      label: "Prescription Review",
      description: "Uploaded prescriptions pending review",
      icon: <FileText size={16} />,
      iconBg: "bg-secondary-100 text-secondary-600",
      href: "/admin/orders",
    },
  ];

  const totalCount = notif?.total ?? 0;

  return (
    <header className="border-accent-200 sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-white px-4 shadow-sm sm:px-6">
      {/* Left: Hamburger + Logo */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="text-accent-500 hover:bg-accent-100 hover:text-accent-800 rounded-lg p-1.5 lg:hidden"
          aria-label="Toggle sidebar"
        >
          <Menu size={20} />
        </button>
        <Link href="/admin/dashboard" className="flex items-center">
          <Image
            src="/logo.svg"
            alt="Sidheswar Drugs House"
            width={130}
            height={44}
            className="h-9 w-auto object-contain"
          />
        </Link>
        <span className="bg-primary-50 text-primary-700 hidden rounded-md px-2 py-0.5 text-xs font-semibold capitalize sm:inline">
          {user?.role ?? "Admin"}
        </span>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Notification Bell */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setNotifOpen((p) => !p)}
            className="text-accent-500 hover:bg-accent-100 hover:text-accent-800 relative rounded-lg p-2 transition-colors"
            aria-label="Notifications"
          >
            <Bell size={18} />
            {totalCount > 0 && (
              <span className="bg-error-500 absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white">
                {totalCount > 99 ? "99+" : totalCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="border-accent-100 absolute right-0 mt-2 w-80 rounded-xl border bg-white shadow-xl">
              {/* Header */}
              <div className="border-accent-100 flex items-center justify-between border-b px-4 py-3">
                <div>
                  <p className="text-accent-900 text-sm font-semibold">
                    Notifications
                  </p>
                  <p className="text-accent-400 text-xs">
                    {totalCount > 0
                      ? `${totalCount} item${totalCount > 1 ? "s" : ""} need${totalCount === 1 ? "s" : ""} attention`
                      : "All clear — nothing needs attention"}
                  </p>
                </div>
                <button
                  onClick={() => setNotifOpen(false)}
                  className="text-accent-400 hover:text-accent-700 rounded p-0.5"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Notification rows */}
              <div className="divide-accent-50 divide-y">
                {notifications.map((n) => (
                  <Link
                    key={n.key}
                    href={n.href}
                    onClick={() => setNotifOpen(false)}
                    className="hover:bg-accent-50 flex items-center gap-3 px-4 py-3 transition-colors"
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${n.iconBg}`}
                    >
                      {n.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-accent-800 text-xs font-semibold">
                        {n.label}
                      </p>
                      <p className="text-accent-400 truncate text-xs">
                        {n.description}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${
                        n.count > 0
                          ? "bg-error-100 text-error-700"
                          : "bg-accent-100 text-accent-500"
                      }`}
                    >
                      {n.count}
                    </span>
                  </Link>
                ))}
              </div>

              {/* Footer */}
              <div className="border-accent-100 border-t px-4 py-2.5 text-center">
                <Link
                  href="/admin/alerts"
                  onClick={() => setNotifOpen(false)}
                  className="text-primary-600 hover:text-primary-700 text-xs font-medium"
                >
                  View all alerts →
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="border-accent-200 flex items-center gap-2 rounded-lg border px-3 py-1.5">
          <div className="bg-primary-100 flex h-7 w-7 items-center justify-center rounded-full">
            <User size={14} className="text-primary-600" />
          </div>
          <span className="text-accent-700 hidden text-sm font-medium sm:block">
            {user?.name?.split(" ")[0] ?? "Admin"}
          </span>
        </div>

        <button
          onClick={logout}
          className="text-error-600 hover:bg-error-50 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm"
        >
          <LogOut size={15} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};

export default AdminNavbar;
