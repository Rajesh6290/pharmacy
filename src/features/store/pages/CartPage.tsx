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
  Banknote,
  Smartphone,
  Upload,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { toast } from "react-toastify";
import { useAuth } from "@/shared/hooks/useAuth";
import { useCart, type CartItem } from "@/features/store/store/cartContext";
import useMutation from "@/shared/hooks/useMutation";
import CustomButton from "@/shared/common/CustomButton";

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

  const [payMethod, setPayMethod] = useState<PayMethod>("razorpay");
  const [placing, setPlacing] = useState(false);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const prescriptionPending = items.some(
    (i) => i.medicine.requiresPrescription && !i.prescriptionUrl
  );

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
      <div className="flex flex-col items-center justify-center gap-5 py-24 text-center">
        <ShoppingCart size={56} className="text-accent-300" strokeWidth={1.2} />
        <div>
          <p className="text-accent-700 text-lg font-semibold">
            Your cart is empty
          </p>
          <p className="text-accent-500 mt-1 text-sm">
            Browse medicines and add them to your cart.
          </p>
        </div>
        <Link href="/store">
          <CustomButton variant="primary" fullWidth={false}>
            Browse Store
          </CustomButton>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <h1 className="text-accent-900 text-2xl font-bold">Your Cart</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Cart Items */}
        <div className="space-y-4 lg:col-span-2">
          {items.map((item) => {
            const key = `${item.medicine._id}-${item.batch.batchNumber}`;
            const itemTotal = parseFloat(
              (
                item.batch.sellingPrice *
                item.qty *
                (1 + item.batch.gst / 100)
              ).toFixed(2)
            );
            const isUploading = uploadingFor === key;

            return (
              <div
                key={key}
                className="border-accent-200 rounded-xl border bg-white p-4 shadow-sm"
              >
                <div className="flex gap-4">
                  {/* Image */}
                  <div className="border-accent-100 bg-accent-50 flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border">
                    {item.medicine.photo ? (
                      <Image
                        src={item.medicine.photo}
                        alt={item.medicine.name}
                        width={56}
                        height={56}
                        className="h-14 w-14 object-contain"
                      />
                    ) : (
                      <Package size={24} className="text-accent-300" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-accent-900 font-semibold">
                          {item.medicine.name}
                        </p>
                        <p className="text-accent-400 text-xs">
                          Batch: {item.batch.batchNumber} | Exp:{" "}
                          {new Date(item.batch.expiryDate).toLocaleDateString(
                            "en-IN"
                          )}
                        </p>
                        <p className="text-primary-600 text-sm font-medium">
                          ₹{item.batch.sellingPrice}/{item.medicine.unit}
                          <span className="text-accent-400 ml-1 text-xs font-normal">
                            incl. {item.batch.gst}% GST
                          </span>
                        </p>
                      </div>
                      <p className="text-accent-800 shrink-0 text-sm font-bold">
                        ₹{itemTotal.toFixed(2)}
                      </p>
                    </div>

                    {/* Qty Controls */}
                    <div className="mt-3 flex items-center justify-between">
                      <div className="border-accent-300 flex items-center gap-2 rounded-lg border">
                        <button
                          type="button"
                          onClick={() =>
                            updateQty(
                              item.medicine._id,
                              item.batch.batchNumber,
                              -1
                            )
                          }
                          className="text-accent-600 hover:bg-accent-50 rounded-l-lg px-2.5 py-1.5"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="text-accent-800 min-w-[1.5rem] text-center text-sm font-medium">
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
                          className="text-accent-600 hover:bg-accent-50 rounded-r-lg px-2.5 py-1.5"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          removeItem(item.medicine._id, item.batch.batchNumber)
                        }
                        className="text-error-400 hover:text-error-600 rounded p-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Prescription Upload */}
                {item.medicine.requiresPrescription && (
                  <div className="bg-warning-50 mt-3 rounded-lg px-3 py-2.5">
                    <p className="text-warning-800 mb-1.5 flex items-center gap-1 text-xs font-semibold">
                      <AlertCircle size={13} />
                      Prescription required for this item
                    </p>
                    {item.prescriptionUrl ? (
                      <p className="text-primary-700 flex items-center gap-1 text-xs font-medium">
                        <CheckCircle2 size={12} />
                        Prescription uploaded
                        <button
                          type="button"
                          onClick={() =>
                            setPrescription(
                              item.medicine._id,
                              item.batch.batchNumber,
                              ""
                            )
                          }
                          className="text-warning-700 ml-1 underline"
                        >
                          Change
                        </button>
                      </p>
                    ) : (
                      <CustomButton
                        variant="secondary"
                        size="small"
                        fullWidth={false}
                        loading={isUploading}
                        startIcon={<Upload size={12} />}
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
              </div>
            );
          })}
        </div>

        {/* Order Summary */}
        <div className="space-y-4">
          <div className="border-accent-200 rounded-xl border bg-white p-5 shadow-sm">
            <h2 className="text-accent-800 mb-4 font-semibold">
              Order Summary
            </h2>
            <div className="text-accent-600 space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal ({totalItems} items)</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>GST</span>
                <span>₹{totalGst.toFixed(2)}</span>
              </div>
              <div className="border-accent-200 flex justify-between border-t pt-2 text-base font-bold">
                <span className="text-accent-800">Total</span>
                <span className="text-primary-600">
                  ₹{grandTotal.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Payment Method */}
            <div className="mt-5">
              <p className="text-accent-700 mb-2 text-sm font-semibold">
                Payment Method
              </p>
              <div className="space-y-2">
                {(
                  [
                    {
                      value: "razorpay",
                      label: "Online Payment",
                      sub: "UPI, Card, Net Banking",
                      Icon: CreditCard,
                    },
                    {
                      value: "cod",
                      label: "Cash on Delivery",
                      sub: "Pay when delivered",
                      Icon: Banknote,
                    },
                  ] as const
                ).map(({ value, label, sub, Icon }) => (
                  <label
                    key={value}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 transition-all ${
                      payMethod === value
                        ? "border-primary-500 bg-primary-50"
                        : "border-accent-200 hover:border-primary-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payMethod"
                      value={value}
                      checked={payMethod === value}
                      onChange={() => setPayMethod(value)}
                      className="text-primary-600"
                    />
                    <Icon
                      size={16}
                      className={
                        payMethod === value
                          ? "text-primary-600"
                          : "text-accent-400"
                      }
                    />
                    <div className="min-w-0">
                      <p className="text-accent-800 text-sm font-medium">
                        {label}
                      </p>
                      <p className="text-accent-400 text-xs">{sub}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* UPI badge for Razorpay */}
            {payMethod === "razorpay" && (
              <div className="bg-accent-50 mt-3 flex items-center gap-2 rounded-lg px-3 py-2">
                <Smartphone size={14} className="text-primary-500 shrink-0" />
                <p className="text-accent-500 text-xs">
                  Powered by Razorpay — secure SSL payment
                </p>
              </div>
            )}

            {prescriptionPending && (
              <p className="text-warning-700 mt-3 flex items-center gap-1.5 text-xs">
                <AlertCircle size={13} />
                Upload prescriptions for all Rx items first
              </p>
            )}

            {!isAuthenticated && (
              <p className="text-accent-500 mt-3 text-xs">
                <Link href="/login" className="text-primary-600 underline">
                  Login
                </Link>{" "}
                to place your order.
              </p>
            )}

            <div className="mt-5">
              {payMethod === "razorpay" ? (
                <CustomButton
                  variant="primary"
                  loading={placing}
                  disabled={prescriptionPending || !isAuthenticated}
                  startIcon={<CreditCard size={16} />}
                  onClick={handleRazorpay}
                >
                  Pay ₹{grandTotal.toFixed(2)}
                </CustomButton>
              ) : (
                <CustomButton
                  variant="primary"
                  loading={placing}
                  disabled={prescriptionPending || !isAuthenticated}
                  startIcon={<Banknote size={16} />}
                  onClick={handleCOD}
                >
                  Place Order (COD)
                </CustomButton>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
