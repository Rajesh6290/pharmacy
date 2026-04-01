"use client";

import { ShoppingBag, ClipboardList, User, Package } from "lucide-react";
import Link from "next/link";
import useSwr from "@/shared/hooks/useSwr";
import { useAuth } from "@/shared/hooks/useAuth";
import CustomTable from "@/shared/common/CustomTable";

interface Order {
  id?: string;
  _id: string;
  orderNumber: string;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  createdAt: string;
  type: string;
  [key: string]: unknown;
}

const statusColor: Record<string, string> = {
  pending: "bg-warning-100 text-warning-700",
  confirmed: "bg-secondary-100 text-secondary-700",
  processing: "bg-tertiary-100 text-tertiary-700",
  completed: "bg-primary-100 text-primary-700",
  cancelled: "bg-error-100 text-error-700",
};

const UserDashboardPage = () => {
  const { user } = useAuth();
  const { data, isLoading } = useSwr("orders");
  const orders: Order[] = (data?.orders ?? []).map((o: Order) => ({
    ...o,
    id: o._id,
  }));

  const columns = [
    { field: "orderNumber" as const, title: "Order #" },
    {
      field: "totalAmount" as const,
      title: "Amount",
      render: (row: Order) => `₹${row.totalAmount.toLocaleString("en-IN")}`,
    },
    { field: "paymentMethod" as const, title: "Payment" },
    {
      field: "status" as const,
      title: "Status",
      render: (row: Order) => (
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusColor[row.status] ?? ""}`}
        >
          {row.status}
        </span>
      ),
    },
    {
      field: "createdAt" as const,
      title: "Date",
      render: (row: Order) =>
        new Date(row.createdAt).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-accent-900 text-2xl font-bold">My Account</h1>
        <p className="text-accent-500 mt-0.5 text-sm">
          Welcome back, {user?.name?.split(" ")[0]}
        </p>
      </div>

      {/* Quick Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link
          href="/store"
          className="border-accent-200 flex items-center gap-4 rounded-xl border bg-white p-5 shadow-sm hover:shadow-md"
        >
          <div className="bg-primary-50 rounded-lg p-3">
            <ShoppingBag size={22} className="text-primary-600" />
          </div>
          <div>
            <p className="text-accent-800 text-sm font-semibold">
              Browse Store
            </p>
            <p className="text-accent-400 text-xs">Find medicines</p>
          </div>
        </Link>
        <Link
          href="/cart"
          className="border-accent-200 flex items-center gap-4 rounded-xl border bg-white p-5 shadow-sm hover:shadow-md"
        >
          <div className="bg-secondary-50 rounded-lg p-3">
            <Package size={22} className="text-secondary-600" />
          </div>
          <div>
            <p className="text-accent-800 text-sm font-semibold">My Cart</p>
            <p className="text-accent-400 text-xs">View cart items</p>
          </div>
        </Link>
        <div className="border-accent-200 flex items-center gap-4 rounded-xl border bg-white p-5 shadow-sm">
          <div className="bg-tertiary-50 rounded-lg p-3">
            <User size={22} className="text-tertiary-600" />
          </div>
          <div>
            <p className="text-accent-800 text-sm font-semibold">
              {user?.email}
            </p>
            <p className="text-accent-400 text-xs capitalize">{user?.role}</p>
          </div>
        </div>
      </div>

      {/* Orders */}
      <div>
        <h2 className="text-accent-800 mb-3 flex items-center gap-2 text-base font-semibold">
          <ClipboardList size={16} className="text-primary-500" />
          My Orders ({orders.length})
        </h2>
        <div className="border-accent-200 rounded-xl border bg-white shadow-sm">
          <CustomTable data={orders} columns={columns} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
};

export default UserDashboardPage;
