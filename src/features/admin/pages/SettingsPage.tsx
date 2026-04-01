"use client";

import {
  Building2,
  Phone,
  ShieldCheck,
  FileText,
  Settings2,
} from "lucide-react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import useSwr from "@/shared/hooks/useSwr";
import useMutation from "@/shared/hooks/useMutation";
import CustomButton from "@/shared/common/CustomButton";

interface SettingsForm {
  pharmacyName: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  gstin: string;
  panNumber: string;
  license1: string;
  license2: string;
  tagline: string;
  lowStockThreshold: number;
  expiryAlertDays: number;
}

const settingsSchema = Yup.object({
  pharmacyName: Yup.string().required("Pharmacy name is required"),
  address: Yup.string().optional(),
  phone: Yup.string().optional(),
  email: Yup.string().email("Invalid email").optional().nullable(),
  website: Yup.string().optional(),
  gstin: Yup.string()
    .matches(
      /^$|^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
      "Invalid GSTIN format"
    )
    .optional(),
  panNumber: Yup.string().optional(),
  license1: Yup.string().optional(),
  license2: Yup.string().optional(),
  tagline: Yup.string().optional(),
  lowStockThreshold: Yup.number().min(1).required(),
  expiryAlertDays: Yup.number().min(1).required(),
});

const DEFAULT_SETTINGS: SettingsForm = {
  pharmacyName: "",
  address: "",
  phone: "",
  email: "",
  website: "",
  gstin: "",
  panNumber: "",
  license1: "",
  license2: "",
  tagline: "",
  lowStockThreshold: 10,
  expiryAlertDays: 30,
};

type FieldDef = {
  name: keyof SettingsForm;
  label: string;
  placeholder?: string;
  type?: string;
  col?: number;
};

const SECTIONS: {
  title: string;
  icon: React.ReactNode;
  fields: FieldDef[];
}[] = [
  {
    title: "Pharmacy Identity",
    icon: <Building2 size={16} />,
    fields: [
      { name: "pharmacyName", label: "Pharmacy / Store Name *", col: 2 },
      {
        name: "tagline",
        label: "Tagline",
        placeholder: "e.g. Your health, our priority",
        col: 2,
      },
    ],
  },
  {
    title: "Contact Details",
    icon: <Phone size={16} />,
    fields: [
      {
        name: "phone",
        label: "Mobile / Phone",
        placeholder: "e.g. 9876543210",
      },
      {
        name: "email",
        label: "Email",
        type: "email",
        placeholder: "pharmacy@example.com",
      },
      {
        name: "address",
        label: "Full Address",
        placeholder: "Shop No, Street, City, State - PIN",
        col: 2,
      },
      {
        name: "website",
        label: "Website",
        placeholder: "www.yourpharmacy.com",
      },
    ],
  },
  {
    title: "GST & Legal",
    icon: <ShieldCheck size={16} />,
    fields: [
      { name: "gstin", label: "GSTIN", placeholder: "22AAAAA0000A1Z5" },
      { name: "panNumber", label: "PAN Number", placeholder: "AAAAA0000A" },
      {
        name: "license1",
        label: "Drug License (Retail 20)",
        placeholder: "e.g. ODRET12009/R",
      },
      {
        name: "license2",
        label: "Drug License (Retail 21)",
        placeholder: "e.g. ODRET12010/RC",
      },
    ],
  },
  {
    title: "Alert Thresholds",
    icon: <Settings2 size={16} />,
    fields: [
      {
        name: "lowStockThreshold",
        label: "Low Stock Alert (units)",
        type: "number",
      },
      {
        name: "expiryAlertDays",
        label: "Expiry Alert (days before)",
        type: "number",
      },
    ],
  },
];

export default function SettingsPage() {
  const { data, isLoading, mutate } = useSwr("settings");
  const { mutation } = useMutation();

  const currentSettings: SettingsForm = data
    ? {
        pharmacyName: data.pharmacyName ?? "",
        address: data.address ?? "",
        phone: data.phone ?? "",
        email: data.email ?? "",
        website: data.website ?? "",
        gstin: data.gstin ?? "",
        panNumber: data.panNumber ?? "",
        license1: data.license1 ?? "",
        license2: data.license2 ?? "",
        tagline: data.tagline ?? "",
        lowStockThreshold: data.lowStockThreshold ?? 10,
        expiryAlertDays: data.expiryAlertDays ?? 30,
      }
    : DEFAULT_SETTINGS;

  const handleSubmit = async (values: SettingsForm) => {
    const res = await mutation("settings", {
      method: "PATCH",
      body: values,
      isAlert: true,
    });
    if (res?.results?.success) mutate();
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-accent-100 h-40 animate-pulse rounded-xl"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-accent-900 text-2xl font-bold">Settings</h1>
        <p className="text-accent-500 mt-0.5 text-sm">
          Configure pharmacy details used in invoices and alerts
        </p>
      </div>

      <Formik
        enableReinitialize
        initialValues={currentSettings}
        validationSchema={settingsSchema}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting }) => (
          <Form className="space-y-5">
            {SECTIONS.map((section) => (
              <div
                key={section.title}
                className="border-accent-200 rounded-xl border bg-white p-5 shadow-sm"
              >
                <div className="text-primary-600 mb-4 flex items-center gap-2">
                  {section.icon}
                  <h2 className="text-accent-800 text-sm font-semibold">
                    {section.title}
                  </h2>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {section.fields.map(
                    ({ name, label, placeholder, type, col }) => (
                      <div
                        key={name}
                        className={col === 2 ? "sm:col-span-2" : ""}
                      >
                        <label className="text-accent-700 mb-1 block text-sm font-medium">
                          {label}
                        </label>
                        <Field
                          name={name}
                          type={type ?? "text"}
                          placeholder={placeholder ?? ""}
                          className="border-accent-300 focus:border-primary-500 w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none"
                        />
                        <ErrorMessage
                          name={name}
                          component="p"
                          className="text-error-600 mt-0.5 text-xs"
                        />
                      </div>
                    )
                  )}
                </div>
              </div>
            ))}

            {/* Invoice Preview Hint */}
            <div className="border-tertiary-200 bg-tertiary-50 flex items-start gap-3 rounded-xl border p-4">
              <FileText
                size={18}
                className="text-tertiary-600 mt-0.5 shrink-0"
              />
              <div>
                <p className="text-tertiary-800 text-sm font-medium">
                  Invoice Template
                </p>
                <p className="text-tertiary-600 mt-0.5 text-xs">
                  All details saved here (pharmacy name, GSTIN, licenses,
                  address) will automatically appear on printed POS invoices.
                </p>
              </div>
            </div>

            <div className="flex justify-end pb-4">
              <CustomButton
                variant="primary"
                size="medium"
                fullWidth={false}
                type="submit"
                loading={isSubmitting}
              >
                Save Settings
              </CustomButton>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
}
