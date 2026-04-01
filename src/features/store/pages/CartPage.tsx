"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Package,
  CreditCard,
  Upload,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Tag,
  Heart,
  Truck,
  ChevronRight,
  Gift,
  ChevronDown,
  Pill,
  Info,
} from "lucide-react";
import { toast } from "react-toastify";
import { useAuth } from "@/shared/hooks/useAuth";
import { useCart, type CartItem } from "@/features/store/store/cartContext";
import useMutation from "@/shared/hooks/useMutation";
import useSwr from "@/shared/hooks/useSwr";
import CustomButton from "@/shared/common/CustomButton";
import { motion, AnimatePresence } from "framer-motion";

// Medicine type
type Medicine = {
  _id: string;
  name: string;
  genericName?: string;
  category: string;
  manufacturer: string;
  photo?: string;
  requiresPrescription: boolean;
  quantity: number;
  batches?: Array<{
    batchNumber: string;
    quantity: number;
    expiryDate: string;
    mrp?: number;
    sellingPrice: number;
  }>;
};

// Razorpay types
declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}
interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  handler: (response: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void;
  modal?: { ondismiss?: () => void };
}
interface RazorpayInstance {
  open(): void;
}

type PayMethod = "razorpay" | "cod";

// Helper functions for medicine card
function getLowestPrice(med: Medicine) {
  const valid = med.batches?.filter(
    (b) => b.quantity > 0 && new Date(b.expiryDate) > new Date()
  );
  if (!valid || !valid.length) return null;
  return Math.min(...valid.map((b) => b.sellingPrice));
}

function getHighestMrp(med: Medicine) {
  const valid = med.batches?.filter(
    (b) => b.quantity > 0 && new Date(b.expiryDate) > new Date()
  );
  if (!valid || !valid.length) return null;
  const mrps = valid.map((b) => b.mrp ?? b.sellingPrice * 1.2);
  return Math.max(...mrps);
}

// Product Recommendation Card
function RecommendationCard({ med }: { med: Medicine }) {
  const price = getLowestPrice(med);
  const mrp = getHighestMrp(med);
  const discount =
    price && mrp && mrp > price
      ? Math.round(((mrp - price) / mrp) * 100)
      : null;

  return (
    <Link href={`/products/${med._id}`}>
      <motion.div
        whileHover={{ y: -2 }}
        className="border-accent-200 group flex w-44 shrink-0 flex-col overflow-hidden rounded-lg border bg-white shadow-sm transition-all hover:shadow-md"
      >
        {/* Image */}
        <div className="bg-accent-50 relative h-36 w-full">
          {discount && (
            <span className="bg-error-500 absolute top-2 left-2 rounded-md px-2 py-0.5 text-[10px] font-bold text-white">
              {discount}% OFF
            </span>
          )}
          {med.photo ? (
            <Image
              src={med.photo}
              alt={med.name}
              fill
              className="object-contain p-3"
              sizes="176px"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Pill size={32} className="text-accent-300" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-1 flex-col p-3">
          <h3 className="text-accent-900 line-clamp-2 text-xs leading-snug font-semibold">
            {med.name}
          </h3>
          <p className="text-accent-400 mt-0.5 line-clamp-1 text-[10px]">
            {med.manufacturer}
          </p>

          <div className="mt-2 flex items-baseline gap-1.5">
            {price ? (
              <>
                <p className="text-accent-900 text-sm font-bold">
                  ₹{price.toFixed(0)}
                </p>
                {mrp && mrp > price && (
                  <p className="text-accent-400 text-[10px] line-through">
                    ₹{mrp.toFixed(0)}
                  </p>
                )}
              </>
            ) : (
              <p className="text-accent-400 text-[10px]">Out of stock</p>
            )}
          </div>

          {discount && (
            <p className="text-primary-600 mt-1 text-[10px] font-semibold">
              {discount}% OFF
            </p>
          )}
        </div>

        {/* Add Button */}
        <div className="border-accent-100 border-t px-3 py-2">
          <button className="bg-primary-500 hover:bg-primary-600 flex w-full items-center justify-center gap-1 rounded-md py-1.5 text-[11px] font-bold text-white transition">
            <Plus size={12} />
            Add
          </button>
        </div>
      </motion.div>
    </Link>
  );
}

export default function CartPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { mutation } = useMutation();
  const {
    items,
    removeItem,
    updateQty,
    setPrescription,
    clearCart,
    subtotal,
    totalGst,
    grandTotal,
    totalItems,
  } = useCart();

  const [payMethod] = useState<PayMethod>("razorpay");
  const [placing, setPlacing] = useState(false);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [showCouponInput, setShowCouponInput] = useState(false);
  const [recommendationsTab, setRecommendationsTab] = useState("lastMinute");
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Fetch recommendations
  const { data: recommendationsData } = useSwr("medicines?limit=12");
  const recommendations =
    (recommendationsData?.results?.data as Medicine[]) || [];

  const prescriptionPending = items.some(
    (i) => i.medicine.requiresPrescription && !i.prescriptionUrl
  );

  const handleApplyCoupon = () => {
    if (couponCode.trim().toUpperCase() === "PE25MED") {
      setCouponApplied(true);
      setShowCouponInput(false);
      toast.success("Coupon applied successfully!");
    } else {
      toast.error("Invalid coupon code");
    }
  };

  const savings = couponApplied ? subtotal * 0.15 : 0;
  const finalTotal = grandTotal - savings;

  // Redirect guests to login
  if (!isLoading && !isAuthenticated) {
    router.replace("/login?redirect=/cart");
    return (
      <div className="bg-accent-50 flex h-dvh items-center justify-center">
        <div className="border-primary-200 border-t-primary-600 h-10 w-10 animate-spin rounded-full border-4" />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-accent-50 flex h-dvh items-center justify-center">
        <div className="border-primary-200 border-t-primary-600 h-10 w-10 animate-spin rounded-full border-4" />
      </div>
    );
  }

  const handlePrescriptionUpload = async (
    item: CartItem,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const key = `${item.medicine._id}-${item.batch.batchNumber}`;
    setUploadingFor(key);
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
      setPrescription(item.medicine._id, item.batch.batchNumber, url);
      toast.success("Prescription uploaded");
    } catch {
      toast.error("Upload failed. Try again.");
    } finally {
      setUploadingFor(null);
      e.target.value = "";
    }
  };

  const buildOrderPayload = (
    paymentStatus: "paid" | "pending",
    razorpayPaymentId?: string
  ) => ({
    items: items.map((i) => ({
      medicine: i.medicine._id,
      medicineName: i.medicine.name,
      batchNumber: i.batch.batchNumber,
      quantity: i.qty,
      unitPrice: i.batch.sellingPrice,
      gst: i.batch.gst,
      discount: 0,
      total: parseFloat(
        (i.batch.sellingPrice * i.qty * (1 + i.batch.gst / 100)).toFixed(2)
      ),
      prescriptionUrl: i.prescriptionUrl,
    })),
    subtotal: parseFloat(subtotal.toFixed(2)),
    totalGst: parseFloat(totalGst.toFixed(2)),
    totalAmount: grandTotal,
    paymentMethod: payMethod,
    paymentStatus,
    prescriptionUrl: items.find((i) => i.prescriptionUrl)?.prescriptionUrl,
    razorpayPaymentId,
    customerName: user?.name,
    customerPhone: user?.phone,
  });

  const createOrder = async (payload: ReturnType<typeof buildOrderPayload>) => {
    const res = await mutation("orders", { method: "POST", body: payload });
    const data = res?.results as {
      success: boolean;
      data?: { order: { _id: string; orderNumber: string } };
      message?: string;
    };
    if (!data?.success)
      throw new Error(data?.message ?? "Order creation failed");
    return data.data!.order;
  };

  const handleRazorpay = async () => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    if (prescriptionPending) {
      toast.warn("Please upload all required prescriptions first.");
      return;
    }

    setPlacing(true);

    // 1) Load Razorpay script if not yet loaded
    if (!window.Razorpay) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load Razorpay"));
        document.body.appendChild(script);
      });
    }

    try {
      // 2) Create Razorpay order on server
      const rpRes = await mutation("razorpay/create-order", {
        method: "POST",
        body: { amount: grandTotal },
      });
      const rpData = rpRes?.results as {
        orderId: string;
        amount: number;
        currency: string;
        keyId: string;
        error?: string;
      };
      if (!rpRes || rpRes.status >= 400)
        throw new Error(rpData?.error ?? "Payment init failed");

      // 3) Open Razorpay checkout
      await new Promise<void>((resolve, reject) => {
        const rzp = new window.Razorpay({
          key: rpData.keyId,
          amount: rpData.amount as number,
          currency: rpData.currency,
          name: "Sidheswar Drugs House",
          description: "Medicine Purchase",
          order_id: rpData.orderId,
          prefill: {
            name: user?.name,
            email: user?.email,
          },
          theme: { color: "#26834F" },
          handler: async (response) => {
            try {
              // 4) Verify signature
              const verifyRes = await mutation("razorpay/verify", {
                method: "POST",
                body: response,
              });
              const verifyData = verifyRes?.results as {
                success: boolean;
                error?: string;
              };
              if (!verifyData?.success)
                throw new Error(verifyData?.error ?? "Verification failed");

              // 5) Create our order in DB
              const order = await createOrder(
                buildOrderPayload("paid", response.razorpay_payment_id)
              );

              clearCart();
              toast.success("Order placed successfully!");
              router.push(`/users?order=${order.orderNumber}`);
              resolve();
            } catch (err) {
              reject(err);
            }
          },
          modal: {
            ondismiss: () => {
              setPlacing(false);
              resolve();
            },
          },
        });
        rzp.open();
      });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Payment failed. Try again."
      );
    } finally {
      setPlacing(false);
    }
  };

  const handleCOD = async () => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    if (prescriptionPending) {
      toast.warn("Please upload all required prescriptions first.");
      return;
    }

    setPlacing(true);
    try {
      const order = await createOrder(buildOrderPayload("pending"));
      clearCart();
      toast.success("Order placed! Pay on delivery.");
      router.push(`/users?order=${order.orderNumber}`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Order failed. Try again."
      );
    } finally {
      setPlacing(false);
    }
  };

  if (totalItems === 0) {
    return (
      <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-6 py-24 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-accent-100 rounded-full p-8"
        >
          <ShoppingCart
            size={64}
            className="text-accent-400"
            strokeWidth={1.5}
          />
        </motion.div>
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <p className="text-accent-900 text-2xl font-bold">
            Your cart is empty
          </p>
          <p className="text-accent-600 mt-2 text-sm">
            Browse medicines and add them to your cart to get started
          </p>
        </motion.div>
        <Link href="/store">
          <CustomButton
            variant="primary"
            size="large"
            fullWidth={false}
            endIcon={<ArrowRight size={18} />}
          >
            Browse Store
          </CustomButton>
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-accent-50 min-h-dvh">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-accent-900 text-2xl font-bold">
              {totalItems} Items in your Cart
            </h1>
            <p className="text-accent-600 mt-0.5 text-sm">Home › Cart</p>
          </div>
          <Link
            href="#"
            className="text-primary-600 hover:text-primary-700 flex items-center gap-1 text-sm font-semibold transition"
          >
            <Heart size={16} />
            Saved for Later
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Column - Cart Items */}
          <div className="space-y-4 lg:col-span-2">
            {/* Discount Banner */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="border-primary-300 bg-primary-50 overflow-hidden rounded-xl border"
            >
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-primary-500 flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
                    <Gift size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="text-accent-900 text-sm font-bold">
                      Max <span className="text-primary-600">25% OFF</span>{" "}
                      Unlocked
                    </p>
                    <p className="text-accent-600 text-xs">
                      Apply coupon &ldquo;PE25MED&rdquo;
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCouponInput(!showCouponInput)}
                  className="bg-accent-900 hover:bg-accent-800 rounded-lg px-4 py-2 text-xs font-bold text-white transition"
                >
                  {couponApplied ? "APPLIED" : "APPLY NOW"}
                </button>
              </div>

              <AnimatePresence>
                {showCouponInput && !couponApplied && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-primary-200 border-t bg-white px-4 py-3"
                  >
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) =>
                          setCouponCode(e.target.value.toUpperCase())
                        }
                        placeholder="Enter coupon code"
                        className="border-accent-300 focus:border-primary-500 flex-1 rounded-lg border px-3 py-2 text-sm outline-none"
                      />
                      <CustomButton
                        variant="primary"
                        size="small"
                        onClick={handleApplyCoupon}
                      >
                        Apply
                      </CustomButton>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Unlock Extra Discount Message */}
            <p className="text-accent-600 text-center text-xs">
              Unlock Extra 15%* Off on these items
            </p>

            {/* Cart Items */}
            <AnimatePresence mode="popLayout">
              {items.map((item, index) => {
                const key = `${item.medicine._id}-${item.batch.batchNumber}`;
                // Discount calculation can be added here if needed
                const isUploading = uploadingFor === key;

                return (
                  <motion.div
                    key={key}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.03 }}
                    className="border-accent-200 overflow-hidden rounded-lg border bg-white shadow-sm"
                  >
                    <div className="flex gap-4 p-4">
                      {/* Image */}
                      <div className="border-accent-100 relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-white">
                        {item.medicine.photo ? (
                          <Image
                            src={item.medicine.photo}
                            alt={item.medicine.name}
                            width={80}
                            height={80}
                            className="h-full w-full object-contain p-2"
                          />
                        ) : (
                          <Package size={28} className="text-accent-300" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between">
                          <div className="min-w-0 flex-1">
                            <h3 className="text-accent-900 line-clamp-2 text-sm leading-snug font-semibold">
                              {item.medicine.name}
                            </h3>
                            <p className="text-accent-500 mt-1 text-xs">
                              {item.batch.batchNumber} | {item.medicine.unit}
                            </p>
                            <div className="mt-2 flex items-baseline gap-2">
                              <p className="text-accent-900 text-base font-bold">
                                ₹{item.batch.sellingPrice.toFixed(2)}
                              </p>
                              {/* Discount can be displayed here if available */}
                            </div>
                          </div>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() =>
                              removeItem(
                                item.medicine._id,
                                item.batch.batchNumber
                              )
                            }
                            className="text-accent-400 hover:text-error-600 -mt-1 -mr-1 p-1 transition"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>

                        <p className="text-accent-500 mt-2 text-xs">
                          Delivery by{" "}
                          <span className="font-semibold">4 Apr - 6 Apr</span>
                        </p>

                        {/* Qty Controls */}
                        <div className="mt-3 flex items-center gap-3">
                          <div className="border-accent-300 flex items-center rounded-md border">
                            <button
                              type="button"
                              onClick={() =>
                                updateQty(
                                  item.medicine._id,
                                  item.batch.batchNumber,
                                  -1
                                )
                              }
                              className="text-accent-600 hover:bg-accent-50 px-3 py-1.5 transition"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="text-accent-900 border-accent-300 min-w-10 border-x px-3 py-1.5 text-center text-sm font-semibold">
                              {item.qty}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                updateQty(
                                  item.medicine._id,
                                  item.batch.batchNumber,
                                  1
                                )
                              }
                              className="text-accent-600 hover:bg-accent-50 px-3 py-1.5 transition"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Prescription Upload */}
                    {item.medicine.requiresPrescription && (
                      <div className="border-warning-100 bg-warning-50 border-t-2 px-5 py-4">
                        <p className="text-warning-900 mb-2 flex items-center gap-1.5 text-xs font-bold">
                          <AlertCircle size={14} />
                          Prescription required
                        </p>
                        {item.prescriptionUrl ? (
                          <div className="flex items-center justify-between rounded-lg bg-white p-2.5">
                            <p className="text-primary-700 flex items-center gap-1.5 text-xs font-semibold">
                              <CheckCircle2 size={13} />
                              Prescription uploaded
                            </p>
                            <button
                              type="button"
                              onClick={() =>
                                setPrescription(
                                  item.medicine._id,
                                  item.batch.batchNumber,
                                  ""
                                )
                              }
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
                            loading={isUploading}
                            startIcon={<Upload size={13} />}
                            onClick={() => fileRefs.current[key]?.click()}
                          >
                            Upload Prescription
                          </CustomButton>
                        )}
                        <input
                          ref={(el) => {
                            fileRefs.current[key] = el;
                          }}
                          type="file"
                          accept="image/jpeg,image/png,image/webp,application/pdf"
                          className="hidden"
                          onChange={(e) => handlePrescriptionUpload(item, e)}
                        />
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Order Summary */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-4"
          >
            {/* Bill Summary Card */}
            <div className="border-accent-200 overflow-hidden rounded-lg border bg-white shadow-sm">
              {/* Cart Total Header */}
              <div className="border-accent-100 flex items-center justify-between border-b px-4 py-3">
                <span className="text-accent-700 text-sm">Cart total:</span>
                <span className="text-accent-900 text-xl font-bold">
                  ₹{finalTotal.toFixed(2)}
                </span>
              </div>

              {/* Add Delivery Address Button */}
              <div className="border-accent-100 border-b px-4 py-3">
                <CustomButton
                  variant="primary"
                  size="large"
                  endIcon={<ChevronRight size={18} />}
                >
                  Add Delivery Address
                </CustomButton>
              </div>

              {/* Coupons & Offers */}
              <div className="border-accent-100 border-b px-4 py-3">
                <p className="text-accent-600 mb-1 text-xs font-semibold tracking-wide uppercase">
                  COUPONS & OFFERS
                </p>
                <button
                  onClick={() => setShowCouponInput(true)}
                  className="text-accent-700 hover:text-primary-600 flex w-full items-center justify-between py-1 transition"
                >
                  <div className="flex items-center gap-2">
                    <Tag size={16} className="text-primary-500" />
                    <span className="text-sm font-semibold">Apply coupon</span>
                  </div>
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Bill Summary */}
              <div className="px-4 py-4">
                <h3 className="text-accent-900 mb-3 text-base font-bold">
                  Bill Summary
                </h3>
                <div className="space-y-2.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-accent-600">Total MRP</span>
                    <span className="text-accent-900 font-semibold">
                      ₹{(subtotal + totalGst).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-accent-600">Delivery charges</span>
                    <Link
                      href="#"
                      className="text-primary-600 flex items-center gap-1 text-xs font-semibold"
                    >
                      Login
                      <Info size={12} />
                    </Link>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-white p-2.5">
                    <div className="flex items-center gap-1.5">
                      <Gift size={14} className="text-primary-500 shrink-0" />
                      <span className="text-accent-600 text-xs">
                        Login to check if you have Free Delivery
                      </span>
                    </div>
                  </div>
                  {couponApplied && (
                    <div className="flex justify-between text-sm">
                      <span className="text-primary-600">Discount on MRP</span>
                      <span className="text-primary-600 font-semibold">
                        - ₹{savings.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="border-accent-200 my-3 border-t" />
                  <div className="flex justify-between text-sm">
                    <span className="text-accent-700 font-semibold">
                      Cart Value
                    </span>
                    <span className="text-accent-900 font-bold">
                      ₹{finalTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Amount to be paid */}
              <div className="border-accent-200 border-t bg-white px-4 py-4">
                <div className="flex items-center justify-between">
                  <span className="text-accent-900 text-base font-bold">
                    Amount to be paid
                  </span>
                  <span className="text-accent-900 text-xl font-bold">
                    ₹{finalTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Total Savings */}
              {couponApplied && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="border-primary-200 bg-primary-50 border-t-2 px-4 py-3"
                >
                  <div className="flex items-start gap-2">
                    <ChevronDown
                      size={14}
                      className="text-primary-600 mt-0.5"
                    />
                    <div className="flex-1">
                      <p className="text-primary-800 flex items-center gap-1.5 text-sm font-bold">
                        <Gift size={14} />
                        Total savings of ₹{savings.toFixed(0)} on this order
                      </p>
                      <p className="text-primary-700 mt-1 text-xs">
                        MRP Discount{" "}
                        {((savings / (subtotal + totalGst)) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {prescriptionPending && (
                <div className="border-warning-200 bg-warning-50 border-t px-4 py-3">
                  <p className="text-warning-900 flex items-center gap-1.5 text-xs font-semibold">
                    <AlertCircle size={14} />
                    Upload all prescriptions to proceed
                  </p>
                </div>
              )}

              {/* Payment Method removed for now - can be added back when needed */}

              {!isAuthenticated && (
                <div className="border-accent-100 bg-accent-50 border-t px-4 py-3">
                  <p className="text-accent-600 text-xs">
                    <Link
                      href="/login"
                      className="text-primary-600 font-semibold underline"
                    >
                      Login
                    </Link>{" "}
                    to place your order
                  </p>
                </div>
              )}

              <div className="border-accent-100 border-t-2 p-4">
                <CustomButton
                  variant="primary"
                  size="large"
                  loading={placing}
                  disabled={prescriptionPending || !isAuthenticated}
                  startIcon={<CreditCard size={18} />}
                  onClick={
                    payMethod === "razorpay" ? handleRazorpay : handleCOD
                  }
                >
                  {payMethod === "razorpay"
                    ? `Pay ₹${finalTotal.toFixed(2)}`
                    : "Place Order (COD)"}
                </CustomButton>
              </div>
            </div>
          </motion.div>
        </div>

        {/* "You get FREE Delivery" Banner */}
        {finalTotal > 500 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="from-tertiary-100 to-primary-100 mt-6 rounded-lg bg-linear-to-r px-6 py-4"
          >
            <p className="text-primary-900 flex items-center gap-2 text-sm font-bold">
              <Truck size={18} className="text-primary-600" />
              You get <span className="text-primary-600">
                🚚 FREE Delivery
              </span>{" "}
              on this order
            </p>
          </motion.div>
        )}

        {/* Before you check out - Recommendations */}
        {recommendations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8"
          >
            <div className="bg-tertiary-50 rounded-xl p-6">
              <h2 className="text-accent-900 mb-4 text-lg font-bold">
                Before you check out
              </h2>

              {/* Tabs */}
              <div className="border-accent-200 mb-5 flex gap-4 border-b">
                {[
                  { id: "lastMinute", label: "Last Minute Buys" },
                  { id: "forYou", label: "For You" },
                  { id: "summer", label: "Summer Store" },
                  { id: "discount", label: "Discount Store" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setRecommendationsTab(tab.id)}
                    className={`pb-2 text-sm font-semibold transition ${
                      recommendationsTab === tab.id
                        ? "text-primary-600 border-primary-600 border-b-2"
                        : "text-accent-600 hover:text-primary-600"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Product Carousel */}
              <div className="relative">
                <div className="no-scrollbar flex gap-4 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden">
                  {recommendations.slice(0, 8).map((med) => (
                    <RecommendationCard key={med._id} med={med} />
                  ))}
                </div>

                {/* Scroll indicator */}
                <div className="to-tertiary-50 pointer-events-none absolute top-0 right-0 h-full w-16 bg-linear-to-l from-transparent" />
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
