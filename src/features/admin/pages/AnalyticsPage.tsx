"use client";

import { useState } from "react";
import {
  TrendingUp,
  ShoppingCart,
  IndianRupee,
  ReceiptText,
  RefreshCw,
} from "lucide-react";
import useSwr from "@/shared/hooks/useSwr";
import CustomTable from "@/shared/common/CustomTable";

interface DailyEntry {
  _id: string;
  revenue: number;
  orders: number;
}

interface TypeEntry {
  _id: string;
  count: number;
  revenue: number;
}

interface MedicineEntry {
  _id: string;
  totalQty: number;
  totalRevenue: number;
  [key: string]: unknown;
}

interface PaymentEntry {
  _id: string;
  count: number;
  amount: number;
}

interface Summary {
  totalRevenue: number;
  totalOrders: number;
  totalGst: number;
  avgOrderValue: number;
}

const DAY_OPTIONS = [7, 30, 90] as const;

type DayOption = (typeof DAY_OPTIONS)[number];

const STAT_CARDS = (s: Summary) => [
  {
    label: "Total Revenue",
    value: `₹${Number(s.totalRevenue).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`,
    icon: <IndianRupee size={20} />,
    color: "bg-primary-50 text-primary-600",
  },
  {
    label: "Total Orders",
    value: s.totalOrders.toLocaleString(),
    icon: <ShoppingCart size={20} />,
    color: "bg-tertiary-50 text-tertiary-600",
  },
  {
    label: "Avg Order Value",
    value: `₹${Number(s.avgOrderValue).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`,
    icon: <TrendingUp size={20} />,
    color: "bg-secondary-50 text-secondary-600",
  },
  {
    label: "Total GST Collected",
    value: `₹${Number(s.totalGst).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`,
    icon: <ReceiptText size={20} />,
    color: "bg-accent-50 text-accent-500",
  },
];

const topMedCols = [
  {
    field: "_id" as const,
    title: "Medicine",
    render: (row: MedicineEntry) => (
      <span className="text-accent-800 text-sm font-medium">{row._id}</span>
    ),
  },
  {
    field: "totalQty" as const,
    title: "Units Sold",
    render: (row: MedicineEntry) => (
      <span className="text-accent-700 text-sm">{row.totalQty}</span>
    ),
  },
  {
    field: "totalRevenue" as const,
    title: "Revenue",
    render: (row: MedicineEntry) => (
      <span className="text-primary-600 text-sm font-semibold">
        ₹{Number(row.totalRevenue).toFixed(2)}
      </span>
    ),
  },
];

export default function AnalyticsPage() {
  const [days, setDays] = useState<DayOption>(30);

  const { data, isLoading, mutate } = useSwr(
    `admin/analytics/sales?days=${days}`
  );

  const analytics = data?.data;
  const summary: Summary = analytics?.summary ?? {
    totalRevenue: 0,
    totalOrders: 0,
    totalGst: 0,
    avgOrderValue: 0,
  };
  const dailyRevenue: DailyEntry[] = analytics?.dailyRevenue ?? [];
  const topMedicines: MedicineEntry[] = analytics?.topMedicines ?? [];
  const typeBreakdown: TypeEntry[] = analytics?.typeBreakdown ?? [];
  const paymentBreakdown: PaymentEntry[] = analytics?.paymentBreakdown ?? [];

  // Simple sparkline — bar chart rendered as inline divs
  const maxRevenue = Math.max(...dailyRevenue.map((d) => d.revenue), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-accent-900 text-2xl font-bold">Analytics</h1>
          <p className="text-accent-500 mt-0.5 text-sm">
            Sales and revenue insights
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {DAY_OPTIONS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDays(d)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  days === d
                    ? "bg-primary-500 text-white"
                    : "border-accent-300 text-accent-600 hover:border-primary-400 border"
                }`}
              >
                {d}d
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => mutate()}
            className="text-accent-400 hover:text-primary-600 rounded p-1.5"
            title="Refresh"
          >
            <RefreshCw size={15} className={isLoading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {STAT_CARDS(summary).map((card) => (
          <div
            key={card.label}
            className="border-accent-200 rounded-xl border bg-white p-4 shadow-sm"
          >
            <div className={`mb-3 inline-flex rounded-lg p-2.5 ${card.color}`}>
              {card.icon}
            </div>
            <p className="text-accent-500 text-xs">{card.label}</p>
            <p className="text-accent-900 mt-0.5 text-lg font-bold">
              {isLoading ? (
                <span className="bg-accent-200 inline-block h-5 w-24 animate-pulse rounded" />
              ) : (
                card.value
              )}
            </p>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="border-accent-200 rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="text-accent-800 mb-4 text-sm font-semibold">
          Daily Revenue — Last {days} days
        </h2>
        {isLoading ? (
          <div className="bg-accent-100 h-32 animate-pulse rounded-lg" />
        ) : dailyRevenue.length === 0 ? (
          <p className="text-accent-400 py-8 text-center text-sm">
            No revenue data for this period
          </p>
        ) : (
          <div className="flex h-32 items-end gap-[2px] overflow-x-auto">
            {dailyRevenue.map((entry) => {
              const heightPct = (entry.revenue / maxRevenue) * 100;
              return (
                <div
                  key={entry._id}
                  className="group flex min-w-[6px] flex-1 flex-col items-center"
                  title={`${entry._id}: ₹${entry.revenue.toFixed(2)} (${entry.orders} orders)`}
                >
                  <div
                    className="bg-primary-400 group-hover:bg-primary-600 w-full rounded-t transition-colors"
                    style={{ height: `${Math.max(heightPct, 2)}%` }}
                  />
                </div>
              );
            })}
          </div>
        )}
        {dailyRevenue.length > 0 && (
          <div className="text-accent-400 mt-2 flex justify-between text-xs">
            <span>{dailyRevenue[0]?._id}</span>
            <span>{dailyRevenue[dailyRevenue.length - 1]?._id}</span>
          </div>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Order types */}
        <div className="border-accent-200 rounded-xl border bg-white p-5 shadow-sm">
          <h2 className="text-accent-800 mb-4 text-sm font-semibold">
            Order Type Split
          </h2>
          {isLoading ? (
            <div className="bg-accent-100 h-24 animate-pulse rounded-lg" />
          ) : typeBreakdown.length === 0 ? (
            <p className="text-accent-400 py-6 text-center text-sm">No data</p>
          ) : (
            <div className="space-y-3">
              {typeBreakdown.map((t) => {
                const totalOrders = typeBreakdown.reduce(
                  (s, x) => s + x.count,
                  0
                );
                const pct = Math.round((t.count / totalOrders) * 100);
                return (
                  <div key={t._id}>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-accent-700 text-sm capitalize">
                        {t._id}
                      </span>
                      <span className="text-accent-500 text-xs">
                        {t.count} orders · ₹{t.revenue.toFixed(2)}
                      </span>
                    </div>
                    <div className="bg-accent-100 h-2 rounded-full">
                      <div
                        className={`h-2 rounded-full ${t._id === "pos" ? "bg-tertiary-500" : "bg-primary-500"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Payment methods */}
        <div className="border-accent-200 rounded-xl border bg-white p-5 shadow-sm">
          <h2 className="text-accent-800 mb-4 text-sm font-semibold">
            Payment Methods
          </h2>
          {isLoading ? (
            <div className="bg-accent-100 h-24 animate-pulse rounded-lg" />
          ) : paymentBreakdown.length === 0 ? (
            <p className="text-accent-400 py-6 text-center text-sm">No data</p>
          ) : (
            <div className="space-y-2">
              {paymentBreakdown.map((p) => (
                <div
                  key={p._id}
                  className="border-accent-100 flex items-center justify-between rounded-lg border px-4 py-2.5"
                >
                  <span className="text-accent-700 text-sm font-medium capitalize">
                    {p._id}
                  </span>
                  <div className="text-right">
                    <p className="text-accent-800 text-sm font-semibold">
                      ₹{p.amount.toFixed(2)}
                    </p>
                    <p className="text-accent-400 text-xs">{p.count} orders</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top Medicines */}
      <div className="border-accent-200 rounded-xl border bg-white shadow-sm">
        <div className="border-accent-100 flex items-center justify-between border-b px-5 py-3">
          <h2 className="text-accent-800 text-sm font-semibold">
            Top Selling Medicines
          </h2>
          <span className="text-accent-400 text-xs">Last {days} days</span>
        </div>
        <CustomTable
          data={topMedicines}
          columns={topMedCols}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
