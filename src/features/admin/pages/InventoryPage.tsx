"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, PackageSearch, X } from "lucide-react";
import useSwr from "@/shared/hooks/useSwr";
import useMutation from "@/shared/hooks/useMutation";
import CustomTable from "@/shared/common/CustomTable";
import CustomButton from "@/shared/common/CustomButton";
import Link from "next/link";

interface Batch {
  batchNumber: string;
  expiryDate: string;
  purchasePrice: number;
  sellingPrice: number;
  gst: number;
  quantity: number;
}

interface Medicine {
  _id: string;
  name: string;
  sku: string;
  category: string;
  manufacturer: string;
  unit: string;
  quantity: number;
  lowStockThreshold: number;
  batches: Batch[];
  [key: string]: unknown;
}

type StatusFilter = "all" | "lowstock" | "expiring" | "expired";

const STATUS_DAYS = 30;

function getBatchStatus(batch: Batch): "expired" | "expiring" | "ok" {
  const now = new Date();
  const expiry = new Date(batch.expiryDate);
  if (expiry < now) return "expired";
  const diffMs = expiry.getTime() - now.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  if (diffDays <= STATUS_DAYS) return "expiring";
  return "ok";
}

interface FlatRow {
  _id: string;
  medicineId: string;
  medicineName: string;
  sku: string;
  batchNumber: string;
  expiryDate: string;
  purchasePrice: number;
  sellingPrice: number;
  gst: number;
  quantity: number;
  lowStockThreshold: number;
  batchStatus: "expired" | "expiring" | "ok";
  isLowStock: boolean;
  [key: string]: unknown;
}

function flattenMedicines(medicines: Medicine[]): FlatRow[] {
  const rows: FlatRow[] = [];
  for (const m of medicines) {
    if (!m.batches.length) {
      rows.push({
        _id: `${m._id}-nobatch`,
        medicineId: m._id,
        medicineName: m.name,
        sku: m.sku,
        batchNumber: "—",
        expiryDate: "",
        purchasePrice: 0,
        sellingPrice: 0,
        gst: 0,
        quantity: 0,
        lowStockThreshold: m.lowStockThreshold,
        batchStatus: "ok",
        isLowStock: m.quantity <= m.lowStockThreshold,
      });
    }
    for (const b of m.batches) {
      rows.push({
        _id: `${m._id}-${b.batchNumber}`,
        medicineId: m._id,
        medicineName: m.name,
        sku: m.sku,
        batchNumber: b.batchNumber,
        expiryDate: b.expiryDate,
        purchasePrice: b.purchasePrice,
        sellingPrice: b.sellingPrice,
        gst: b.gst,
        quantity: b.quantity,
        lowStockThreshold: m.lowStockThreshold,
        batchStatus: getBatchStatus(b),
        isLowStock: b.quantity <= m.lowStockThreshold,
      });
    }
  }
  return rows;
}

export default function InventoryPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [editRow, setEditRow] = useState<FlatRow | null>(null);
  const [editQty, setEditQty] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editExpiry, setEditExpiry] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<FlatRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const query = [
    `page=${page}`,
    search ? `search=${encodeURIComponent(search)}` : "",
  ]
    .filter(Boolean)
    .join("&");

  const { data, isLoading, mutate } = useSwr(`inventory?${query}`);
  const { mutation } = useMutation();

  const allMedicines: Medicine[] = data?.data?.medicines ?? [];
  const pagination = data?.data?.pagination;

  let flatRows = flattenMedicines(allMedicines);
  if (statusFilter === "lowstock") {
    flatRows = flatRows.filter((r) => r.isLowStock);
  } else if (statusFilter === "expiring") {
    flatRows = flatRows.filter((r) => r.batchStatus === "expiring");
  } else if (statusFilter === "expired") {
    flatRows = flatRows.filter((r) => r.batchStatus === "expired");
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  };

  const openEdit = (row: FlatRow) => {
    setEditRow(row);
    setEditQty(String(row.quantity));
    setEditPrice(String(row.sellingPrice));
    setEditExpiry(
      row.expiryDate ? new Date(row.expiryDate).toISOString().split("T")[0] : ""
    );
  };

  const handleSaveEdit = async () => {
    if (!editRow || editRow.batchNumber === "—") return;
    setSaving(true);
    const res = await mutation(
      `inventory/${encodeURIComponent(editRow.batchNumber)}`,
      {
        method: "PATCH",
        body: {
          medicineId: editRow.medicineId,
          quantity: Number(editQty),
          sellingPrice: Number(editPrice),
          expiryDate: editExpiry,
        },
        isAlert: true,
      }
    );
    if (res?.results?.success) {
      setEditRow(null);
      mutate();
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!confirmDelete || confirmDelete.batchNumber === "—") return;
    setDeleting(true);
    const res = await mutation(
      `inventory/${encodeURIComponent(confirmDelete.batchNumber)}?medicineId=${confirmDelete.medicineId}`,
      { method: "DELETE", isAlert: true }
    );
    if (res?.results?.success) {
      setConfirmDelete(null);
      mutate();
    }
    setDeleting(false);
  };

  const columns = [
    {
      field: "medicineName" as const,
      title: "Medicine",
      render: (row: FlatRow) => (
        <div>
          <p className="text-accent-800 text-sm font-medium">
            {row.medicineName}
          </p>
          <p className="text-accent-400 font-mono text-xs">{row.sku}</p>
        </div>
      ),
    },
    {
      field: "batchNumber" as const,
      title: "Batch #",
      render: (row: FlatRow) => (
        <span className="text-accent-600 font-mono text-sm">
          {row.batchNumber}
        </span>
      ),
    },
    {
      field: "expiryDate" as const,
      title: "Expiry",
      render: (row: FlatRow) => {
        if (!row.expiryDate) return <span className="text-accent-300">—</span>;
        const status = row.batchStatus;
        return (
          <span
            className={`text-sm font-medium ${
              status === "expired"
                ? "text-error-600"
                : status === "expiring"
                  ? "text-warning-600"
                  : "text-accent-700"
            }`}
          >
            {new Date(row.expiryDate).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </span>
        );
      },
    },
    {
      field: "quantity" as const,
      title: "Stock",
      render: (row: FlatRow) => (
        <span
          className={`text-sm font-semibold ${
            row.isLowStock ? "text-error-600" : "text-accent-800"
          }`}
        >
          {row.quantity}
        </span>
      ),
    },
    {
      field: "purchasePrice" as const,
      title: "Buy / Sell",
      render: (row: FlatRow) => (
        <div className="text-xs">
          <p className="text-accent-500">
            Buy: ₹{row.purchasePrice.toFixed(2)}
          </p>
          <p className="text-accent-800 font-medium">
            Sell: ₹{row.sellingPrice.toFixed(2)}
          </p>
        </div>
      ),
    },
    {
      field: "gst" as const,
      title: "GST",
      render: (row: FlatRow) => (
        <span className="text-accent-500 text-sm">{row.gst}%</span>
      ),
    },
    {
      field: "_id" as const,
      title: "Actions",
      render: (row: FlatRow) =>
        row.batchNumber !== "—" ? (
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => openEdit(row)}
              className="text-accent-400 hover:text-primary-600 rounded p-1.5"
              title="Edit batch"
            >
              <Pencil size={14} />
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(row)}
              className="text-accent-400 hover:text-error-600 rounded p-1.5"
              title="Remove batch"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ) : null,
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-accent-900 text-2xl font-bold">Inventory</h1>
          <p className="text-accent-500 mt-0.5 text-sm">
            View and manage all stock batches
          </p>
        </div>
        <Link href="/admin/inventory/add">
          <CustomButton variant="primary" size="small" fullWidth={false}>
            <Plus size={14} /> Add Batch
          </CustomButton>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by medicine name or SKU…"
            className="border-accent-300 focus:border-primary-500 w-64 rounded-lg border bg-white px-3 py-2 text-sm outline-none"
          />
          <CustomButton
            variant="primary"
            size="small"
            fullWidth={false}
            type="submit"
          >
            Search
          </CustomButton>
        </form>

        <div className="flex gap-1.5">
          {(
            [
              { val: "all", label: "All" },
              { val: "lowstock", label: "Low Stock" },
              { val: "expiring", label: "Expiring Soon" },
              { val: "expired", label: "Expired" },
            ] as const
          ).map(({ val, label }) => (
            <button
              key={val}
              type="button"
              onClick={() => setStatusFilter(val)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                statusFilter === val
                  ? "bg-primary-500 text-white"
                  : "border-accent-300 text-accent-600 hover:border-primary-400 border"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {search && (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setSearchInput("");
              setPage(1);
            }}
            className="text-accent-500 hover:text-error-600 flex items-center gap-1 text-sm"
          >
            <X size={14} /> Clear search
          </button>
        )}
      </div>

      {/* Empty state */}
      {!isLoading && flatRows.length === 0 && (
        <div className="border-accent-200 flex flex-col items-center gap-3 rounded-xl border bg-white py-16">
          <PackageSearch size={40} className="text-accent-300" />
          <p className="text-accent-500 text-sm">No inventory records found</p>
        </div>
      )}

      {/* Table */}
      {(isLoading || flatRows.length > 0) && (
        <div className="border-accent-200 rounded-xl border bg-white shadow-sm">
          <CustomTable
            data={flatRows}
            columns={columns}
            isLoading={isLoading}
          />
        </div>
      )}

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

      {/* Edit Batch Modal */}
      {editRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="border-accent-200 w-full max-w-sm rounded-2xl border bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-accent-900 font-semibold">Edit Batch</h3>
              <button
                type="button"
                onClick={() => setEditRow(null)}
                className="text-accent-400 hover:text-accent-700"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-accent-500 mb-4 text-sm">
              {editRow.medicineName} ·{" "}
              <span className="font-mono">{editRow.batchNumber}</span>
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-accent-700 mb-1 block text-sm font-medium">
                  Stock Quantity
                </label>
                <input
                  type="number"
                  min={0}
                  value={editQty}
                  onChange={(e) => setEditQty(e.target.value)}
                  className="border-accent-300 focus:border-primary-500 w-full rounded-lg border px-3 py-2 text-sm outline-none"
                />
              </div>
              <div>
                <label className="text-accent-700 mb-1 block text-sm font-medium">
                  Selling Price (₹)
                </label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  className="border-accent-300 focus:border-primary-500 w-full rounded-lg border px-3 py-2 text-sm outline-none"
                />
              </div>
              <div>
                <label className="text-accent-700 mb-1 block text-sm font-medium">
                  Expiry Date
                </label>
                <input
                  type="date"
                  value={editExpiry}
                  onChange={(e) => setEditExpiry(e.target.value)}
                  className="border-accent-300 focus:border-primary-500 w-full rounded-lg border px-3 py-2 text-sm outline-none"
                />
              </div>
            </div>
            <div className="mt-5 flex gap-3">
              <CustomButton
                variant="cancel"
                size="small"
                fullWidth={false}
                onClick={() => setEditRow(null)}
              >
                Cancel
              </CustomButton>
              <CustomButton
                variant="primary"
                size="small"
                fullWidth={false}
                loading={saving}
                onClick={handleSaveEdit}
              >
                Save Changes
              </CustomButton>
            </div>
          </div>
        </div>
      )}

      {/* Delete Batch Confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="border-accent-200 w-full max-w-sm rounded-2xl border bg-white p-6 shadow-2xl">
            <h3 className="text-accent-900 mb-1 text-lg font-semibold">
              Remove Batch
            </h3>
            <p className="text-accent-500 mb-5 text-sm">
              Remove batch{" "}
              <span className="text-accent-800 font-mono font-semibold">
                {confirmDelete.batchNumber}
              </span>{" "}
              from{" "}
              <span className="text-accent-800 font-semibold">
                {confirmDelete.medicineName}
              </span>
              ? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <CustomButton
                variant="cancel"
                size="small"
                fullWidth={false}
                onClick={() => setConfirmDelete(null)}
              >
                Cancel
              </CustomButton>
              <CustomButton
                variant="primary"
                size="small"
                fullWidth={false}
                loading={deleting}
                onClick={handleDelete}
              >
                Remove
              </CustomButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
