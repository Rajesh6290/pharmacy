"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Building2, X } from "lucide-react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import useSwr from "@/shared/hooks/useSwr";
import useMutation from "@/shared/hooks/useMutation";
import CustomTable from "@/shared/common/CustomTable";
import CustomButton from "@/shared/common/CustomButton";
import { vendorSchema } from "@/features/admin/schema/vendorSchema";

interface Vendor {
  _id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  gstin?: string;
  licenseNumber?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  [key: string]: unknown;
}

type VendorForm = Omit<
  Vendor,
  "_id" | "isActive" | "createdAt" | keyof { [key: string]: unknown }
>;

const EMPTY_FORM: VendorForm = {
  name: "",
  contactPerson: "",
  phone: "",
  email: "",
  address: "",
  gstin: "",
  licenseNumber: "",
  notes: "",
};

export default function VendorsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editVendor, setEditVendor] = useState<Vendor | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Vendor | null>(null);
  const [deleting, setDeleting] = useState(false);

  const query = [
    `page=${page}`,
    search ? `search=${encodeURIComponent(search)}` : "",
  ]
    .filter(Boolean)
    .join("&");

  const { data, isLoading, mutate } = useSwr(`vendors?${query}`);
  const { mutation } = useMutation();

  const vendors: Vendor[] = data?.data?.vendors ?? [];
  const pagination = data?.data?.pagination;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  };

  const openAdd = () => {
    setEditVendor(null);
    setShowForm(true);
  };

  const openEdit = (v: Vendor) => {
    setEditVendor(v);
    setShowForm(true);
  };

  const handleSubmit = async (
    values: VendorForm,
    { resetForm }: { resetForm: () => void }
  ) => {
    const endpoint = editVendor ? `vendors/${editVendor._id}` : "vendors";
    const method = editVendor ? "PATCH" : "POST";
    const res = await mutation(endpoint, {
      method,
      body: values,
      isAlert: true,
    });
    if (res?.results?.success) {
      mutate();
      setShowForm(false);
      resetForm();
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    const res = await mutation(`vendors/${confirmDelete._id}`, {
      method: "DELETE",
      isAlert: true,
    });
    if (res?.results?.success) {
      setConfirmDelete(null);
      mutate();
    }
    setDeleting(false);
  };

  const columns = [
    {
      field: "name" as const,
      title: "Vendor",
      render: (row: Vendor) => (
        <div className="flex items-center gap-3">
          <div className="bg-secondary-100 text-secondary-600 flex h-9 w-9 shrink-0 items-center justify-center rounded-full">
            <Building2 size={15} />
          </div>
          <div>
            <p className="text-accent-800 text-sm font-semibold">{row.name}</p>
            <p className="text-accent-400 text-xs">{row.contactPerson}</p>
          </div>
        </div>
      ),
    },
    {
      field: "phone" as const,
      title: "Contact",
      render: (row: Vendor) => (
        <div>
          <p className="text-accent-700 text-sm">{row.phone}</p>
          <p className="text-accent-400 text-xs">{row.email}</p>
        </div>
      ),
    },
    {
      field: "gstin" as const,
      title: "GSTIN",
      render: (row: Vendor) => (
        <span className="text-accent-500 font-mono text-xs">
          {row.gstin ?? "—"}
        </span>
      ),
    },
    {
      field: "address" as const,
      title: "Address",
      render: (row: Vendor) => (
        <span className="text-accent-500 max-w-[160px] truncate text-xs">
          {row.address}
        </span>
      ),
    },
    {
      field: "isActive" as const,
      title: "Status",
      render: (row: Vendor) => (
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
            row.isActive
              ? "bg-primary-100 text-primary-700"
              : "bg-error-100 text-error-700"
          }`}
        >
          {row.isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      field: "_id" as const,
      title: "Actions",
      render: (row: Vendor) => (
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => openEdit(row)}
            className="text-accent-400 hover:text-primary-600 rounded p-1.5"
            title="Edit"
          >
            <Pencil size={14} />
          </button>
          <button
            type="button"
            onClick={() => setConfirmDelete(row)}
            className="text-accent-400 hover:text-error-600 rounded p-1.5"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  const formInitialValues: VendorForm = editVendor
    ? {
        name: editVendor.name,
        contactPerson: editVendor.contactPerson,
        phone: editVendor.phone,
        email: editVendor.email,
        address: editVendor.address,
        gstin: editVendor.gstin ?? "",
        licenseNumber: editVendor.licenseNumber ?? "",
        notes: editVendor.notes ?? "",
      }
    : EMPTY_FORM;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-accent-900 text-2xl font-bold">Vendors</h1>
          <p className="text-accent-500 mt-0.5 text-sm">
            Manage medicine suppliers and vendors
          </p>
        </div>
        <CustomButton
          variant="primary"
          size="small"
          fullWidth={false}
          onClick={openAdd}
        >
          <Plus size={14} /> Add Vendor
        </CustomButton>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by name, contact, email…"
          className="border-accent-300 focus:border-primary-500 w-72 rounded-lg border bg-white px-3 py-2 text-sm outline-none"
        />
        <CustomButton
          variant="primary"
          size="small"
          fullWidth={false}
          type="submit"
        >
          Search
        </CustomButton>
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
            <X size={14} /> Clear
          </button>
        )}
      </form>

      {/* Table */}
      <div className="border-accent-200 rounded-xl border bg-white shadow-sm">
        <CustomTable data={vendors} columns={columns} isLoading={isLoading} />
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

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-16">
          <div className="border-accent-200 w-full max-w-2xl rounded-2xl border bg-white shadow-2xl">
            <div className="border-accent-100 flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-accent-900 text-lg font-semibold">
                {editVendor ? "Edit Vendor" : "Add Vendor"}
              </h2>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-accent-400 hover:text-accent-700 rounded p-1"
              >
                <X size={20} />
              </button>
            </div>

            <Formik
              key={editVendor?._id ?? "new"}
              initialValues={formInitialValues}
              validationSchema={vendorSchema}
              onSubmit={handleSubmit}
            >
              {({ isSubmitting }) => (
                <Form className="grid grid-cols-2 gap-4 p-6">
                  {[
                    { name: "name", label: "Company Name *", col: 2 },
                    { name: "contactPerson", label: "Contact Person *" },
                    { name: "phone", label: "Phone *" },
                    { name: "email", label: "Email *" },
                    { name: "address", label: "Address *", col: 2 },
                    { name: "gstin", label: "GSTIN" },
                    { name: "licenseNumber", label: "License Number" },
                  ].map(({ name, label, col }) => (
                    <div
                      key={name}
                      className={col === 2 ? "col-span-2" : "col-span-1"}
                    >
                      <label className="text-accent-700 mb-1 block text-sm font-medium">
                        {label}
                      </label>
                      <Field
                        name={name}
                        className="border-accent-300 focus:border-primary-500 w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none"
                      />
                      <ErrorMessage
                        name={name}
                        component="p"
                        className="text-error-600 mt-0.5 text-xs"
                      />
                    </div>
                  ))}

                  <div className="col-span-2">
                    <label className="text-accent-700 mb-1 block text-sm font-medium">
                      Notes
                    </label>
                    <Field
                      as="textarea"
                      name="notes"
                      rows={2}
                      className="border-accent-300 focus:border-primary-500 w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none"
                    />
                  </div>

                  <div className="col-span-2 flex justify-end gap-3 pt-2">
                    <CustomButton
                      variant="cancel"
                      size="small"
                      fullWidth={false}
                      type="button"
                      onClick={() => setShowForm(false)}
                    >
                      Cancel
                    </CustomButton>
                    <CustomButton
                      variant="primary"
                      size="small"
                      fullWidth={false}
                      type="submit"
                      loading={isSubmitting}
                    >
                      {editVendor ? "Update Vendor" : "Add Vendor"}
                    </CustomButton>
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="border-accent-200 w-full max-w-sm rounded-2xl border bg-white p-6 shadow-2xl">
            <h3 className="text-accent-900 mb-1 text-lg font-semibold">
              Delete Vendor
            </h3>
            <p className="text-accent-500 mb-5 text-sm">
              Delete{" "}
              <span className="text-accent-800 font-semibold">
                {confirmDelete.name}
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
                Delete
              </CustomButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
