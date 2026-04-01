"use client";

import Link from "next/link";
import {
  Pill,
  Users,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  CalendarX,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import useSwr from "@/shared/hooks/useSwr";
import CustomButton from "@/shared/common/CustomButton";

interface DashboardData {
  totalMedicines: number;
  totalUsers: number;
  todayOrders: number;
  monthRevenue: number;
  lowStockCount: number;
  expiryAlertCount: number;
}

const statCards = (data: DashboardData) => [
  {
    label: "Total Medicines",
    value: data.totalMedicines ?? 0,
    icon: <Pill size={22} />,
    color: "bg-primary-50 text-primary-600",
    href: "/admin/medicines",
  },
  {
    label: "Total Customers",
    value: data.totalUsers ?? 0,
    icon: <Users size={22} />,
    color: "bg-secondary-50 text-secondary-600",
    href: "/admin/users",
  },
  {
    label: "Today's Orders",
    value: data.todayOrders ?? 0,
    icon: <ShoppingCart size={22} />,
    color: "bg-tertiary-50 text-tertiary-600",
    href: "/admin/orders",
  },
  {
    label: "Month Revenue",
    value: `₹${(data.monthRevenue ?? 0).toLocaleString("en-IN")}`,
    icon: <TrendingUp size={22} />,
    color: "bg-primary-50 text-primary-600",
    href: "/admin/orders",
  },
];

const DashboardPage = () => {
  const { data, isLoading, mutate } = useSwr("admin/dashboard");
  const dashboard: DashboardData | undefined = data?.data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-accent-900 text-2xl font-bold">Dashboard</h1>
          <p className="text-accent-500 mt-1 text-sm">
            Overview of Sidheswar Drugs House
          </p>
        </div>
        <CustomButton
          variant="refresh"
          size="small"
          fullWidth={false}
          onClick={() => mutate()}
          loading={isLoading}
        >
          Refresh
        </CustomButton>
      </div>

      {/* Stat Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-accent-100 h-28 animate-pulse rounded-xl"
            />
          ))}
        </div>
      ) : dashboard ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards(dashboard).map((card) => (
            <Link
              key={card.label}
              href={card.href}
              className="group border-accent-200 rounded-xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-accent-500 text-sm">{card.label}</p>
                  <p className="text-accent-900 mt-1.5 text-2xl font-bold">
                    {card.value}
                  </p>
                </div>
                <div className={`rounded-lg p-2.5 ${card.color}`}>
                  {card.icon}
                </div>
              </div>
              <div className="text-accent-400 group-hover:text-primary-600 mt-3 flex items-center gap-1 text-xs">
                View details <ArrowRight size={12} />
              </div>
            </Link>
          ))}
        </div>
      ) : null}

      {/* Alert Cards */}
      {dashboard && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Low Stock Alert */}
          <Link
            href="/admin/alerts"
            className={`flex items-center justify-between rounded-xl border p-5 shadow-sm transition-shadow hover:shadow-md ${
              dashboard.lowStockCount > 0
                ? "border-warning-200 bg-warning-50"
                : "border-accent-200 bg-white"
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="bg-warning-100 rounded-lg p-2.5">
                <AlertTriangle size={22} className="text-warning-600" />
              </div>
              <div>
                <p className="text-accent-800 font-semibold">Low Stock Items</p>
                <p className="text-accent-500 text-sm">
                  {dashboard.lowStockCount > 0
                    ? `${dashboard.lowStockCount} medicines below threshold`
                    : "All stock levels are healthy"}
                </p>
              </div>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-sm font-bold ${
                dashboard.lowStockCount > 0
                  ? "bg-warning-200 text-warning-800"
                  : "bg-primary-100 text-primary-700"
              }`}
            >
              {dashboard.lowStockCount}
            </span>
          </Link>

          {/* Expiry Alert */}
          <Link
            href="/admin/alerts"
            className={`flex items-center justify-between rounded-xl border p-5 shadow-sm transition-shadow hover:shadow-md ${
              dashboard.expiryAlertCount > 0
                ? "border-error-200 bg-error-50"
                : "border-accent-200 bg-white"
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="bg-error-100 rounded-lg p-2.5">
                <CalendarX size={22} className="text-error-600" />
              </div>
              <div>
                <p className="text-accent-800 font-semibold">Expiry Alerts</p>
                <p className="text-accent-500 text-sm">
                  {dashboard.expiryAlertCount > 0
                    ? `${dashboard.expiryAlertCount} batches expiring within 30 days`
                    : "No upcoming expiries"}
                </p>
              </div>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-sm font-bold ${
                dashboard.expiryAlertCount > 0
                  ? "bg-error-100 text-error-700"
                  : "bg-primary-100 text-primary-700"
              }`}
            >
              {dashboard.expiryAlertCount}
            </span>
          </Link>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-accent-800 mb-4 text-base font-semibold">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {[
            {
              label: "Add Medicine",
              href: "/admin/medicines/create",
              icon: <Pill size={18} />,
            },
            {
              label: "Add Inventory",
              href: "/admin/inventory/add",
              icon: <RefreshCw size={18} />,
            },
            {
              label: "POS Billing",
              href: "/admin/pos",
              icon: <ShoppingCart size={18} />,
            },
            {
              label: "View Orders",
              href: "/admin/orders",
              icon: <TrendingUp size={18} />,
            },
            {
              label: "Manage Users",
              href: "/admin/users",
              icon: <Users size={18} />,
            },
          ].map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="border-accent-200 hover:border-primary-300 flex flex-col items-center gap-2 rounded-xl border bg-white p-4 text-center shadow-sm transition-all hover:shadow-md"
            >
              <div className="bg-primary-50 text-primary-600 rounded-lg p-2.5">
                {action.icon}
              </div>
              <span className="text-accent-700 text-xs font-medium">
                {action.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
