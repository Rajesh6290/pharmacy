import * as Yup from "yup";

export const medicineSchema = Yup.object({
  name: Yup.string().min(2).max(200).required("Medicine name is required"),
  genericName: Yup.string().max(200),
  category: Yup.string().required("Category is required"),
  manufacturer: Yup.string().required("Manufacturer is required"),
  sku: Yup.string()
    .matches(/^[A-Z0-9-]+$/, "SKU must be uppercase alphanumeric with hyphens")
    .required("SKU is required"),
  unit: Yup.string().required("Unit is required"),
  requiresPrescription: Yup.boolean(),
  description: Yup.string().max(500),
  lowStockThreshold: Yup.number()
    .min(1)
    .required("Low stock threshold is required"),
  // First batch fields (optional on edit, required on create)
  batchNumber: Yup.string().when("$isEdit", {
    is: false,
    then: (s) => s.required("Batch number is required"),
    otherwise: (s) => s,
  }),
  expiryDate: Yup.date().when("$isEdit", {
    is: false,
    then: (s) =>
      s
        .min(new Date(), "Expiry must be in the future")
        .required("Expiry date is required"),
    otherwise: (s) => s,
  }),
  purchasePrice: Yup.number().when("$isEdit", {
    is: false,
    then: (s) => s.min(0).required("Purchase price is required"),
    otherwise: (s) => s,
  }),
  sellingPrice: Yup.number().when("$isEdit", {
    is: false,
    then: (s) => s.min(0).required("Selling price is required"),
    otherwise: (s) => s,
  }),
  gst: Yup.number().when("$isEdit", {
    is: false,
    then: (s) => s.min(0).max(28).required("GST is required"),
    otherwise: (s) => s,
  }),
  quantity: Yup.number().when("$isEdit", {
    is: false,
    then: (s) => s.min(1).required("Quantity is required"),
    otherwise: (s) => s,
  }),
});

export const batchSchema = Yup.object({
  medicineId: Yup.string().required("Medicine is required"),
  batchNumber: Yup.string().required("Batch number is required"),
  expiryDate: Yup.date()
    .min(new Date(), "Expiry date must be in the future")
    .required("Expiry date is required"),
  purchasePrice: Yup.number().min(0).required("Purchase price is required"),
  sellingPrice: Yup.number().min(0).required("Selling price is required"),
  gst: Yup.number().min(0).max(28).required("GST is required"),
  quantity: Yup.number().min(1).required("Quantity is required"),
});
