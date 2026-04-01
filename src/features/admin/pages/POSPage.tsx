"use client";

import { useState, useRef, useEffect } from "react";
import {
  Search,
  Trash2,
  Plus,
  Minus,
  ReceiptText,
  Printer,
  X,
  CameraOff,
  ScanBarcode,
  Banknote,
  CreditCard,
  Smartphone,
  AlertTriangle,
  ShoppingCart,
  ChevronRight,
} from "lucide-react";
import { toast } from "react-toastify";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { DecodeHintType, BarcodeFormat } from "@zxing/library";
import useSwr from "@/shared/hooks/useSwr";
import useMutation from "@/shared/hooks/useMutation";
import CustomButton from "@/shared/common/CustomButton";
import InvoiceTemplate, {
  type InvoiceData,
  type PharmacySettings,
} from "@/features/admin/components/InvoiceTemplate";

function beep() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.18);
  } catch {
    /* audio unavailable */
  }
}

function BarcodeScannerModal({
  onScan,
  onClose,
}: {
  onScan: (code: string) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const [camError, setCamError] = useState("");
  const [scanning, setScanning] = useState(false);

  const killCamera = () => {
    controlsRef.current?.stop();
    controlsRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  useEffect(() => {
    let cancelled = false;
    const timerId = setTimeout(async () => {
      if (cancelled) return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (!videoRef.current) {
          killCamera();
          return;
        }
        const hints = new Map<DecodeHintType, unknown>();
        hints.set(DecodeHintType.TRY_HARDER, true);
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [
          BarcodeFormat.CODE_128,
          BarcodeFormat.CODE_39,
          BarcodeFormat.CODE_93,
          BarcodeFormat.EAN_13,
          BarcodeFormat.EAN_8,
          BarcodeFormat.UPC_A,
          BarcodeFormat.UPC_E,
          BarcodeFormat.ITF,
          BarcodeFormat.QR_CODE,
          BarcodeFormat.DATA_MATRIX,
        ]);
        const reader = new BrowserMultiFormatReader(hints);
        setScanning(true);
        const controls = await reader.decodeFromStream(
          stream,
          videoRef.current,
          (result, err) => {
            if (cancelled) return;
            if (result) {
              cancelled = true;
              killCamera();
              beep();
              onScan(result.getText());
            }
            void err;
          }
        );
        if (cancelled) {
          controls.stop();
          killCamera();
          return;
        }
        controlsRef.current = controls;
      } catch {
        if (!cancelled) {
          setCamError("Camera access denied. Please allow camera permissions.");
          setScanning(false);
        }
      }
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(timerId);
      killCamera();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = () => {
    killCamera();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="border-accent-200 w-full max-w-sm rounded-2xl border bg-white shadow-xl">
        <div className="border-accent-100 flex items-center justify-between border-b px-5 py-4">
          <p className="text-accent-800 font-semibold">Scan Medicine Barcode</p>
          <button
            type="button"
            onClick={handleClose}
            className="text-accent-400 hover:text-accent-700 rounded p-1"
          >
            <X size={18} />
          </button>
        </div>
        <div className="relative overflow-hidden rounded-b-2xl bg-black">
          {camError ? (
            <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
              <CameraOff size={36} className="text-accent-400" />
              <p className="text-accent-300 text-sm">{camError}</p>
              <CustomButton
                variant="secondary"
                size="small"
                fullWidth={false}
                onClick={handleClose}
              >
                Close
              </CustomButton>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                className="h-64 w-full object-cover"
                muted
                playsInline
              />
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="border-primary-400 h-32 w-56 rounded-lg border-2 opacity-70" />
              </div>
              {scanning && (
                <p className="absolute right-0 bottom-3 left-0 text-center text-xs text-white/80">
                  Point camera at barcode...
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

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
  sku: string;
  unit: string;
  batches: Batch[];
}

interface CartItem {
  medicine: Medicine;
  batch: Batch;
  qty: number;
  discount: number;
  unitPrice: number;
  gst: number;
  total: number;
}

function calcItemTotal(
  price: number,
  qty: number,
  gst: number,
  discount: number
) {
  const base = price * qty * (1 - discount / 100);
  const gstAmt = base * (gst / 100);
  return parseFloat((base + gstAmt).toFixed(2));
}

// Computed at module load — acceptable precision for a POS session expiry check
const THIRTY_DAYS_FROM_NOW = new Date(
  new Date().getTime() + 30 * 24 * 60 * 60 * 1000
);

const POSPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [scanSearching, setScanSearching] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [billDiscount, setBillDiscount] = useState(0);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "upi">(
    "cash"
  );
  const [invoiceOrder, setInvoiceOrder] = useState<InvoiceData | null>(null);
  const [justAddedKey, setJustAddedKey] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const { mutation, isLoading } = useMutation();

  const { data: settingsData } = useSwr("settings");
  const settings: PharmacySettings = settingsData ?? {
    pharmacyName: "My Pharmacy",
    address: "",
    phone: "",
  };

  const searchPath = searchQuery.trim()
    ? `medicines?search=${encodeURIComponent(searchQuery.trim())}&limit=10`
    : null;
  const { data: searchData, isLoading: isSearching } = useSwr(searchPath);
  const searchResults: Medicine[] = searchData?.medicines ?? [];

  const addToCart = (med: Medicine, batch: Batch) => {
    const expiry = new Date(batch.expiryDate);
    if (expiry < new Date()) {
      toast.error(`Batch ${batch.batchNumber} is expired. Cannot add to bill.`);
      return;
    }
    if (batch.quantity === 0) {
      toast.error("No stock available for this batch.");
      return;
    }
    const key = `${med._id}-${batch.batchNumber}`;
    setCart((prev) => {
      const existing = prev.findIndex(
        (i) =>
          i.medicine._id === med._id &&
          i.batch.batchNumber === batch.batchNumber
      );
      if (existing >= 0) {
        const items = [...prev];
        const item = { ...items[existing] };
        if (item.qty >= item.batch.quantity) {
          toast.warning("Cannot exceed available stock.");
          return prev;
        }
        item.qty += 1;
        item.total = calcItemTotal(
          item.unitPrice,
          item.qty,
          item.gst,
          item.discount
        );
        items[existing] = item;
        return items;
      }
      return [
        ...prev,
        {
          medicine: med,
          batch,
          qty: 1,
          discount: 0,
          unitPrice: batch.sellingPrice,
          gst: batch.gst,
          total: calcItemTotal(batch.sellingPrice, 1, batch.gst, 0),
        },
      ];
    });
    setJustAddedKey(key);
    setTimeout(() => setJustAddedKey(null), 900);
    setSearchQuery("");
  };

  // Direct fetch on barcode scan — bypasses SWR caching/timing issues
  const handleScanResult = async (code: string) => {
    setScanSearching(true);
    try {
      const res = await fetch(
        `/api/medicines?search=${encodeURIComponent(code)}&limit=10`,
        { credentials: "include" }
      );
      const json = await res.json();
      const medicines: Medicine[] = json?.data?.medicines ?? [];
      if (medicines.length === 0) {
        toast.warning("No medicine found for this barcode.");
        return;
      }
      const med = medicines[0];
      const batch = med.batches.find(
        (b) => b.quantity > 0 && new Date(b.expiryDate) >= new Date()
      );
      if (!batch) {
        toast.error(`${med.name}: no valid stock available.`);
        return;
      }
      addToCart(med, batch);
    } catch {
      toast.error("Failed to look up medicine. Try again.");
    } finally {
      setScanSearching(false);
    }
  };

  const updateQty = (idx: number, delta: number) => {
    setCart((prev) => {
      const items = [...prev];
      const item = { ...items[idx] };
      const newQty = item.qty + delta;
      if (newQty < 1) return prev;
      if (newQty > item.batch.quantity) {
        toast.warning("Cannot exceed available stock.");
        return prev;
      }
      item.qty = newQty;
      item.total = calcItemTotal(
        item.unitPrice,
        item.qty,
        item.gst,
        item.discount
      );
      items[idx] = item;
      return items;
    });
  };

  const updateDiscount = (idx: number, value: number) => {
    if (value < 0 || value > 100) return;
    setCart((prev) => {
      const items = [...prev];
      const item = { ...items[idx] };
      item.discount = value;
      item.total = calcItemTotal(
        item.unitPrice,
        item.qty,
        item.gst,
        item.discount
      );
      items[idx] = item;
      return items;
    });
  };

  const removeFromCart = (idx: number) => {
    setCart((prev) => prev.filter((_, i) => i !== idx));
  };

  const subtotal = cart.reduce(
    (sum, i) => sum + i.unitPrice * i.qty * (1 - i.discount / 100),
    0
  );
  const totalGst = cart.reduce((sum, i) => {
    const base = i.unitPrice * i.qty * (1 - i.discount / 100);
    return sum + base * (i.gst / 100);
  }, 0);
  const totalDiscount = cart.reduce(
    (sum, i) => sum + i.unitPrice * i.qty * (i.discount / 100),
    0
  );
  const afterItemDiscount = subtotal + totalGst;
  const billDiscountAmt = afterItemDiscount * (billDiscount / 100);
  const grandTotal = afterItemDiscount - billDiscountAmt;

  const handleBill = async () => {
    if (cart.length === 0) {
      toast.error("Add at least one item.");
      return;
    }

    const body = {
      type: "pos",
      customerName: customerName || undefined,
      customerPhone: customerPhone || undefined,
      paymentMethod,
      items: cart.map((i) => ({
        medicine: i.medicine._id,
        medicineName: i.medicine.name,
        batchNumber: i.batch.batchNumber,
        quantity: i.qty,
        unitPrice: i.unitPrice,
        gst: i.gst,
        discount: i.discount,
        total: i.total,
      })),
      subtotal: parseFloat(subtotal.toFixed(2)),
      totalDiscount: parseFloat((totalDiscount + billDiscountAmt).toFixed(2)),
      totalGst: parseFloat(totalGst.toFixed(2)),
      totalAmount: parseFloat(grandTotal.toFixed(2)),
      paymentStatus: "paid",
      status: "completed",
    };

    const res = await mutation("orders/pos", {
      method: "POST",
      body,
      isAlert: true,
    });

    if (res?.results?.success) {
      const createdOrder = res.results.data as InvoiceData;
      setInvoiceOrder(createdOrder);
      setCart([]);
      setBillDiscount(0);
      setCustomerName("");
      setCustomerPhone("");
    }
  };

  const handlePrint = () => {
    if (!printRef.current) return;
    const printContents = printRef.current.innerHTML;
    const win = window.open("", "_blank", "width=400,height=700");
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html><html><head>
      <title>Invoice</title>
      <style>
        body { margin: 0; padding: 0; background: #fff; }
        * { box-sizing: border-box; }
      </style>
      </head><body>${printContents}</body></html>
    `);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  return (
    <>
      {showScanner && (
        <BarcodeScannerModal
          onScan={(code) => {
            setShowScanner(false);
            handleScanResult(code);
          }}
          onClose={() => setShowScanner(false)}
        />
      )}

      <div className="flex h-[calc(100dvh-4rem)] flex-col gap-4 lg:flex-row">
        {/* ── Left Panel — Items ── */}
        <div className="flex flex-1 flex-col gap-3 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-accent-900 text-xl font-bold">POS Billing</h1>
              <p className="text-accent-400 text-xs">
                {cart.length === 0
                  ? "No items"
                  : `${cart.length} item${cart.length > 1 ? "s" : ""} · ₹${grandTotal.toFixed(2)}`}
              </p>
            </div>
            {cart.length > 0 && (
              <button
                onClick={() => {
                  setCart([]);
                  setBillDiscount(0);
                }}
                className="text-error-400 hover:text-error-600 hover:bg-error-50 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Search + Scan */}
          <div className="relative">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search
                  size={15}
                  className="text-accent-400 absolute top-1/2 left-3 -translate-y-1/2"
                />
                {isSearching && (
                  <div className="border-primary-500 absolute top-1/2 right-3 h-3.5 w-3.5 -translate-y-1/2 animate-spin rounded-full border-2 border-t-transparent" />
                )}
                <input
                  type="text"
                  placeholder="Search by name or SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="border-accent-300 focus:border-primary-500 focus:ring-primary-100 w-full rounded-xl border bg-white py-2.5 pr-8 pl-9 text-sm outline-none focus:ring-2"
                />
              </div>
              <button
                type="button"
                title="Scan barcode — auto-adds to bill"
                disabled={scanSearching}
                onClick={() => setShowScanner(true)}
                className="bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 flex items-center gap-2 rounded-xl px-4 text-sm font-medium text-white shadow-sm transition-colors"
              >
                {scanSearching ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <ScanBarcode size={17} />
                )}
                <span className="hidden sm:inline">
                  {scanSearching ? "Searching..." : "Scan"}
                </span>
              </button>
            </div>

            {/* Dropdown */}
            {searchResults.length > 0 && searchQuery.trim() && (
              <div className="border-accent-200 absolute top-full right-0 left-0 z-20 mt-1.5 max-h-72 overflow-y-auto rounded-xl border bg-white shadow-xl">
                {searchResults.map((med) => (
                  <div
                    key={med._id}
                    className="border-accent-100 border-b last:border-none"
                  >
                    <div className="bg-accent-50 flex items-center gap-2 px-4 py-2">
                      <span className="text-accent-700 text-xs font-semibold">
                        {med.name}
                      </span>
                      <span className="text-accent-400 text-xs">·</span>
                      <span className="text-accent-400 font-mono text-xs">
                        {med.sku}
                      </span>
                    </div>
                    {med.batches
                      .filter((b) => b.quantity > 0)
                      .map((batch) => {
                        const isExpired =
                          new Date(batch.expiryDate) < new Date();
                        const isNearExpiry =
                          !isExpired &&
                          new Date(batch.expiryDate) <= THIRTY_DAYS_FROM_NOW;
                        return (
                          <button
                            key={batch.batchNumber}
                            disabled={isExpired}
                            onClick={() => addToCart(med, batch)}
                            className={`flex w-full items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                              isExpired
                                ? "bg-error-50/50 cursor-not-allowed"
                                : isNearExpiry
                                  ? "hover:bg-warning-50"
                                  : "hover:bg-primary-50"
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              {isExpired && (
                                <AlertTriangle
                                  size={13}
                                  className="text-error-500"
                                />
                              )}
                              {isNearExpiry && (
                                <AlertTriangle
                                  size={13}
                                  className="text-warning-500"
                                />
                              )}
                              <span
                                className={`font-mono text-xs ${isExpired ? "text-error-500 line-through" : "text-accent-600"}`}
                              >
                                {batch.batchNumber}
                              </span>
                              <span
                                className={`text-xs ${isExpired ? "text-error-400" : "text-accent-400"}`}
                              >
                                Exp:{" "}
                                {new Date(batch.expiryDate).toLocaleDateString(
                                  "en-IN"
                                )}
                              </span>
                              {isExpired && (
                                <span className="bg-error-100 text-error-600 rounded px-1.5 py-0.5 text-xs font-medium">
                                  EXPIRED
                                </span>
                              )}
                              {isNearExpiry && (
                                <span className="bg-warning-100 text-warning-700 rounded px-1.5 py-0.5 text-xs font-medium">
                                  Near Expiry
                                </span>
                              )}
                            </span>
                            <span className="flex items-center gap-3">
                              <span className="text-accent-400 text-xs">
                                Stock: {batch.quantity}
                              </span>
                              <span className="text-primary-600 font-semibold">
                                ₹{batch.sellingPrice}
                              </span>
                              {!isExpired && (
                                <ChevronRight
                                  size={14}
                                  className="text-accent-300"
                                />
                              )}
                            </span>
                          </button>
                        );
                      })}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart */}
          <div className="border-accent-200 flex-1 overflow-y-auto rounded-xl border bg-white shadow-sm">
            {cart.length === 0 ? (
              <div className="text-accent-300 flex h-full flex-col items-center justify-center gap-3 py-16">
                <div className="bg-accent-50 rounded-2xl p-5">
                  <ShoppingCart size={36} strokeWidth={1.2} />
                </div>
                <div className="text-center">
                  <p className="text-accent-500 text-sm font-medium">
                    Cart is empty
                  </p>
                  <p className="text-accent-400 mt-0.5 text-xs">
                    Search a medicine or scan a barcode
                  </p>
                </div>
              </div>
            ) : (
              <div>
                {/* Column headers */}
                <div className="border-accent-100 text-accent-400 hidden grid-cols-[2fr_80px_100px_64px_64px_80px_32px] gap-2 border-b px-4 py-2 text-xs font-semibold sm:grid">
                  <span>Medicine</span>
                  <span>Price</span>
                  <span className="text-center">Qty</span>
                  <span>Disc%</span>
                  <span>GST%</span>
                  <span className="text-right">Total</span>
                  <span />
                </div>
                {cart.map((item, idx) => {
                  const key = `${item.medicine._id}-${item.batch.batchNumber}`;
                  const isNearExpiry =
                    new Date(item.batch.expiryDate) <= THIRTY_DAYS_FROM_NOW;
                  const isJustAdded = justAddedKey === key;
                  return (
                    <div
                      key={key}
                      className={`border-accent-100 grid grid-cols-1 gap-y-2 border-b px-4 py-3 transition-colors last:border-none sm:grid-cols-[2fr_80px_100px_64px_64px_80px_32px] sm:items-center sm:gap-2 ${
                        isJustAdded
                          ? "bg-primary-50"
                          : isNearExpiry
                            ? "bg-warning-50/40"
                            : "hover:bg-accent-50/50"
                      }`}
                    >
                      {/* Name + batch */}
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-accent-800 text-sm leading-tight font-medium">
                            {item.medicine.name}
                          </p>
                          {isJustAdded && (
                            <span className="bg-primary-100 text-primary-700 rounded-full px-2 py-0.5 text-xs font-medium">
                              Added
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 flex items-center gap-2">
                          <span className="bg-accent-100 text-accent-500 rounded px-1.5 py-0.5 font-mono text-xs">
                            {item.batch.batchNumber}
                          </span>
                          {isNearExpiry && (
                            <span className="text-warning-600 flex items-center gap-0.5 text-xs">
                              <AlertTriangle size={11} /> Near expiry
                            </span>
                          )}
                        </div>
                      </div>
                      {/* Unit price */}
                      <p className="text-accent-600 text-sm">
                        ₹{item.unitPrice}
                      </p>
                      {/* Qty stepper */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateQty(idx, -1)}
                          className="border-accent-200 hover:bg-accent-100 flex h-7 w-7 items-center justify-center rounded-lg border text-sm transition-colors"
                        >
                          <Minus size={13} />
                        </button>
                        <span className="w-8 text-center text-sm font-semibold">
                          {item.qty}
                        </span>
                        <button
                          onClick={() => updateQty(idx, 1)}
                          className="border-accent-200 hover:bg-accent-100 flex h-7 w-7 items-center justify-center rounded-lg border text-sm transition-colors"
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                      {/* Discount */}
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={item.discount}
                        onChange={(e) =>
                          updateDiscount(idx, Number(e.target.value))
                        }
                        className="border-accent-300 focus:border-primary-400 w-16 rounded-lg border px-2 py-1 text-center text-sm outline-none"
                      />
                      {/* GST */}
                      <span className="text-accent-500 text-sm">
                        {item.gst}%
                      </span>
                      {/* Total */}
                      <p className="text-primary-600 text-right text-sm font-bold">
                        ₹{item.total.toFixed(2)}
                      </p>
                      {/* Remove */}
                      <button
                        onClick={() => removeFromCart(idx)}
                        className="text-accent-300 hover:text-error-500 hover:bg-error-50 flex items-center justify-center rounded p-1 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Right Panel — Summary ── */}
        <div className="flex w-full flex-col gap-3 lg:w-[300px] lg:shrink-0">
          {/* Customer */}
          <div className="border-accent-200 rounded-xl border bg-white p-4 shadow-sm">
            <p className="text-accent-500 mb-2.5 text-xs font-semibold tracking-wider uppercase">
              Customer
            </p>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Name (optional)"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="border-accent-200 focus:border-primary-400 w-full rounded-lg border px-3 py-2 text-sm outline-none"
              />
              <input
                type="tel"
                placeholder="Phone (optional)"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="border-accent-200 focus:border-primary-400 w-full rounded-lg border px-3 py-2 text-sm outline-none"
              />
            </div>
          </div>

          {/* Summary */}
          <div className="border-accent-200 flex-1 rounded-xl border bg-white p-4 shadow-sm">
            <p className="text-accent-500 mb-3 text-xs font-semibold tracking-wider uppercase">
              Summary
            </p>
            <div className="space-y-2 text-sm">
              <div className="text-accent-600 flex justify-between">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="text-accent-600 flex justify-between">
                <span>GST</span>
                <span>₹{totalGst.toFixed(2)}</span>
              </div>
              {totalDiscount > 0 && (
                <div className="text-primary-600 flex justify-between">
                  <span>Item discounts</span>
                  <span>−₹{totalDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex items-center justify-between pt-1">
                <span className="text-accent-600">Bill discount %</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={billDiscount}
                  onChange={(e) =>
                    setBillDiscount(
                      Math.min(100, Math.max(0, Number(e.target.value)))
                    )
                  }
                  className="border-accent-300 focus:border-primary-400 w-16 rounded-lg border px-2 py-1 text-center text-sm outline-none"
                />
              </div>
              {billDiscountAmt > 0 && (
                <div className="text-primary-600 flex justify-between">
                  <span>Bill discount</span>
                  <span>−₹{billDiscountAmt.toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* Grand Total */}
            <div className="bg-primary-600 mt-4 flex items-center justify-between rounded-xl px-4 py-3 text-white">
              <span className="text-sm font-medium opacity-90">
                Grand Total
              </span>
              <span className="text-xl font-bold">
                ₹{grandTotal.toFixed(2)}
              </span>
            </div>

            {/* Payment method */}
            <div className="mt-4">
              <p className="text-accent-400 mb-2 text-xs font-semibold tracking-wider uppercase">
                Payment method
              </p>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    {
                      key: "cash",
                      label: "Cash",
                      icon: <Banknote size={16} />,
                    },
                    {
                      key: "card",
                      label: "Card",
                      icon: <CreditCard size={16} />,
                    },
                    {
                      key: "upi",
                      label: "UPI",
                      icon: <Smartphone size={16} />,
                    },
                  ] as const
                ).map(({ key, label, icon }) => (
                  <button
                    key={key}
                    onClick={() => setPaymentMethod(key)}
                    className={`flex flex-col items-center gap-1 rounded-xl border py-2.5 text-xs font-medium transition-all ${
                      paymentMethod === key
                        ? "border-primary-500 bg-primary-50 text-primary-700 shadow-sm"
                        : "border-accent-200 text-accent-500 hover:border-primary-300 hover:text-primary-600"
                    }`}
                  >
                    {icon}
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-4 space-y-2">
              <CustomButton
                variant="primary"
                size="medium"
                loading={isLoading}
                loadingText="Generating..."
                onClick={handleBill}
                startIcon={<ReceiptText size={16} />}
              >
                Generate Bill
              </CustomButton>
              <CustomButton
                variant="secondary"
                size="medium"
                startIcon={<Printer size={15} />}
                disabled={!invoiceOrder}
                onClick={() => invoiceOrder && handlePrint()}
              >
                Print Last Bill
              </CustomButton>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Modal */}
      {invoiceOrder && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-10">
          <div className="border-accent-200 w-full max-w-sm rounded-2xl border bg-white shadow-2xl">
            <div className="border-accent-100 flex items-center justify-between border-b px-5 py-3">
              <p className="text-accent-900 font-semibold">Invoice Preview</p>
              <div className="flex items-center gap-2">
                <CustomButton
                  variant="primary"
                  size="small"
                  fullWidth={false}
                  onClick={handlePrint}
                  startIcon={<Printer size={14} />}
                >
                  Print
                </CustomButton>
                <button
                  type="button"
                  onClick={() => setInvoiceOrder(null)}
                  className="text-accent-400 hover:text-accent-700 rounded p-1"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            <div ref={printRef} className="p-2">
              <InvoiceTemplate order={invoiceOrder} settings={settings} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default POSPage;
