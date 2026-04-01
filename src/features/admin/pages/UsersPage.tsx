"use client";

import { useState } from "react";
import {
  UserCheck,
  UserX,
  Shield,
  X,
  Trash2,
  UserPlus,
  Eye,
  EyeOff,
} from "lucide-react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import useSwr from "@/shared/hooks/useSwr";
import useMutation from "@/shared/hooks/useMutation";
import CustomTable from "@/shared/common/CustomTable";
import CustomButton from "@/shared/common/CustomButton";

const addStaffSchema = Yup.object({
  name: Yup.string()
    .trim()
    .min(2, "Name too short")
    .required("Name is required"),
  email: Yup.string().email("Invalid email").required("Email is required"),
  phone: Yup.string()
    .trim()
    .min(10, "Invalid phone")
    .required("Phone is required"),
  password: Yup.string()
    .min(6, "Min 6 characters")
    .required("Password is required"),
  role: Yup.string()
    .oneOf(["pharmacist", "admin"])
    .required("Role is required"),
});

interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: "customer" | "admin" | "pharmacist";
  isActive: boolean;
  photo?: string;
  address?: string;
  createdAt: string;
  [key: string]: unknown;
}

const ROLE_COLORS: Record<string, string> = {
  customer: "bg-tertiary-100 text-tertiary-700",
  pharmacist: "bg-secondary-100 text-secondary-700",
  admin: "bg-primary-100 text-primary-700",
};

const ROLES = ["customer", "pharmacist", "admin"] as const;

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<User | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const query = [
    `page=${page}`,
    search ? `search=${encodeURIComponent(search)}` : "",
    roleFilter ? `role=${roleFilter}` : "",
  ]
    .filter(Boolean)
    .join("&");

  const { data, isLoading, mutate } = useSwr(`users?${query}`);
  const { mutation } = useMutation();

  const users: User[] = data?.data?.users ?? [];
  const pagination = data?.data?.pagination;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  };

  const patchUser = async (id: string, updates: Partial<User>) => {
    setUpdating(id);
    const res = await mutation(`users/${id}`, {
      method: "PATCH",
      body: updates,
      isAlert: true,
    });
    if (res?.results?.success) mutate();
    setUpdating(null);
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setUpdating(confirmDelete._id);
    const res = await mutation(`users/${confirmDelete._id}`, {
      method: "DELETE",
      isAlert: true,
    });
    if (res?.results?.success) {
      setConfirmDelete(null);
      mutate();
    }
    setUpdating(null);
  };

  const columns = [
    {
      field: "name" as const,
      title: "User",
      render: (row: User) => (
        <div className="flex items-center gap-3">
          {row.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={row.photo}
              alt={row.name}
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <div className="bg-primary-100 text-primary-600 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
              {row.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-accent-800 text-sm font-medium">{row.name}</p>
            <p className="text-accent-400 text-xs">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      field: "phone" as const,
      title: "Phone",
      render: (row: User) => (
        <span className="text-accent-600 text-sm">{row.phone}</span>
      ),
    },
    {
      field: "role" as const,
      title: "Role",
      render: (row: User) => (
        <select
          value={row.role}
          disabled={updating === row._id}
          onChange={(e) =>
            patchUser(row._id, { role: e.target.value as User["role"] })
          }
          className={`cursor-pointer rounded-full border-0 px-2.5 py-0.5 text-xs font-medium outline-none ${ROLE_COLORS[row.role]}`}
        >
          {ROLES.map((r) => (
            <option key={r} value={r} className="text-accent-800 bg-white">
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </option>
          ))}
        </select>
      ),
    },
    {
      field: "isActive" as const,
      title: "Status",
      render: (row: User) => (
        <button
          type="button"
          disabled={updating === row._id}
          onClick={() => patchUser(row._id, { isActive: !row.isActive })}
          className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
            row.isActive
              ? "bg-primary-100 text-primary-700 hover:bg-primary-200"
              : "bg-error-100 text-error-700 hover:bg-error-200"
          }`}
        >
          {row.isActive ? (
            <>
              <UserCheck size={11} /> Active
            </>
          ) : (
            <>
              <UserX size={11} /> Inactive
            </>
          )}
        </button>
      ),
    },
    {
      field: "createdAt" as const,
      title: "Joined",
      render: (row: User) => (
        <span className="text-accent-400 text-xs">
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
      title: "",
      render: (row: User) => (
        <button
          type="button"
          onClick={() => setConfirmDelete(row)}
          className="text-accent-400 hover:text-error-600 rounded p-1.5 transition-colors"
          title="Delete user"
        >
          <Trash2 size={14} />
        </button>
      ),
    },
  ];

  const handleAddStaff = async (
    values: {
      name: string;
      email: string;
      phone: string;
      password: string;
      role: string;
    },
    {
      setSubmitting,
      resetForm,
    }: { setSubmitting: (v: boolean) => void; resetForm: () => void }
  ) => {
    const res = await mutation("users/create-staff", {
      method: "POST",
      body: values,
      isAlert: true,
    });
    setSubmitting(false);
    if (res?.results?.success) {
      resetForm();
      setShowAddStaff(false);
      mutate();
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-accent-900 text-2xl font-bold">Users</h1>
          <p className="text-accent-500 mt-0.5 text-sm">
            Manage all registered user accounts
          </p>
        </div>
        <CustomButton
          variant="primary"
          size="small"
          fullWidth={false}
          onClick={() => setShowAddStaff(true)}
        >
          <UserPlus size={15} className="mr-1.5" />
          Add Staff
        </CustomButton>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name, email, phone…"
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

        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setPage(1);
          }}
          className="border-accent-300 focus:border-primary-500 rounded-lg border bg-white px-3 py-2 text-sm outline-none"
        >
          <option value="">All Roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </option>
          ))}
        </select>

        {(search || roleFilter) && (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setSearchInput("");
              setRoleFilter("");
              setPage(1);
            }}
            className="text-accent-500 hover:text-error-600 flex items-center gap-1 text-sm"
          >
            <X size={14} /> Clear
          </button>
        )}
      </div>

      {/* Stats pill */}
      {pagination && (
        <div className="flex items-center gap-2">
          <Shield size={14} className="text-primary-500" />
          <span className="text-accent-500 text-sm">
            {pagination.total} total users
          </span>
        </div>
      )}

      {/* Table */}
      <div className="border-accent-200 rounded-xl border bg-white shadow-sm">
        <CustomTable data={users} columns={columns} isLoading={isLoading} />
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

      {/* Add Staff Modal */}
      {showAddStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="border-accent-200 w-full max-w-md rounded-2xl border bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-accent-900 text-lg font-semibold">
                  Add Staff Account
                </h3>
                <p className="text-accent-400 text-sm">
                  Create a pharmacist or admin account
                </p>
              </div>
              <button
                onClick={() => setShowAddStaff(false)}
                className="text-accent-400 hover:text-accent-700 rounded-lg p-1"
              >
                <X size={18} />
              </button>
            </div>

            <Formik
              initialValues={{
                name: "",
                email: "",
                phone: "",
                password: "",
                role: "pharmacist",
              }}
              validationSchema={addStaffSchema}
              onSubmit={handleAddStaff}
            >
              {({ isSubmitting }) => (
                <Form className="space-y-4">
                  {/* Role selector */}
                  <div>
                    <label className="text-accent-700 mb-1 block text-sm font-medium">
                      Role
                    </label>
                    <Field
                      as="select"
                      name="role"
                      className="border-accent-300 focus:border-primary-500 w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none"
                    >
                      <option value="pharmacist">Pharmacist</option>
                      <option value="admin">Admin</option>
                    </Field>
                    <ErrorMessage
                      name="role"
                      component="p"
                      className="text-error-600 mt-1 text-xs"
                    />
                  </div>

                  {/* Name */}
                  <div>
                    <label className="text-accent-700 mb-1 block text-sm font-medium">
                      Full Name
                    </label>
                    <Field
                      name="name"
                      type="text"
                      placeholder="e.g. Ravi Kumar"
                      className="border-accent-300 focus:border-primary-500 w-full rounded-lg border px-3 py-2.5 text-sm outline-none"
                    />
                    <ErrorMessage
                      name="name"
                      component="p"
                      className="text-error-600 mt-1 text-xs"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="text-accent-700 mb-1 block text-sm font-medium">
                      Email
                    </label>
                    <Field
                      name="email"
                      type="email"
                      placeholder="staff@pharmacy.com"
                      className="border-accent-300 focus:border-primary-500 w-full rounded-lg border px-3 py-2.5 text-sm outline-none"
                    />
                    <ErrorMessage
                      name="email"
                      component="p"
                      className="text-error-600 mt-1 text-xs"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="text-accent-700 mb-1 block text-sm font-medium">
                      Phone
                    </label>
                    <Field
                      name="phone"
                      type="tel"
                      placeholder="9876543210"
                      className="border-accent-300 focus:border-primary-500 w-full rounded-lg border px-3 py-2.5 text-sm outline-none"
                    />
                    <ErrorMessage
                      name="phone"
                      component="p"
                      className="text-error-600 mt-1 text-xs"
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label className="text-accent-700 mb-1 block text-sm font-medium">
                      Password
                    </label>
                    <div className="relative">
                      <Field
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Min 6 characters"
                        className="border-accent-300 focus:border-primary-500 w-full rounded-lg border px-3 py-2.5 pr-10 text-sm outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((p) => !p)}
                        className="text-accent-400 absolute top-1/2 right-3 -translate-y-1/2"
                      >
                        {showPassword ? (
                          <EyeOff size={15} />
                        ) : (
                          <Eye size={15} />
                        )}
                      </button>
                    </div>
                    <ErrorMessage
                      name="password"
                      component="p"
                      className="text-error-600 mt-1 text-xs"
                    />
                  </div>

                  <div className="flex gap-3 pt-1">
                    <CustomButton
                      variant="cancel"
                      size="small"
                      fullWidth={false}
                      type="button"
                      onClick={() => setShowAddStaff(false)}
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
                      Create Account
                    </CustomButton>
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="border-accent-200 w-full max-w-sm rounded-2xl border bg-white p-6 shadow-2xl">
            <h3 className="text-accent-900 mb-1 text-lg font-semibold">
              Delete User
            </h3>
            <p className="text-accent-500 mb-5 text-sm">
              Are you sure you want to permanently delete{" "}
              <span className="text-accent-800 font-semibold">
                {confirmDelete.name}
              </span>
              ? This action cannot be undone.
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
                loading={updating === confirmDelete._id}
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
