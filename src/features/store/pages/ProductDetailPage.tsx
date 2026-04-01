"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import {
  ShoppingCart,
  ChevronLeft,
  Upload,
  CheckCircle2,
  Package,
  AlertCircle,
  Shield,
  Truck,
  Clock,
  Star,
  Info,
  Award,
  Heart,
} from "lucide-react";
import { toast } from "react-toastify";
import useSwr from "@/shared/hooks/useSwr";
import useMutation from "@/shared/hooks/useMutation";
import CustomButton from "@/shared/common/CustomButton";
import { ProductDetailSkeleton } from "@/shared/common/Skeletons";
import {
  useCart,
  type CartBatch,
  type CartMedicine,
} from "@/features/store/store/cartContext";
import { motion } from "framer-motion";

interface Batch {
  batchNumber: string;
  expiryDate: string;
  sellingPrice: number;
  gst: number;
  quantity: number;
}

interface Medicine {
  _id: string;
  name: string;
  genericName?: string;
  category: string;
  manufacturer: string;
  description?: string;
  sku: string;
  unit: string;
  requiresPrescription: boolean;
  batches: Batch[];
  quantity: number;
  photo?: string;
}

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { addItem, setPrescription, items } = useCart();
  const { mutation } = useMutation();
  const { data, isLoading } = useSwr(`medicines/${params.id}`);
  const medicine: Medicine | null = data?.data ?? null;

  // Available batches only
  const validBatches = useMemo(
    () =>
      medicine?.batches.filter((b) => {
        const notExpired = new Date(b.expiryDate) > new Date();
        return notExpired && b.quantity > 0;
      }) ?? [],
    [medicine]
  );

  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [prescriptionUrl, setPrescriptionUrlLocal] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (validBatches.length > 0 && !selectedBatch) {
      setSelectedBatch(validBatches[0]);
    }
  }, [validBatches, selectedBatch]);

  const handlePrescriptionUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await mutation("upload", {
        method: "POST",
        body: fd,
        isFormData: true,
      });
      const url = res?.results?.url as string | undefined;
      if (!url) throw new Error("Upload failed");
      setPrescriptionUrlLocal(url);
      toast.success("Prescription uploaded");
    } catch {
      toast.error("Upload failed. Try again.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleAddToCart = () => {
    if (!medicine || !selectedBatch) return;

    if (medicine.requiresPrescription && !prescriptionUrl) {
      toast.warn("Please upload a prescription before adding to cart.");
      return;
    }

    const cartMed: CartMedicine = {
      _id: medicine._id,
      name: medicine.name,
      genericName: medicine.genericName,
      sku: medicine.sku,
      unit: medicine.unit,
      requiresPrescription: medicine.requiresPrescription,
      photo: medicine.photo,
    };

    const cartBatch: CartBatch = {
      batchNumber: selectedBatch.batchNumber,
      expiryDate: selectedBatch.expiryDate,
      sellingPrice: selectedBatch.sellingPrice,
      gst: selectedBatch.gst,
      quantity: selectedBatch.quantity,
    };

    addItem(cartMed, cartBatch);

    if (prescriptionUrl) {
      setPrescription(medicine._id, selectedBatch.batchNumber, prescriptionUrl);
    }

    toast.success(`${medicine.name} added to cart`);
  };

  const alreadyInCart = items.some(
    (i) =>
      i.medicine._id === medicine?._id &&
      i.batch.batchNumber === selectedBatch?.batchNumber
  );

  if (isLoading) {
    return <ProductDetailSkeleton />;
  }

  if (!medicine) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <Package size={48} className="text-accent-300" />
        <p className="text-accent-600 font-medium">Medicine not found.</p>
        <CustomButton
          variant="secondary"
          size="small"
          fullWidth={false}
          onClick={() => router.back()}
        >
          Go Back
        </CustomButton>
      </div>
    );
  }

  return (
    <div className="from-accent-50 to-primary-50 min-h-dvh bg-linear-to-br via-white">
      <div className="mx-auto max-w-360 px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumb/Back */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          type="button"
          onClick={() => router.back()}
          className="text-accent-600 hover:text-primary-600 mb-6 flex items-center gap-2 text-sm font-medium transition-colors"
        >
          <ChevronLeft size={18} />
          Back to Products
        </motion.button>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* ═══ LEFT SIDE: IMAGE GALLERY ═══ */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-4"
          >
            {/* Main Image */}
            <div className="border-accent-200 relative overflow-hidden rounded-3xl border-2 bg-white p-8 shadow-xl">
              {medicine.photo ? (
                <div className="relative h-96 w-full">
                  <Image
                    src={medicine.photo}
                    alt={medicine.name}
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
              ) : (
                <div className="flex h-96 flex-col items-center justify-center gap-3">
                  <Package
                    size={80}
                    className="text-accent-300"
                    strokeWidth={1}
                  />
                  <p className="text-accent-400 text-sm">No image available</p>
                </div>
              )}

              {/* Floating badges on image */}
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                {medicine.requiresPrescription && (
                  <span className="bg-error-500 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-white shadow-lg">
                    <AlertCircle size={12} /> Rx Required
                  </span>
                )}
                <span
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold shadow-lg ${
                    medicine.quantity > 0
                      ? "bg-primary-500 text-white"
                      : "bg-error-500 text-white"
                  }`}
                >
                  <CheckCircle2 size={12} />
                  {medicine.quantity > 0 ? "In Stock" : "Out of Stock"}
                </span>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  icon: <Shield size={18} className="text-primary-500" />,
                  text: "100% Authentic",
                },
                {
                  icon: <Truck size={18} className="text-primary-500" />,
                  text: "Fast Delivery",
                },
                {
                  icon: <Award size={18} className="text-primary-500" />,
                  text: "Quality Assured",
                },
              ].map((badge) => (
                <div
                  key={badge.text}
                  className="border-accent-200 flex flex-col items-center gap-1.5 rounded-xl border bg-white p-3 text-center"
                >
                  {badge.icon}
                  <span className="text-accent-700 text-xs font-semibold">
                    {badge.text}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* ═══ RIGHT SIDE: PRODUCT INFO ═══ */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            {/* Header */}
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="bg-primary-100 text-primary-700 inline-flex items-center gap-1 rounded-lg px-3 py-1 text-xs font-bold">
                  <Package size={12} /> {medicine.category}
                </span>
                <span className="text-accent-400 text-xs">
                  SKU: {medicine.sku}
                </span>
              </div>

              <h1 className="text-accent-900 text-3xl leading-tight font-extrabold">
                {medicine.name}
              </h1>

              {medicine.genericName && (
                <p className="text-accent-600 mt-2 text-sm font-medium">
                  Generic: {medicine.genericName}
                </p>
              )}

              <div className="mt-2 flex items-center gap-2">
                <Award size={14} className="text-accent-400" />
                <p className="text-accent-500 text-sm">
                  by {medicine.manufacturer}
                </p>
              </div>

              {/* Mock rating */}
              <div className="mt-3 flex items-center gap-2">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      className={`${
                        i < 4
                          ? "fill-warning-400 text-warning-400"
                          : "text-accent-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-accent-600 text-sm">
                  4.5 (128 reviews)
                </span>
              </div>
            </div>

            {medicine.description && (
              <div className="border-accent-200 rounded-xl border bg-white p-4">
                <h3 className="text-accent-900 mb-2 flex items-center gap-2 text-sm font-bold">
                  <Info size={14} /> Description
                </h3>
                <p className="text-accent-600 text-sm leading-relaxed">
                  {medicine.description}
                </p>
              </div>
            )}

            {/* Batch selection */}
            <div className="border-accent-200 rounded-2xl border-2 bg-white p-5 shadow-md">
              <label className="text-accent-900 mb-3 block text-sm font-bold">
                Select Batch & Quantity
              </label>
              {validBatches.length === 0 ? (
                <div className="text-error-600 flex items-center gap-2 text-sm">
                  <AlertCircle size={18} />
                  <span className="font-medium">
                    Out of stock — no valid batches available
                  </span>
                </div>
              ) : (
                <div className="space-y-3">
                  {validBatches.map((b) => (
                    <motion.button
                      key={b.batchNumber}
                      type="button"
                      onClick={() => setSelectedBatch(b)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`w-full rounded-xl border-2 p-4 text-left transition-all ${
                        selectedBatch?.batchNumber === b.batchNumber
                          ? "border-primary-500 bg-primary-50 shadow-md"
                          : "border-accent-200 hover:border-primary-300 bg-white"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-accent-900 font-bold">
                            Batch #{b.batchNumber}
                          </p>
                          <p className="text-accent-500 mt-1 text-xs">
                            Expires:{" "}
                            {new Date(b.expiryDate).toLocaleDateString("en-IN")}{" "}
                            • Stock: {b.quantity} {medicine.unit}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-primary-600 text-2xl font-extrabold">
                            ₹{b.sellingPrice}
                          </p>
                          <p className="text-accent-400 text-xs">
                            +{b.gst}% GST
                          </p>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
            </div>

            {/* Prescription Upload */}
            {medicine.requiresPrescription && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="border-warning-300 bg-warning-50 rounded-2xl border-2 p-5 shadow-md"
              >
                <p className="text-warning-900 mb-2 flex items-center gap-2 text-sm font-bold">
                  <AlertCircle size={16} />
                  Prescription Required
                </p>
                <p className="text-warning-800 mb-4 text-xs leading-relaxed">
                  This medicine requires a valid doctor&apos;s prescription.
                  Upload a clear photo or PDF before adding to cart.
                </p>
                {prescriptionUrl ? (
                  <div className="flex items-center justify-between rounded-lg bg-white p-3">
                    <p className="text-primary-700 flex items-center gap-2 text-sm font-medium">
                      <CheckCircle2 size={16} />
                      Prescription uploaded successfully
                    </p>
                    <button
                      type="button"
                      onClick={() => setPrescriptionUrlLocal("")}
                      className="text-warning-700 text-xs font-semibold underline"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <CustomButton
                    variant="secondary"
                    size="small"
                    fullWidth={false}
                    loading={uploading}
                    startIcon={<Upload size={14} />}
                    onClick={() => fileRef.current?.click()}
                  >
                    Upload Prescription
                  </CustomButton>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  className="hidden"
                  onChange={handlePrescriptionUpload}
                />
              </motion.div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <CustomButton
                variant="primary"
                size="large"
                fullWidth={false}
                disabled={validBatches.length === 0}
                startIcon={<ShoppingCart size={18} />}
                onClick={handleAddToCart}
                className="flex-1 sm:flex-none"
              >
                {alreadyInCart ? "Add Again to Cart" : "Add to Cart"}
              </CustomButton>
              <CustomButton
                variant="secondary"
                size="large"
                fullWidth={false}
                onClick={() => router.push("/cart")}
              >
                View Cart
              </CustomButton>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="border-accent-200 text-error-500 hover:border-error-300 hover:bg-error-50 flex h-12 w-12 items-center justify-center rounded-full border-2 bg-white transition-colors"
              >
                <Heart size={20} />
              </motion.button>
            </div>

            {/* Product Info Grid */}
            <div className="border-accent-200 grid grid-cols-2 gap-3 rounded-xl border bg-white p-4">
              <div>
                <p className="text-accent-500 text-xs">Category</p>
                <p className="text-accent-900 mt-1 text-sm font-bold">
                  {medicine.category}
                </p>
              </div>
              <div>
                <p className="text-accent-500 text-xs">Unit</p>
                <p className="text-accent-900 mt-1 text-sm font-bold">
                  {medicine.unit}
                </p>
              </div>
              <div>
                <p className="text-accent-500 text-xs">Available Stock</p>
                <p className="text-accent-900 mt-1 text-sm font-bold">
                  {medicine.quantity} {medicine.unit}
                </p>
              </div>
              <div>
                <p className="text-accent-500 text-xs">Manufacturer</p>
                <p className="text-accent-900 mt-1 text-sm font-bold">
                  {medicine.manufacturer}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
