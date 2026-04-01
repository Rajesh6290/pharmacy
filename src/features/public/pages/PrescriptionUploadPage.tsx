"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  X,
  CheckCircle2,
  FileImage,
  Phone,
  User,
  ArrowRight,
  ClipboardList,
} from "lucide-react";
import { toast } from "react-toastify";
import CustomButton from "@/shared/common/CustomButton";

type Stage = "form" | "success";

const PrescriptionUploadPage = () => {
  const [stage, setStage] = useState<Stage>("form");
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [uploadedUrl, setUploadedUrl] = useState<string>("");
  const [uploadedPublicId, setUploadedPublicId] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [nameError, setNameError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilePick = async (file: File) => {
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      toast.error("Only images (JPG, PNG, WebP) are accepted.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File must be under 10MB.");
      return;
    }

    setPreviewUrl(URL.createObjectURL(file));
    setUploading(true);
    setUploadedUrl("");
    setUploadedPublicId("");

    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok || !json.url) throw new Error(json.error ?? "Upload failed");
      setUploadedUrl(json.url);
      setUploadedPublicId(json.publicId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
      setPreviewUrl("");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFilePick(file);
  };

  const clearImage = () => {
    setPreviewUrl("");
    setUploadedUrl("");
    setUploadedPublicId("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const validate = () => {
    let ok = true;
    if (!name.trim()) {
      setNameError("Please enter your full name.");
      ok = false;
    } else {
      setNameError("");
    }
    if (!/^\d{10}$/.test(phone.trim())) {
      setPhoneError("Enter a valid 10-digit mobile number.");
      ok = false;
    } else {
      setPhoneError("");
    }
    return ok;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    if (!uploadedUrl) {
      toast.warn("Please upload your prescription image first.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/prescriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          prescriptionUrl: uploadedUrl,
          publicId: uploadedPublicId,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? "Submission failed");
      setStage("success");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (stage === "success") {
    return (
      <div className="flex min-h-[80dvh] items-center justify-center px-4 py-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md text-center"
        >
          <div className="bg-primary-100 mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full">
            <CheckCircle2 size={40} className="text-primary-600" />
          </div>
          <h2 className="text-accent-900 mb-2 text-2xl font-bold">
            Prescription Submitted!
          </h2>
          <p className="text-accent-500 mb-1 text-sm">
            Thank you,{" "}
            <span className="text-accent-700 font-semibold">{name}</span>!
          </p>
          <p className="text-accent-500 mb-8 text-sm">
            Our pharmacist will review your prescription and give you a call on{" "}
            <span className="text-accent-700 font-semibold">+91 {phone}</span>{" "}
            shortly.
          </p>
          <div className="border-accent-200 mb-8 rounded-2xl border bg-white p-4">
            {previewUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt="Uploaded prescription"
                className="mx-auto max-h-48 rounded-xl object-contain"
              />
            )}
          </div>
          <div className="flex flex-col gap-3">
            <CustomButton
              variant="primary"
              onClick={() => {
                setStage("form");
                setPreviewUrl("");
                setUploadedUrl("");
                setUploadedPublicId("");
                setName("");
                setPhone("");
              }}
            >
              Submit Another Prescription
            </CustomButton>
            <CustomButton
              variant="secondary"
              onClick={() => (window.location.href = "/store")}
            >
              Browse Medicines
            </CustomButton>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:py-16">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="bg-primary-100 mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl">
          <ClipboardList size={28} className="text-primary-600" />
        </div>
        <h1 className="text-accent-900 mb-2 text-2xl font-bold sm:text-3xl">
          Upload Prescription
        </h1>
        <p className="text-accent-500 mx-auto max-w-sm text-sm">
          Upload your doctor&apos;s prescription. Our pharmacist will review it
          and call you back to process your order.
        </p>
      </div>

      {/* Steps */}
      <div className="mb-8 grid grid-cols-3 gap-3">
        {[
          { icon: <Upload size={18} />, label: "Upload Rx" },
          { icon: <User size={18} />, label: "Your details" },
          { icon: <Phone size={18} />, label: "We call you" },
        ].map((step, i) => (
          <div
            key={i}
            className="border-primary-100 bg-primary-50 flex flex-col items-center rounded-xl border px-3 py-3 text-center"
          >
            <div className="text-primary-500 mb-1.5">{step.icon}</div>
            <p className="text-primary-700 text-xs font-semibold">
              {step.label}
            </p>
          </div>
        ))}
      </div>

      <div className="border-accent-200 rounded-2xl border bg-white p-6 shadow-sm">
        {/* Upload Area */}
        <div className="mb-6">
          <p className="text-accent-700 mb-2 text-sm font-semibold">
            Prescription Image <span className="text-error-500">*</span>
          </p>

          <AnimatePresence mode="wait">
            {previewUrl ? (
              <motion.div
                key="preview"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="border-primary-200 relative overflow-hidden rounded-xl border bg-white"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="Prescription preview"
                  className="max-h-64 w-full object-contain"
                />
                {uploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                    <div className="border-primary-500 h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
                    <span className="text-accent-600 ml-3 text-sm">
                      Uploading…
                    </span>
                  </div>
                )}
                {!uploading && uploadedUrl && (
                  <div className="bg-primary-50 border-primary-100 flex items-center justify-between border-t px-4 py-2">
                    <span className="text-primary-600 flex items-center gap-1.5 text-xs font-medium">
                      <CheckCircle2 size={13} /> Uploaded successfully
                    </span>
                    <button
                      type="button"
                      onClick={clearImage}
                      className="text-accent-400 hover:text-error-500 text-xs underline transition"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="dropzone"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-accent-300 hover:border-primary-400 hover:bg-primary-50 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition"
              >
                <FileImage size={40} className="text-accent-300 mb-3" />
                <p className="text-accent-600 mb-1 text-sm font-medium">
                  Click to upload or drag &amp; drop
                </p>
                <p className="text-accent-400 text-xs">
                  JPG, PNG, WebP · Max 10 MB
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFilePick(file);
              e.target.value = "";
            }}
          />
        </div>

        {/* Name */}
        <div className="mb-4">
          <label className="text-accent-700 mb-1.5 flex items-center gap-1.5 text-sm font-semibold">
            <User size={14} /> Full Name{" "}
            <span className="text-error-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (nameError) setNameError("");
            }}
            placeholder="Enter your full name"
            className={`focus:ring-primary-100 w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:ring-2 ${
              nameError
                ? "border-error-400 focus:border-error-400"
                : "border-accent-300 focus:border-primary-400"
            }`}
          />
          {nameError && (
            <p className="text-error-500 mt-1 text-xs">{nameError}</p>
          )}
        </div>

        {/* Phone */}
        <div className="mb-6">
          <label className="text-accent-700 mb-1.5 flex items-center gap-1.5 text-sm font-semibold">
            <Phone size={14} /> Mobile Number{" "}
            <span className="text-error-500">*</span>
          </label>
          <div className="relative">
            <span className="border-accent-300 text-accent-500 absolute inset-y-0 left-0 flex items-center rounded-l-xl border-r bg-white px-3 text-sm">
              +91
            </span>
            <input
              type="tel"
              value={phone}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                setPhone(val);
                if (phoneError) setPhoneError("");
              }}
              placeholder="10-digit number"
              maxLength={10}
              className={`focus:ring-primary-100 w-full rounded-xl border py-2.5 pr-4 pl-14 text-sm outline-none focus:ring-2 ${
                phoneError
                  ? "border-error-400 focus:border-error-400"
                  : "border-accent-300 focus:border-primary-400"
              }`}
            />
          </div>
          {phoneError && (
            <p className="text-error-500 mt-1 text-xs">{phoneError}</p>
          )}
        </div>

        {/* Notice */}
        <div className="border-tertiary-200 bg-tertiary-50 mb-6 rounded-xl border p-3">
          <p className="text-tertiary-700 text-xs leading-relaxed">
            📋 Our pharmacist will review your prescription and call you within
            business hours. Please ensure the prescription is clearly visible.
          </p>
        </div>

        {/* Submit */}
        <CustomButton
          variant="primary"
          loading={submitting}
          disabled={uploading || submitting}
          onClick={handleSubmit}
        >
          <span className="flex items-center justify-center gap-2">
            Submit Prescription <ArrowRight size={16} />
          </span>
        </CustomButton>
      </div>

      {/* Branding */}
      <div className="mt-8 flex justify-center">
        <Image
          src="/logo.svg"
          alt="Pharmacy Logo"
          width={120}
          height={40}
          className="opacity-60"
        />
      </div>
    </div>
  );
};

export default PrescriptionUploadPage;
