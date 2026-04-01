"use client";

import { AlertTriangle, CalendarX, Package } from "lucide-react";
import useSwr from "@/shared/hooks/useSwr";
import CustomButton from "@/shared/common/CustomButton";
import CustomTable from "@/shared/common/CustomTable";

interface LowStockItem {
  id?: string;
  _id?: string;
  name: string;
  sku: string;
  quantity: number;
  threshold: number;
  [key: string]: unknown;
}

interface ExpiryAlert {
  id?: string;
  medicineId: string;
  medicineName: string;
  sku: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  status: "expired" | "near_expiry";
  [key: string]: unknown;
}

const AlertsPage = () => {
  const { data, isLoading, mutate } = useSwr("inventory/alerts");
  const lowStock: LowStockItem[] = (data?.data?.lowStock ?? []).map(
    (item: LowStockItem) => ({
      ...item,
      id: item.id ?? item._id,
    })
  );
  const expiryAlerts: ExpiryAlert[] = (data?.data?.expiryAlerts ?? []).map(
    (item: ExpiryAlert, i: number) => ({
      ...item,
      id: `${item.medicineId}-${item.batchNumber}-${i}`,
    })
  );

  const lowStockColumns = [
    { field: "name" as const, title: "Medicine" },
    { field: "sku" as const, title: "SKU" },
    {
      field: "quantity" as const,
      title: "Current Stock",
      render: (row: LowStockItem) => (
        <span className="text-error-600 font-semibold">{row.quantity}</span>
      ),
    },
    { field: "threshold" as const, title: "Threshold" },
  ];

  const expiryColumns = [
    { field: "medicineName" as const, title: "Medicine" },
    { field: "sku" as const, title: "SKU" },
    { field: "batchNumber" as const, title: "Batch No." },
    {
      field: "expiryDate" as const,
      title: "Expiry Date",
      render: (row: ExpiryAlert) =>
        new Date(row.expiryDate).toLocaleDateString("en-IN"),
    },
    { field: "quantity" as const, title: "Qty" },
    {
      field: "status" as const,
      title: "Status",
      render: (row: ExpiryAlert) =>
        row.status === "expired" ? (
          <span className="bg-error-100 text-error-700 rounded-full px-2.5 py-0.5 text-xs font-medium">
            Expired
          </span>
        ) : (
          <span className="bg-warning-100 text-warning-700 rounded-full px-2.5 py-0.5 text-xs font-medium">
            Near Expiry
          </span>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-accent-900 text-2xl font-bold">Alerts</h1>
          <p className="text-accent-500 mt-0.5 text-sm">
            Low stock and expiry notifications
          </p>
        </div>
        <CustomButton
          variant="refresh"
          size="small"
          fullWidth={false}
          loading={isLoading}
          onClick={() => mutate()}
        >
          Refresh
        </CustomButton>
      </div>

      {/* Summary Badges */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div
          className={`flex items-center gap-4 rounded-xl border p-5 ${
            lowStock.length > 0
              ? "border-warning-200 bg-warning-50"
              : "border-accent-200 bg-white"
          }`}
        >
          <div className="bg-warning-100 rounded-lg p-3">
            <Package size={22} className="text-warning-600" />
          </div>
          <div>
            <p className="text-accent-900 text-2xl font-bold">
              {lowStock.length}
            </p>
            <p className="text-accent-500 text-sm">Low stock medicines</p>
          </div>
        </div>
        <div
          className={`flex items-center gap-4 rounded-xl border p-5 ${
            expiryAlerts.length > 0
              ? "border-error-200 bg-error-50"
              : "border-accent-200 bg-white"
          }`}
        >
          <div className="bg-error-100 rounded-lg p-3">
            <CalendarX size={22} className="text-error-600" />
          </div>
          <div>
            <p className="text-accent-900 text-2xl font-bold">
              {expiryAlerts.length}
            </p>
            <p className="text-accent-500 text-sm">Expiry alerts (batches)</p>
          </div>
        </div>
      </div>

      {/* Low Stock Table */}
      <div>
        <h2 className="text-accent-800 mb-3 flex items-center gap-2 text-base font-semibold">
          <AlertTriangle size={16} className="text-warning-500" />
          Low Stock ({lowStock.length})
        </h2>
        <div className="border-accent-200 rounded-xl border bg-white shadow-sm">
          <CustomTable
            data={lowStock}
            columns={lowStockColumns}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Expiry Alerts Table */}
      <div>
        <h2 className="text-accent-800 mb-3 flex items-center gap-2 text-base font-semibold">
          <CalendarX size={16} className="text-error-500" />
          Expiry Alerts ({expiryAlerts.length})
        </h2>
        <div className="border-accent-200 rounded-xl border bg-white shadow-sm">
          <CustomTable
            data={expiryAlerts}
            columns={expiryColumns}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
};

export default AlertsPage;
