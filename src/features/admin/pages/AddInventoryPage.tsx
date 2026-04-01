"use client";

import { useEffect, useRef, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import { Package, CheckCircle, ScanBarcode, X, CameraOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { DecodeHintType, BarcodeFormat } from "@zxing/library";
import useSwr from "@/shared/hooks/useSwr";
import useMutation from "@/shared/hooks/useMutation";
import CustomButton from "@/shared/common/CustomButton";
import { batchSchema } from "@/features/admin/schema/medicineSchema";

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

interface Medicine {
  _id: string;
  name: string;
  sku: string;
  unit: string;
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
        {/* Header */}
        <div className="border-accent-100 flex items-center justify-between border-b px-5 py-4">
          <p className="text-accent-800 font-semibold">Scan Batch Barcode</p>
          <button
            type="button"
            onClick={handleClose}
            className="text-accent-400 hover:text-accent-700 rounded p-1"
          >
            <X size={18} />
          </button>
        </div>

        {/* Camera */}
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
              {/* Scan guide overlay */}
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

const initialValues = {
  medicineId: "",
  batchNumber: "",
  expiryDate: "",
  purchasePrice: "",
  sellingPrice: "",
  gst: "",
  quantity: "",
};

const AddInventoryPage = () => {
  const router = useRouter();
  const [success, setSuccess] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [scannerSetField, setScannerSetField] = useState<
    ((field: string, value: string) => void) | null
  >(null);
  const { data } = useSwr("medicines?limit=100");
  const { mutation, isLoading } = useMutation();

  const medicines: Medicine[] = data?.data?.medicines ?? [];

  const handleSubmit = async (
    values: typeof initialValues,
    { resetForm }: { resetForm: () => void }
  ) => {
    const body = {
      medicineId: values.medicineId,
      batchNumber: values.batchNumber,
      expiryDate: values.expiryDate,
      purchasePrice: Number(values.purchasePrice),
      sellingPrice: Number(values.sellingPrice),
      gst: Number(values.gst),
      quantity: Number(values.quantity),
    };

    const res = await mutation("inventory", {
      method: "POST",
      body,
      isAlert: true,
    });

    if (res?.results?.success) {
      setSuccess(true);
      resetForm();
      setTimeout(() => setSuccess(false), 3000);
    }
  };

  return (
    <div className="space-y-5">
      {showScanner && scannerSetField && (
        <BarcodeScannerModal
          onScan={(code) => {
            scannerSetField("batchNumber", code);
            setShowScanner(false);
            setScannerSetField(null);
          }}
          onClose={() => {
            setShowScanner(false);
            setScannerSetField(null);
          }}
        />
      )}
      <div>
        <h1 className="text-accent-900 text-2xl font-bold">Add Inventory</h1>
        <p className="text-accent-500 mt-0.5 text-sm">
          Add a new batch / restock existing medicine
        </p>
      </div>

      {success && (
        <div className="border-primary-200 bg-primary-50 flex items-center gap-3 rounded-xl border px-5 py-4">
          <CheckCircle size={20} className="text-primary-600" />
          <p className="text-primary-700 text-sm font-medium">
            Batch added successfully! Stock has been updated.
          </p>
        </div>
      )}

      <div className="border-accent-200 rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="text-accent-800 mb-5 flex items-center gap-2 text-base font-semibold">
          <Package size={18} className="text-primary-500" />
          Batch Details
        </h2>

        <Formik
          initialValues={initialValues}
          validationSchema={batchSchema}
          onSubmit={handleSubmit}
        >
          {({ values, setFieldValue }) => (
            <Form className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {/* Medicine Select */}
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="text-accent-700 mb-1.5 block text-sm font-medium">
                  Select Medicine
                </label>
                <Field
                  as="select"
                  name="medicineId"
                  className="border-accent-300 focus:border-primary-500 focus:ring-primary-100 w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none focus:ring-2"
                >
                  <option value="">-- Select a medicine --</option>
                  {medicines.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.name} ({m.sku}) — per {m.unit}
                    </option>
                  ))}
                </Field>
                <ErrorMessage
                  name="medicineId"
                  component="p"
                  className="text-error-500 mt-1 text-xs"
                />
              </div>

              {/* Batch Number */}
              <div>
                <label className="text-accent-700 mb-1.5 block text-sm font-medium">
                  Batch Number
                </label>
                <div className="flex gap-2">
                  <Field
                    name="batchNumber"
                    type="text"
                    placeholder="e.g. BATCH-2024-001"
                    className="border-accent-300 focus:border-primary-500 focus:ring-primary-100 w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none focus:ring-2"
                  />
                  <button
                    type="button"
                    title="Scan barcode with camera"
                    onClick={() => {
                      setScannerSetField(() => setFieldValue);
                      setShowScanner(true);
                    }}
                    className="border-accent-300 bg-accent-50 hover:bg-primary-50 hover:border-primary-400 hover:text-primary-600 text-accent-500 flex shrink-0 items-center justify-center rounded-lg border px-3 transition-colors"
                  >
                    <ScanBarcode size={18} />
                  </button>
                </div>
                <ErrorMessage
                  name="batchNumber"
                  component="p"
                  className="text-error-500 mt-1 text-xs"
                />
              </div>

              {/* Expiry Date */}
              <div>
                <label className="text-accent-700 mb-1.5 block text-sm font-medium">
                  Expiry Date
                </label>
                <Field
                  name="expiryDate"
                  type="date"
                  className="border-accent-300 focus:border-primary-500 focus:ring-primary-100 w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none focus:ring-2"
                />
                <ErrorMessage
                  name="expiryDate"
                  component="p"
                  className="text-error-500 mt-1 text-xs"
                />
              </div>

              {/* Quantity */}
              <div>
                <label className="text-accent-700 mb-1.5 block text-sm font-medium">
                  Quantity
                </label>
                <Field
                  name="quantity"
                  type="number"
                  min={1}
                  placeholder="0"
                  className="border-accent-300 focus:border-primary-500 focus:ring-primary-100 w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none focus:ring-2"
                />
                <ErrorMessage
                  name="quantity"
                  component="p"
                  className="text-error-500 mt-1 text-xs"
                />
              </div>

              {/* Purchase Price */}
              <div>
                <label className="text-accent-700 mb-1.5 block text-sm font-medium">
                  Purchase Price (₹)
                </label>
                <Field
                  name="purchasePrice"
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="0.00"
                  className="border-accent-300 focus:border-primary-500 focus:ring-primary-100 w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none focus:ring-2"
                />
                <ErrorMessage
                  name="purchasePrice"
                  component="p"
                  className="text-error-500 mt-1 text-xs"
                />
              </div>

              {/* Selling Price */}
              <div>
                <label className="text-accent-700 mb-1.5 block text-sm font-medium">
                  Selling Price / MRP (₹)
                </label>
                <Field
                  name="sellingPrice"
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="0.00"
                  className="border-accent-300 focus:border-primary-500 focus:ring-primary-100 w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none focus:ring-2"
                />
                <ErrorMessage
                  name="sellingPrice"
                  component="p"
                  className="text-error-500 mt-1 text-xs"
                />
              </div>

              {/* GST */}
              <div>
                <label className="text-accent-700 mb-1.5 block text-sm font-medium">
                  GST %
                </label>
                <Field
                  as="select"
                  name="gst"
                  className="border-accent-300 focus:border-primary-500 focus:ring-primary-100 w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none focus:ring-2"
                >
                  <option value="">Select GST</option>
                  {[0, 5, 12, 18, 28].map((g) => (
                    <option key={g} value={g}>
                      {g}%
                    </option>
                  ))}
                </Field>
                <ErrorMessage
                  name="gst"
                  component="p"
                  className="text-error-500 mt-1 text-xs"
                />
              </div>

              {/* Price Summary */}
              {values.sellingPrice && values.gst !== "" && (
                <div className="bg-primary-50 rounded-lg p-4 text-sm sm:col-span-2 lg:col-span-2">
                  <p className="text-primary-800 font-medium">Price Summary</p>
                  <div className="text-primary-700 mt-2 grid grid-cols-2 gap-1">
                    <span>Base Price:</span>
                    <span>
                      ₹
                      {(
                        Number(values.sellingPrice) /
                        (1 + Number(values.gst) / 100)
                      ).toFixed(2)}
                    </span>
                    <span>GST ({values.gst}%):</span>
                    <span>
                      ₹
                      {(
                        Number(values.sellingPrice) -
                        Number(values.sellingPrice) /
                          (1 + Number(values.gst) / 100)
                      ).toFixed(2)}
                    </span>
                    <span className="font-semibold">MRP:</span>
                    <span className="font-semibold">
                      ₹{Number(values.sellingPrice).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 sm:col-span-2 lg:col-span-3">
                <CustomButton
                  type="submit"
                  variant="primary"
                  size="small"
                  fullWidth={false}
                  loading={isLoading}
                  loadingText="Adding batch..."
                >
                  Add Batch
                </CustomButton>
                <CustomButton
                  variant="cancel"
                  size="small"
                  fullWidth={false}
                  onClick={() => router.push("/admin/inventory")}
                >
                  Cancel
                </CustomButton>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default AddInventoryPage;
