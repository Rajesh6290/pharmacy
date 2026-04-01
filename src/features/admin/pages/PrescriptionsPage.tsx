"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileImage,
  Phone,
  User,
  Clock,
  CheckCircle2,
  PhoneCall,
  X,
  Eye,
  StickyNote,
  RefreshCw,
} from "lucide-react";
import useSwr from "@/shared/hooks/useSwr";
import useMutation from "@/shared/hooks/useMutation";
import CustomButton from "@/shared/common/CustomButton";
import CustomTable, { type RecordWithId } from "@/shared/common/CustomTable";
import { toast } from "react-toastify";

interface Prescription extends RecordWithId {
  _id: string;
  name: string;
  phone: string;
  prescriptionUrl: string;
  status: "pending" | "reviewed" | "called";
  notes?: string;
  createdAt: string;
}

const STATUS_CONFIG: Record<
  Prescription["status"],
  { label: string; color: string; icon: React.ReactNode }
> = {
  pending: {
    label: "Pending",
    color: "bg-warning-100 text-warning-700",
    icon: <Clock size={12} />,
  },
  reviewed: {
    label: "Reviewed",
    color: "bg-secondary-100 text-secondary-700",
    icon: <CheckCircle2 size={12} />,
  },
  called: {
    label: "Called",
    color: "bg-primary-100 text-primary-700",
    icon: <PhoneCall size={12} />,
  },
};

const PrescriptionsPage = () => {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Prescription | null>(null);
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const { mutation } = useMutation();

  const path =
    statusFilter === "all"
      ? "prescriptions"
      : `prescriptions?status=${statusFilter}`;

  const { data, isLoading, mutate } = useSwr(path);
  const prescriptions: Prescription[] = data?.prescriptions ?? [];

  const updateStatus = async (id: string, status: string) => {
    const res = await mutation(`prescriptions/${id}`, {
      method: "PATCH",
      body: { status },
      isAlert: true,
    });
    if (res?.results?.success) {
      mutate();
      if (selected?._id === id) {
        setSelected((prev) =>
          prev ? { ...prev, status: status as Prescription["status"] } : null
        );
      }
    }
  };

  const saveNotes = async () => {
    if (!selected) return;
    setSavingNotes(true);
    const res = await mutation(`prescriptions/${selected._id}`, {
      method: "PATCH",
      body: { notes },
      isAlert: true,
    });
    if (res?.results?.success) {
      mutate();
      setSelected((prev) => (prev ? { ...prev, notes } : null));
      toast.success("Notes saved");
    }
    setSavingNotes(false);
  };

  const openDetail = (row: Prescription) => {
    setSelected(row);
    setNotes(row.notes ?? "");
  };

  const columns = [
    {
      field: "name" as const,
      title: "Patient",
      render: (row: Prescription) => (
        <div className="flex items-center gap-2">
          <div className="bg-primary-100 flex h-7 w-7 items-center justify-center rounded-full">
            <User size={13} className="text-primary-600" />
          </div>
          <span className="text-accent-800 text-sm font-medium">
            {row.name}
          </span>
        </div>
      ),
    },
    {
      field: "phone" as const,
      title: "Mobile",
      render: (row: Prescription) => (
        <a
          href={`tel:+91${row.phone}`}
          onClick={(e) => e.stopPropagation()}
          className="text-primary-600 hover:text-primary-700 flex items-center gap-1.5 text-sm font-medium"
        >
          <Phone size={13} /> +91 {row.phone}
        </a>
      ),
    },
    {
      field: "prescriptionUrl" as const,
      title: "Prescription",
      render: (row: Prescription) => (
        <a
          href={row.prescriptionUrl}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-secondary-600 hover:text-secondary-700 flex items-center gap-1 text-xs underline"
        >
          <FileImage size={12} /> View Image
        </a>
      ),
    },
    {
      field: "status" as const,
      title: "Status",
      render: (row: Prescription) => {
        const cfg = STATUS_CONFIG[row.status];
        return (
          <span
            className={`${cfg.color} flex w-fit items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium`}
          >
            {cfg.icon} {cfg.label}
          </span>
        );
      },
    },
    {
      field: "createdAt" as const,
      title: "Submitted",
      render: (row: Prescription) => (
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
      render: (row: Prescription) => (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openDetail(row);
            }}
            className="text-accent-500 hover:bg-accent-100 hover:text-primary-600 rounded p-1"
            title="View details"
          >
            <Eye size={14} />
          </button>
          <a
            href={`tel:+91${row.phone}`}
            onClick={(e) => e.stopPropagation()}
            className="text-accent-500 hover:bg-primary-50 hover:text-primary-600 rounded p-1"
            title={`Call +91 ${row.phone}`}
          >
            <PhoneCall size={14} />
          </a>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-accent-900 text-xl font-bold">Prescriptions</h1>
          <p className="text-accent-500 text-sm">
            Review customer prescription uploads and call them back
          </p>
        </div>
        <button
          type="button"
          onClick={() => mutate()}
          className="text-accent-500 hover:text-primary-600 rounded-lg p-2 transition"
          title="Refresh"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Status filter tabs */}
      <div className="border-accent-200 flex gap-1 overflow-x-auto rounded-xl border bg-white p-1">
        {[
          { key: "all", label: "All" },
          { key: "pending", label: "Pending" },
          { key: "reviewed", label: "Reviewed" },
          { key: "called", label: "Called" },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setStatusFilter(tab.key)}
            className={`flex-shrink-0 rounded-lg px-4 py-1.5 text-sm font-medium transition ${
              statusFilter === tab.key
                ? "bg-primary-500 text-white"
                : "text-accent-500 hover:bg-accent-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <CustomTable
        data={prescriptions}
        columns={columns}
        isLoading={isLoading}
      />

      {/* Detail Drawer */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black"
              onClick={() => setSelected(null)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed top-0 right-0 z-50 flex h-full w-full max-w-md flex-col overflow-y-auto bg-white shadow-2xl"
            >
              {/* Drawer header */}
              <div className="border-accent-100 flex items-center justify-between border-b px-5 py-4">
                <div className="flex items-center gap-2">
                  <div className="bg-primary-100 flex h-8 w-8 items-center justify-center rounded-full">
                    <User size={15} className="text-primary-600" />
                  </div>
                  <div>
                    <p className="text-accent-900 text-sm font-semibold">
                      {selected.name}
                    </p>
                    <p className="text-accent-500 text-xs">
                      Submitted{" "}
                      {new Date(selected.createdAt).toLocaleDateString(
                        "en-IN",
                        {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        }
                      )}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="text-accent-400 hover:text-accent-700 rounded-full p-1"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 space-y-5 p-5">
                {/* Prescription image */}
                <div>
                  <p className="text-accent-700 mb-2 text-xs font-semibold tracking-wider uppercase">
                    Prescription
                  </p>
                  <div className="border-accent-200 overflow-hidden rounded-xl border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selected.prescriptionUrl}
                      alt="Prescription"
                      className="w-full object-contain"
                    />
                  </div>
                  <a
                    href={selected.prescriptionUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary-600 mt-2 inline-flex items-center gap-1 text-xs underline"
                  >
                    <FileImage size={12} /> Open full size
                  </a>
                </div>

                {/* Contact */}
                <div>
                  <p className="text-accent-700 mb-2 text-xs font-semibold tracking-wider uppercase">
                    Customer Contact
                  </p>
                  <div className="border-accent-200 flex items-center justify-between rounded-xl border bg-white p-3">
                    <div>
                      <p className="text-accent-800 text-sm font-semibold">
                        {selected.name}
                      </p>
                      <p className="text-accent-500 text-xs">
                        +91 {selected.phone}
                      </p>
                    </div>
                    <a href={`tel:+91${selected.phone}`}>
                      <CustomButton
                        variant="primary"
                        size="small"
                        fullWidth={false}
                      >
                        <span className="flex items-center gap-1.5">
                          <PhoneCall size={13} /> Call Now
                        </span>
                      </CustomButton>
                    </a>
                  </div>
                </div>

                {/* Status update */}
                <div>
                  <p className="text-accent-700 mb-2 text-xs font-semibold tracking-wider uppercase">
                    Update Status
                  </p>
                  <div className="flex gap-2">
                    {(["pending", "reviewed", "called"] as const).map((s) => {
                      const cfg = STATUS_CONFIG[s];
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => updateStatus(selected._id, s)}
                          className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition ${
                            selected.status === s
                              ? `${cfg.color} ring-2 ring-current ring-offset-1`
                              : "border-accent-300 text-accent-500 hover:border-primary-400 border"
                          }`}
                        >
                          {cfg.icon} {cfg.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <p className="text-accent-700 mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase">
                    <StickyNote size={12} /> Notes
                  </p>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add notes about this prescription or customer call…"
                    className="border-accent-300 focus:border-primary-400 focus:ring-primary-100 w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none focus:ring-2"
                  />
                  <div className="mt-2 flex justify-end">
                    <CustomButton
                      variant="secondary"
                      size="small"
                      fullWidth={false}
                      loading={savingNotes}
                      onClick={saveNotes}
                    >
                      Save Notes
                    </CustomButton>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PrescriptionsPage;
