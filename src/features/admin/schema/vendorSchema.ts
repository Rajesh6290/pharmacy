import * as Yup from "yup";

export const vendorSchema = Yup.object({
  name: Yup.string().required("Company name is required"),
  contactPerson: Yup.string().required("Contact person is required"),
  phone: Yup.string()
    .matches(/^[6-9]\d{9}$/, "Enter a valid 10-digit phone number")
    .required("Phone is required"),
  email: Yup.string().email("Invalid email").required("Email is required"),
  address: Yup.string().required("Address is required"),
  gstin: Yup.string()
    .matches(
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
      "Invalid GSTIN format"
    )
    .optional(),
  licenseNumber: Yup.string().optional(),
  notes: Yup.string().optional(),
});
