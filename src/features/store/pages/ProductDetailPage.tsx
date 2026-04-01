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
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      {/* Back */}
      <button
        type="button"
        onClick={() => router.back()}
        className="text-accent-500 hover:text-primary-600 flex items-center gap-1 text-sm"
      >
        <ChevronLeft size={16} />
        Back to store
      </button>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Image */}
        <div className="border-accent-200 bg-accent-50 flex items-center justify-center rounded-2xl border p-6 lg:col-span-2">
          {medicine.photo ? (
            <Image
              src={medicine.photo}
              alt={medicine.name}
              width={240}
              height={240}
              className="h-52 w-full object-contain"
            />
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Package size={72} className="text-accent-300" strokeWidth={1} />
              <p className="text-accent-400 text-xs">No image available</p>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-5 lg:col-span-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-primary-100 text-primary-700 rounded-full px-2.5 py-0.5 text-xs font-medium">
                {medicine.category}
              </span>
              {medicine.requiresPrescription && (
                <span className="bg-error-100 text-error-700 rounded-full px-2.5 py-0.5 text-xs font-medium">
                  Rx Required
                </span>
              )}
            </div>
            <h1 className="text-accent-900 mt-2 text-2xl font-bold">
              {medicine.name}
            </h1>
            {medicine.genericName && (
              <p className="text-accent-500 mt-0.5 text-sm">
                {medicine.genericName}
              </p>
            )}
            <p className="text-accent-400 mt-0.5 text-xs">
              by {medicine.manufacturer} • SKU: {medicine.sku}
            </p>
          </div>

          {medicine.description && (
            <p className="text-accent-600 border-accent-200 border-t pt-4 text-sm leading-relaxed">
              {medicine.description}
            </p>
          )}

          {/* Batch selection */}
          <div>
            <label className="text-accent-700 mb-2 block text-sm font-semibold">
              Select Batch
            </label>
            {validBatches.length === 0 ? (
              <div className="text-error-600 flex items-center gap-2 text-sm">
                <AlertCircle size={16} />
                Out of stock — no valid batches available.
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {validBatches.map((b) => (
                  <button
                    key={b.batchNumber}
                    type="button"
                    onClick={() => setSelectedBatch(b)}
                    className={`rounded-lg border px-4 py-2 text-left text-sm transition-all ${
                      selectedBatch?.batchNumber === b.batchNumber
                        ? "border-primary-500 bg-primary-50 text-primary-700"
                        : "border-accent-300 text-accent-600 hover:border-primary-300"
                    }`}
                  >
                    <p className="font-medium">Batch {b.batchNumber}</p>
                    <p className="text-xs opacity-80">
                      Exp: {new Date(b.expiryDate).toLocaleDateString("en-IN")}{" "}
                      | Stock: {b.quantity} {medicine.unit}
                    </p>
                    <p className="text-primary-600 mt-0.5 font-semibold">
                      ₹{b.sellingPrice}
                      <span className="text-accent-400 ml-1 text-xs font-normal">
                        incl. {b.gst}% GST
                      </span>
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Prescription Upload */}
          {medicine.requiresPrescription && (
            <div className="border-accent-200 bg-warning-50 rounded-xl border p-4">
              <p className="text-warning-800 mb-2 flex items-center gap-1.5 text-sm font-semibold">
                <AlertCircle size={15} />
                Prescription Required
              </p>
              <p className="text-warning-700 mb-3 text-xs">
                This medicine requires a valid doctor&apos;s prescription.
                Upload a clear photo or PDF.
              </p>
              {prescriptionUrl ? (
                <p className="text-primary-700 flex items-center gap-1.5 text-sm font-medium">
                  <CheckCircle2 size={15} />
                  Prescription uploaded
                  <button
                    type="button"
                    onClick={() => setPrescriptionUrlLocal("")}
                    className="text-warning-700 ml-2 text-xs underline"
                  >
                    Change
                  </button>
                </p>
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
            </div>
          )}

          {/* Add to Cart */}
          <div className="flex items-center gap-3">
            <CustomButton
              variant="primary"
              fullWidth={false}
              disabled={validBatches.length === 0}
              startIcon={<ShoppingCart size={17} />}
              onClick={handleAddToCart}
            >
              {alreadyInCart ? "Add Again" : "Add to Cart"}
            </CustomButton>
            <CustomButton
              variant="secondary"
              fullWidth={false}
              onClick={() => router.push("/cart")}
            >
              View Cart
            </CustomButton>
          </div>
        </div>
      </div>
    </div>
  );
}
