"use client";

import { useState } from "react";
import { Eye, CheckCircle2, XCircle, Clock, Truck, X } from "lucide-react";
import useSwr from "@/shared/hooks/useSwr";
import useMutation from "@/shared/hooks/useMutation";
import CustomTable from "@/shared/common/CustomTable";
import CustomButton from "@/shared/common/CustomButton";

interface OrderItem {
  medicineName: string;
  batchNumber: string;
  quantity: number;
  unitPrice: number;
  gst: number;
  discount: number;
  total: number;
}

interface Order {
  _id: string;
  orderNumber: string;
  customerName?: string;
  customerPhone?: string;
  type: "online" | "pos";
  items: OrderItem[];
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  prescriptionUrl?: string;
  prescriptionStatus?: string;
  createdAt: string;
  [key: string]: unknown;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-warning-100 text-warning-700",
  confirmed: "bg-tertiary-100 text-tertiary-700",
  processing: "bg-tertiary-100 text-tertiary-700",
  completed: "bg-primary-100 text-primary-700",
  cancelled: "bg-error-100 text-error-700",
};

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  pending: "bg-warning-100 text-warning-700",
  paid: "bg-primary-100 text-primary-700",
  failed: "bg-error-100 text-error-700",
  refunded: "bg-accent-100 text-accent-700",
};

const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "completed",
  "cancelled",
];

const PRESCRIPTION_STATUSES = ["pending", "approved", "rejected"];

export default function AdminOrdersPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updating, setUpdating] = useState(false);

  const query = [
    `page=${page}`,
    statusFilter ? `status=${statusFilter}` : "",
    typeFilter ? `type=${typeFilter}` : "",
  ]
    .filter(Boolean)
    .join("&");

  const { data, isLoading, mutate } = useSwr(`orders?${query}`);
  const { mutation } = useMutation();

  const orders: Order[] = data?.data?.orders ?? [];
  const pagination = data?.data?.pagination;

  const updateOrder = async (
    id: string,
    updates: Partial<{
      status: string;
      paymentStatus: string;
      prescriptionStatus: string;
    }>
  ) => {
    setUpdating(true);
    const res = await mutation(`orders/${id}`, {
      method: "PATCH",
      body: updates,
      isAlert: true,
    });
    if (res?.results?.success) {
      mutate();
      if (selectedOrder?._id === id) {
        setSelectedOrder((o) => (o ? { ...o, ...updates } : o));
      }
    }
    setUpdating(false);
  };

  const columns = [
    {
      field: "orderNumber" as const,
      title: "Order #",
      render: (row: Order) => (
        <span className="text-primary-600 font-medium">{row.orderNumber}</span>
      ),
    },
    {
      field: "customerName" as const,
      title: "Customer",
      render: (row: Order) => (
        <div>
          <p className="text-accent-800 text-sm">
            {row.customerName ?? "Walk-in"}
          </p>
          {row.customerPhone && (
            <p className="text-accent-400 text-xs">{row.customerPhone}</p>
          )}
        </div>
      ),
    },
    {
      field: "type" as const,
      title: "Type",
      render: (row: Order) => (
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            row.type === "pos"
              ? "bg-accent-100 text-accent-700"
              : "bg-tertiary-100 text-tertiary-700"
          }`}
        >
          {row.type.toUpperCase()}
        </span>
      ),
    },
    {
      field: "totalAmount" as const,
      title: "Amount",
      render: (row: Order) => (
        <span className="text-accent-800 font-semibold">
          ₹{Number(row.totalAmount).toFixed(2)}
        </span>
      ),
    },
    {
      field: "status" as const,
      title: "Status",
      render: (row: Order) => (
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[row.status] ?? "bg-accent-100 text-accent-700"}`}
        >
          {row.status}
        </span>
      ),
    },
    {
      field: "paymentStatus" as const,
      title: "Payment",
      render: (row: Order) => (
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${PAYMENT_STATUS_COLORS[row.paymentStatus] ?? "bg-accent-100 text-accent-700"}`}
        >
          {row.paymentStatus}
        </span>
      ),
    },
    {
      field: "createdAt" as const,
      title: "Date",
      render: (row: Order) => (
        <span className="text-accent-500 text-xs">
          {new Date(row.createdAt).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </span>
      ),
    },
    {
      field: "_id" as const,
      title: "Actions",
      render: (row: Order) => (
        <button
          type="button"
          onClick={() => setSelectedOrder(row)}
          className="text-accent-500 hover:bg-primary-50 hover:text-primary-600 rounded p-1.5"
          title="View details"
        >
          <Eye size={15} />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-accent-900 text-2xl font-bold">Orders</h1>
        <p className="text-accent-500 mt-0.5 text-sm">
          Manage all customer and POS orders
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="border-accent-300 focus:border-primary-500 rounded-lg border bg-white px-3 py-2 text-sm outline-none"
        >
          <option value="">All Statuses</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setPage(1);
          }}
          className="border-accent-300 focus:border-primary-500 rounded-lg border bg-white px-3 py-2 text-sm outline-none"
        >
          <option value="">All Types</option>
          <option value="online">Online</option>
          <option value="pos">POS</option>
        </select>
        {(statusFilter || typeFilter) && (
          <button
            type="button"
            onClick={() => {
              setStatusFilter("");
              setTypeFilter("");
              setPage(1);
            }}
            className="text-accent-500 hover:text-error-600 flex items-center gap-1 text-sm"
          >
            <X size={14} /> Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="border-accent-200 rounded-xl border bg-white shadow-sm">
        <CustomTable data={orders} columns={columns} isLoading={isLoading} />
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <CustomButton
            variant="secondary"
            size="small"
            fullWidth={false}
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Prev
          </CustomButton>
          <span className="text-accent-500 text-sm">
            Page {page} of {pagination.pages}
          </span>
          <CustomButton
            variant="secondary"
            size="small"
            fullWidth={false}
            disabled={page === pagination.pages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </CustomButton>
        </div>
      )}

      {/* Order Detail Drawer */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
          <div className="border-accent-200 flex h-full w-full max-w-lg flex-col overflow-y-auto border-l bg-white shadow-2xl">
            {/* Drawer header */}
            <div className="border-accent-100 flex items-center justify-between border-b px-6 py-4">
              <div>
                <p className="text-accent-900 font-semibold">
                  Order {selectedOrder.orderNumber}
                </p>
                <p className="text-accent-400 text-xs">
                  {new Date(selectedOrder.createdAt).toLocaleString("en-IN")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="text-accent-400 hover:text-accent-700 rounded p-1"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 space-y-5 p-6">
              {/* Customer info */}
              <div className="bg-accent-50 rounded-xl p-4">
                <p className="text-accent-700 mb-2 text-xs font-semibold tracking-wider uppercase">
                  Customer
                </p>
                <p className="text-accent-800 font-medium">
                  {selectedOrder.customerName ?? "Walk-in Customer"}
                </p>
                {selectedOrder.customerPhone && (
                  <p className="text-accent-500 text-sm">
                    {selectedOrder.customerPhone}
                  </p>
                )}
                <p className="text-accent-500 mt-1 text-xs">
                  Payment: {selectedOrder.paymentMethod} ·{" "}
                  <span
                    className={`font-medium ${PAYMENT_STATUS_COLORS[selectedOrder.paymentStatus] ?? ""}`}
                  >
                    {selectedOrder.paymentStatus}
                  </span>
                </p>
              </div>

              {/* Items */}
              <div>
                <p className="text-accent-700 mb-2 text-xs font-semibold tracking-wider uppercase">
                  Items
                </p>
                <div className="border-accent-200 divide-accent-100 divide-y rounded-xl border">
                  {selectedOrder.items.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between px-4 py-3"
                    >
                      <div>
                        <p className="text-accent-800 text-sm font-medium">
                          {item.medicineName}
                        </p>
                        <p className="text-accent-400 text-xs">
                          Batch: {item.batchNumber} · Qty: {item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-accent-800 text-sm font-semibold">
                          ₹{item.total.toFixed(2)}
                        </p>
                        {item.gst > 0 && (
                          <p className="text-accent-400 text-xs">
                            incl. {item.gst}% GST
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex justify-end">
                  <p className="text-primary-600 text-base font-bold">
                    Total: ₹{Number(selectedOrder.totalAmount).toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Prescription */}
              {selectedOrder.prescriptionUrl && (
                <div>
                  <p className="text-accent-700 mb-2 text-xs font-semibold tracking-wider uppercase">
                    Prescription
                  </p>
                  <div className="border-accent-200 flex items-center justify-between rounded-xl border p-3">
                    <a
                      href={selectedOrder.prescriptionUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary-600 text-sm underline"
                    >
                      View Prescription
                    </a>
                    <div className="flex gap-2">
                      {PRESCRIPTION_STATUSES.map((ps) => (
                        <button
                          key={ps}
                          type="button"
                          disabled={
                            updating || selectedOrder.prescriptionStatus === ps
                          }
                          onClick={() =>
                            updateOrder(selectedOrder._id, {
                              prescriptionStatus: ps,
                            })
                          }
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
                            selectedOrder.prescriptionStatus === ps
                              ? ps === "approved"
                                ? "bg-primary-500 text-white"
                                : ps === "rejected"
                                  ? "bg-error-500 text-white"
                                  : "bg-warning-400 text-white"
                              : "border-accent-300 text-accent-500 hover:border-primary-400 border"
                          }`}
                        >
                          {ps}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Status Controls */}
              <div>
                <p className="text-accent-700 mb-2 text-xs font-semibold tracking-wider uppercase">
                  Update Status
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    {
                      s: "confirmed",
                      label: "Confirm",
                      icon: <CheckCircle2 size={13} />,
                    },
                    {
                      s: "processing",
                      label: "Processing",
                      icon: <Clock size={13} />,
                    },
                    {
                      s: "completed",
                      label: "Complete",
                      icon: <Truck size={13} />,
                    },
                    {
                      s: "cancelled",
                      label: "Cancel",
                      icon: <XCircle size={13} />,
                    },
                  ].map(({ s, label, icon }) => (
                    <button
                      key={s}
                      type="button"
                      disabled={updating || selectedOrder.status === s}
                      onClick={() =>
                        updateOrder(selectedOrder._id, { status: s })
                      }
                      className={`flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-all disabled:opacity-50 ${
                        selectedOrder.status === s
                          ? STATUS_COLORS[s]
                          : "border-accent-300 text-accent-600 hover:border-primary-400"
                      }`}
                    >
                      {icon} {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mark paid */}
              {selectedOrder.paymentStatus !== "paid" && (
                <CustomButton
                  variant="primary"
                  size="small"
                  fullWidth={false}
                  loading={updating}
                  onClick={() =>
                    updateOrder(selectedOrder._id, { paymentStatus: "paid" })
                  }
                >
                  Mark as Paid
                </CustomButton>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
