"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Formik, Form, Field, ErrorMessage, useFormikContext } from "formik";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Pill,
  ImageIcon,
  CheckCircle2,
  ScanBarcode,
  X,
  CameraOff,
  Wand2,
  Loader2,
} from "lucide-react";
import { toast } from "react-toastify";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { DecodeHintType, BarcodeFormat } from "@zxing/library";
import useSwr from "@/shared/hooks/useSwr";
import useMutation from "@/shared/hooks/useMutation";
import CustomButton from "@/shared/common/CustomButton";
import CustomTable from "@/shared/common/CustomTable";
import { medicineSchema } from "@/features/admin/schema/medicineSchema";

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
    // Defer by one tick — StrictMode cleanup fires synchronously and cancels
    // the timer before it ever fires, so camera only opens on the real mount.
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
          <p className="text-accent-800 font-semibold">Scan Batch Barcode</p>
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

interface Medicine {
  id?: string;
  _id: string;
  name: string;
  genericName?: string;
  category: string;
  manufacturer: string;
  sku: string;
  unit: string;
  quantity: number;
  requiresPrescription: boolean;
  isActive: boolean;
  photo?: string;
  [key: string]: unknown;
}

type ImagePickerStatus =
  | "idle"
  | "fetching"
  | "found"
  | "not-found"
  | "uploading"
  | "ready";

const initialValues = {
  name: "",
  genericName: "",
  category: "",
  manufacturer: "",
  sku: "",
  unit: "strip",
  requiresPrescription: false,
  description: "",
  lowStockThreshold: 10,
  // First batch
  batchNumber: "",
  expiryDate: "",
  purchasePrice: "",
  sellingPrice: "",
  gst: "12",
  quantity: "",
};

function MedicineImagePicker({
  onImageReady,
  resetKey,
}: {
  onImageReady: (url: string) => void;
  resetKey: number;
}) {
  const { values, setFieldValue } = useFormikContext<typeof initialValues>();
  const [status, setStatus] = useState<ImagePickerStatus>("idle");
  const [preview, setPreview] = useState("");
  const [pendingBlob, setPendingBlob] = useState<Blob | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const lastQueried = useRef("");
  const { mutation } = useMutation();

  // Reset when form is toggled (resetKey changes)
  useEffect(() => {
    setStatus("idle");
    setPreview("");
    setPendingBlob(null);
    lastQueried.current = "";
    onImageReady("");
  }, [resetKey, onImageReady]);

  // Listen for dropdown selection — update lastQueried so the name-watch effect
  // considers the selected name already queried and skips a redundant re-fetch
  useEffect(() => {
    const handler = (e: Event) => {
      const selected = (e as CustomEvent<string>).detail;
      if (selected) lastQueried.current = selected.trim();
    };
    document.addEventListener("__medicineNameSelected", handler);
    return () =>
      document.removeEventListener("__medicineNameSelected", handler);
  }, []);

  useEffect(() => {
    const name = values.name.trim();
    if (name.length < 3) {
      if (status !== "idle") {
        setStatus("idle");
        setPreview("");
        setPendingBlob(null);
        onImageReady("");
      }
      return;
    }
    if (name === lastQueried.current) return;

    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      lastQueried.current = name;
      setStatus("fetching");
      setPreview("");
      setPendingBlob(null);
      onImageReady("");
      try {
        // 1. Get suggestions — carries generic name (subtitle) + image info
        const sugRes = await fetch(
          `/api/medicines/fetch-image?medicineName=${encodeURIComponent(name)}&action=suggestions`
        );
        if (sugRes.ok) {
          const sugJson = await sugRes.json();
          const first = sugJson?.data?.[0];
          // Autofill generic name if field is empty
          if (first?.subtitle && !values.genericName.trim()) {
            setFieldValue("genericName", first.subtitle);
          }
        }

        // 2. Fetch the image buffer
        const imgRes = await fetch(
          `/api/medicines/fetch-image?medicineName=${encodeURIComponent(name)}&action=image`
        );
        if (!imgRes.ok) {
          setStatus("not-found");
          return;
        }
        const imgBlob = await imgRes.blob();
        setPendingBlob(imgBlob);
        setPreview(URL.createObjectURL(imgBlob));
        setStatus("found");
      } catch {
        setStatus("not-found");
      }
    }, 800);

    return () => clearTimeout(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.name, onImageReady, status]);

  const uploadToCloud = async (fileToUpload: Blob, fileName: string) => {
    setStatus("uploading");
    const fd = new FormData();
    fd.append(
      "file",
      new File([fileToUpload], fileName, {
        type: fileToUpload.type || "image/jpeg",
      })
    );
    try {
      const res = await mutation("upload", {
        method: "POST",
        body: fd,
        isFormData: true,
      });
      const url = res?.results?.url as string | undefined;
      if (!url) throw new Error("Upload failed");
      onImageReady(url);
      setStatus("ready");
    } catch {
      toast.error("Image upload failed. Try again.");
      setStatus(pendingBlob ? "found" : "idle");
    }
  };

  const handleUseAutoImage = () => {
    if (!pendingBlob) return;
    const safeName = values.name.replace(/\s+/g, "_").toLowerCase();
    uploadToCloud(pendingBlob, `${safeName}.jpg`);
  };

  const handleManualUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    await uploadToCloud(file, file.name);
    e.target.value = "";
  };

  return (
    <div className="sm:col-span-2 lg:col-span-3">
      <label className="text-accent-700 mb-2 block text-sm font-medium">
        Medicine Image
      </label>
      <div className="border-accent-200 flex items-start gap-4 rounded-xl border bg-white p-4">
        {/* Preview thumbnail */}
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="medicine preview"
            className="border-accent-100 bg-accent-50 h-20 w-20 shrink-0 rounded-lg border object-contain"
          />
        ) : (
          <div className="border-accent-300 bg-accent-50 flex h-20 w-20 shrink-0 items-center justify-center rounded-lg border border-dashed">
            <ImageIcon size={24} className="text-accent-300" />
          </div>
        )}

        <div className="flex-1 space-y-2">
          {status === "idle" && (
            <>
              <p className="text-accent-400 text-sm">
                {values.name.trim().length < 3
                  ? "Type the medicine name to auto-search an image, or upload manually."
                  : "Searching..."}
              </p>
              <CustomButton
                variant="secondary"
                size="small"
                fullWidth={false}
                onClick={() => fileInputRef.current?.click()}
              >
                Select image file
              </CustomButton>
            </>
          )}

          {status === "fetching" && (
            <div className="text-accent-500 flex items-center gap-2 text-sm">
              <span className="border-primary-400 inline-block h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
              Searching image for &ldquo;{values.name}&rdquo;...
            </div>
          )}

          {status === "found" && (
            <>
              <p className="text-primary-600 flex items-center gap-1.5 text-sm font-medium">
                <CheckCircle2 size={14} />
                Auto-detected from PharmEasy
              </p>
              <div className="flex flex-wrap gap-2">
                <CustomButton
                  variant="primary"
                  size="small"
                  fullWidth={false}
                  onClick={handleUseAutoImage}
                >
                  Use this image
                </CustomButton>
                <CustomButton
                  variant="secondary"
                  size="small"
                  fullWidth={false}
                  onClick={() => fileInputRef.current?.click()}
                >
                  Upload different
                </CustomButton>
              </div>
            </>
          )}

          {status === "not-found" && (
            <>
              <p className="text-accent-500 text-sm">
                No image found automatically.
              </p>
              <CustomButton
                variant="secondary"
                size="small"
                fullWidth={false}
                onClick={() => fileInputRef.current?.click()}
              >
                Upload manually
              </CustomButton>
            </>
          )}

          {status === "uploading" && (
            <div className="text-accent-500 flex items-center gap-2 text-sm">
              <span className="border-primary-400 inline-block h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
              Uploading to cloud...
            </div>
          )}

          {status === "ready" && (
            <p className="text-primary-600 flex items-center gap-1.5 text-sm font-medium">
              <CheckCircle2 size={14} />
              Image ready
              <button
                type="button"
                className="text-accent-400 hover:text-accent-600 ml-2 text-xs underline"
                onClick={() => fileInputRef.current?.click()}
              >
                Change
              </button>
            </p>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleManualUpload}
        />
      </div>
    </div>
  );
}

// Autocomplete dropdown for medicine name — fetches suggestions from PharmEasy
function MedicineNameAutocomplete() {
  const { values, setFieldValue } = useFormikContext<typeof initialValues>();
  const [suggestions, setSuggestions] = useState<
    { name: string; subtitle: string }[]
  >([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const justSelectedRef = useRef(""); // tracks name set by selection to skip re-fetch
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const name = values.name.trim();

    // Name was set by clicking a suggestion — skip fetch, clear the lock
    if (justSelectedRef.current && name === justSelectedRef.current) {
      justSelectedRef.current = "";
      return;
    }

    if (name.length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/medicines/fetch-image?medicineName=${encodeURIComponent(name)}&action=suggestions`
        );
        if (res.ok) {
          const json = await res.json();
          const list = (json?.data ?? []) as {
            name: string;
            subtitle: string;
          }[];
          setSuggestions(list.slice(0, 8));
          setOpen(list.length > 0);
        }
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => clearTimeout(timerRef.current);
  }, [values.name]);

  const select = (s: { name: string; subtitle: string }) => {
    // Lock: prevent dropdown re-fetch and image re-fetch for this name
    justSelectedRef.current = s.name;
    document.dispatchEvent(
      new CustomEvent("__medicineNameSelected", { detail: s.name })
    );
    setFieldValue("name", s.name);
    if (s.subtitle && !values.genericName.trim())
      setFieldValue("genericName", s.subtitle);
    // Auto-select category and unit only if currently empty
    const { category, unit } = inferCategoryAndUnit(s.name, s.subtitle ?? "");
    if (category && !values.category) setFieldValue("category", category);
    if (unit && values.unit === "strip") setFieldValue("unit", unit);
    setOpen(false);
    setSuggestions([]);
  };

  return (
    <div ref={wrapRef} className="relative sm:col-span-2 lg:col-span-1">
      <label className="text-accent-700 mb-1.5 block text-sm font-medium">
        Medicine Name
      </label>
      <div className="relative">
        <Field
          name="name"
          type="text"
          placeholder="Start typing medicine name…"
          autoComplete="off"
          className="border-accent-300 focus:border-primary-500 focus:ring-primary-100 w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none focus:ring-2"
        />
        {loading && (
          <Loader2
            size={14}
            className="text-accent-400 absolute top-1/2 right-3 -translate-y-1/2 animate-spin"
          />
        )}
      </div>
      <ErrorMessage
        name="name"
        component="p"
        className="text-error-500 mt-1 text-xs"
      />
      {open && suggestions.length > 0 && (
        <ul className="border-accent-200 absolute top-full left-0 z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border bg-white shadow-lg">
          {suggestions.map((s, i) => (
            <li key={i}>
              <button
                type="button"
                onMouseDown={() => select(s)}
                className="hover:bg-primary-50 flex w-full flex-col px-4 py-2.5 text-left"
              >
                <span className="text-accent-800 text-sm font-medium">
                  {s.name}
                </span>
                {s.subtitle && (
                  <span className="text-accent-400 text-xs">{s.subtitle}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// AI description generator using pollinations.ai chat completions (free, no API key)
function AiDescriptionButton() {
  const { values, setFieldValue } = useFormikContext<typeof initialValues>();
  const [generating, setGenerating] = useState(false);

  const generate = async () => {
    const name = values.name.trim();
    if (!name) {
      toast.warn("Enter the medicine name first.");
      return;
    }
    setGenerating(true);
    try {
      const prompt = `Write a concise 2-3 sentence pharmacy description for the medicine "${name}"${values.genericName ? ` (generic: ${values.genericName})` : ""}. Include what it is used for and key information. Plain text only, no headings, no warnings.`;
      const res = await fetch("https://text.pollinations.ai/openai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "openai",
          messages: [{ role: "user", content: prompt }],
        }),
      });
      if (!res.ok) throw new Error("AI request failed");
      const json = await res.json();
      const text = (json?.choices?.[0]?.message?.content ?? "").trim();
      if (!text) throw new Error("Empty response");
      setFieldValue("description", text);
    } catch {
      toast.error("AI generation failed. Try again or write manually.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <button
      type="button"
      onClick={generate}
      disabled={generating}
      title="Generate description with AI"
      className="bg-secondary-50 hover:bg-secondary-100 text-secondary-600 flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors disabled:opacity-60"
    >
      {generating ? (
        <Loader2 size={13} className="animate-spin" />
      ) : (
        <Wand2 size={13} />
      )}
      {generating ? "Generating…" : "AI Generate"}
    </button>
  );
}

// Auto-generates SKU from medicine name whenever name changes (only when SKU is empty or auto-generated)
function SkuAutoFill({ isEdit }: { isEdit: boolean }) {
  const { values, setFieldValue } = useFormikContext<typeof initialValues>();
  const prevNameRef = useRef("");

  useEffect(() => {
    if (isEdit) return;
    const name = values.name.trim();
    if (!name) return;
    // Only auto-fill if SKU is empty or was previously auto-generated from old name
    const prevAuto = prevNameRef.current
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 20);
    if (values.sku === "" || values.sku === prevAuto) {
      const generated = name
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 20);
      setFieldValue("sku", generated);
    }
    prevNameRef.current = name;
  }, [values.name, values.sku, isEdit, setFieldValue]);

  return null;
}

// Infer category and unit from medicine name / generic name keywords
function inferCategoryAndUnit(
  name: string,
  subtitle: string
): { category: string; unit: string } {
  const text = `${name} ${subtitle}`.toLowerCase();
  if (/\binhaler\b|rotacap|respule|turbuhaler|breezhaler|accuhaler/.test(text))
    return { category: "Inhaler", unit: "box" };
  if (/suppository|suppos/.test(text))
    return { category: "Suppository", unit: "box" };
  if (
    /\binjection\b|\binj\b|\.i\.v\.|i\.m\.|\bvial\b|ampoule|\binfusion\b/.test(
      text
    )
  )
    return { category: "Injection", unit: "vial" };
  if (/eye drop|ear drop|nasal drop|ophthalmic|otic|\bdrops\b/.test(text))
    return { category: "Drops", unit: "bottle" };
  if (/\bcream\b|\bointment\b|\bgel\b|\blotion\b|topical/.test(text))
    return { category: "Cream/Ointment", unit: "tube" };
  if (
    /\bsyrup\b|suspension|oral solution|\belixir\b|linctus|\bliquid\b/.test(
      text
    )
  )
    return { category: "Syrup", unit: "bottle" };
  if (/\bpowder\b|\bsachet\b/.test(text))
    return { category: "Powder", unit: "sachet" };
  if (/\bcapsule\b|\bcap\b/.test(text))
    return { category: "Capsule", unit: "strip" };
  if (/\btablet\b|\btab\b/.test(text))
    return { category: "Tablet", unit: "strip" };
  return { category: "", unit: "strip" };
}

// Listens for barcode scan events and sets batchNumber field
function BatchNumberListener() {
  const { setFieldValue } = useFormikContext<typeof initialValues>();
  useEffect(() => {
    const handler = (e: Event) => {
      const code = (e as CustomEvent<string>).detail;
      setFieldValue("batchNumber", code);
    };
    document.addEventListener("__setBatchNumber", handler);
    return () => document.removeEventListener("__setBatchNumber", handler);
  }, [setFieldValue]);
  return null;
}

const CATEGORIES = [
  "Tablet",
  "Capsule",
  "Syrup",
  "Injection",
  "Cream/Ointment",
  "Drops",
  "Powder",
  "Inhaler",
  "Suppository",
  "Other",
];

const UNITS = ["strip", "bottle", "tube", "vial", "sachet", "box", "piece"];

const MedicinesPage = () => {
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editMedicine, setEditMedicine] = useState<Medicine | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [formResetKey, setFormResetKey] = useState(0);
  const [showScanner, setShowScanner] = useState(false);
  const [scanCallback, setScanCallback] = useState<
    ((v: string) => void) | null
  >(null);

  const { data, isLoading, mutate } = useSwr(
    `medicines?search=${encodeURIComponent(search)}`
  );
  const { mutation, isLoading: isSaving } = useMutation();

  const medicines: Medicine[] = data?.data?.medicines ?? [];

  const handleSubmit = async (
    values: typeof initialValues,
    { resetForm }: { resetForm: () => void }
  ) => {
    const medicineFields = {
      name: values.name,
      genericName: values.genericName,
      category: values.category,
      manufacturer: values.manufacturer,
      sku: values.sku,
      unit: values.unit,
      requiresPrescription: values.requiresPrescription,
      description: values.description,
      lowStockThreshold: values.lowStockThreshold,
      ...(imageUrl ? { photo: imageUrl } : {}),
    };

    if (editMedicine) {
      const res = await mutation(`medicines/${editMedicine._id}`, {
        method: "PATCH",
        body: medicineFields,
        isAlert: true,
      });
      if (res?.results?.success) {
        mutate();
        setShowForm(false);
        setEditMedicine(null);
        setImageUrl("");
        setFormResetKey((k) => k + 1);
        resetForm();
      }
    } else {
      // Create medicine + first batch together
      const body = {
        ...medicineFields,
        firstBatch: {
          batchNumber: values.batchNumber,
          expiryDate: values.expiryDate,
          purchasePrice: Number(values.purchasePrice),
          sellingPrice: Number(values.sellingPrice),
          gst: Number(values.gst),
          quantity: Number(values.quantity),
        },
      };
      const res = await mutation("medicines", {
        method: "POST",
        body,
        isAlert: true,
      });
      if (res?.results?.success) {
        mutate();
        setShowForm(false);
        setImageUrl("");
        setFormResetKey((k) => k + 1);
        resetForm();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deactivate this medicine?")) return;
    const res = await mutation(`medicines/${id}`, {
      method: "DELETE",
      isAlert: true,
    });
    if (res?.results?.success) mutate();
  };

  const openEdit = (med: Medicine) => {
    setEditMedicine(med);
    setShowForm(true);
  };

  const columns = [
    { field: "name" as const, title: "Medicine Name" },
    { field: "genericName" as const, title: "Generic Name" },
    { field: "sku" as const, title: "SKU" },
    { field: "category" as const, title: "Category" },
    { field: "manufacturer" as const, title: "Manufacturer" },
    { field: "unit" as const, title: "Unit" },
    {
      field: "quantity" as const,
      title: "Stock",
      render: (row: Medicine) => (
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
            row.quantity <= 10
              ? "bg-error-100 text-error-700"
              : row.quantity <= 30
                ? "bg-warning-100 text-warning-700"
                : "bg-primary-100 text-primary-700"
          }`}
        >
          {row.quantity}
        </span>
      ),
    },
    {
      field: "requiresPrescription" as const,
      title: "Rx",
      render: (row: Medicine) =>
        row.requiresPrescription ? (
          <span className="bg-secondary-100 text-secondary-700 rounded-full px-2 py-0.5 text-xs">
            Required
          </span>
        ) : (
          <span className="text-accent-400 text-xs">—</span>
        ),
    },
    {
      field: "_id" as const,
      title: "Actions",
      render: (row: Medicine) => (
        <div className="flex gap-2">
          <button
            onClick={() => openEdit(row)}
            className="text-accent-500 hover:bg-accent-100 hover:text-primary-600 rounded p-1"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={() => handleDelete(row._id)}
            className="text-accent-500 hover:bg-error-50 hover:text-error-600 rounded p-1"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {showScanner && scanCallback && (
        <BarcodeScannerModal
          onScan={(code) => {
            scanCallback(code);
            setShowScanner(false);
            setScanCallback(null);
          }}
          onClose={() => {
            setShowScanner(false);
            setScanCallback(null);
          }}
        />
      )}
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-accent-900 text-2xl font-bold">Medicines</h1>
          <p className="text-accent-500 mt-0.5 text-sm">
            Manage your medicine catalogue
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/inventory/add">
            <CustomButton variant="secondary" size="small" fullWidth={false}>
              Add Batch / Stock
            </CustomButton>
          </Link>
          <CustomButton
            variant="primary"
            size="small"
            fullWidth={false}
            startIcon={<Plus size={15} />}
            onClick={() => {
              setEditMedicine(null);
              setImageUrl("");
              setFormResetKey((k) => k + 1);
              setShowForm(true);
            }}
          >
            Add Medicine
          </CustomButton>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2">
        <div className="relative max-w-sm flex-1">
          <Search
            size={16}
            className="text-accent-400 absolute top-1/2 left-3 -translate-y-1/2"
          />
          <input
            type="text"
            placeholder="Search by name, SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-accent-300 focus:border-primary-500 focus:ring-primary-100 w-full rounded-lg border bg-white py-2 pr-3 pl-9 text-sm outline-none focus:ring-2"
          />
        </div>
        <button
          type="button"
          title="Scan barcode to search"
          onClick={() => {
            setScanCallback(() => (code: string) => setSearch(code));
            setShowScanner(true);
          }}
          className="border-accent-300 bg-accent-50 hover:bg-primary-50 hover:border-primary-400 hover:text-primary-600 text-accent-500 flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-colors"
        >
          <ScanBarcode size={16} />
          <span className="hidden sm:inline">Scan</span>
        </button>
      </div>

      {/* Add / Edit Form */}
      {showForm && (
        <div className="border-accent-200 rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="text-accent-800 mb-5 flex items-center gap-2 text-base font-semibold">
            <Pill size={18} className="text-primary-500" />
            {editMedicine ? "Edit Medicine" : "Add New Medicine"}
          </h2>
          <Formik
            initialValues={
              editMedicine
                ? {
                    name: editMedicine.name,
                    genericName: editMedicine.genericName ?? "",
                    category: editMedicine.category,
                    manufacturer: editMedicine.manufacturer,
                    sku: editMedicine.sku,
                    unit: editMedicine.unit,
                    requiresPrescription: editMedicine.requiresPrescription,
                    description: "",
                    lowStockThreshold: Number(
                      editMedicine.lowStockThreshold ?? 10
                    ),
                    batchNumber: "",
                    expiryDate: "",
                    purchasePrice: "",
                    sellingPrice: "",
                    gst: "12",
                    quantity: "",
                  }
                : initialValues
            }
            validationSchema={medicineSchema}
            validationContext={{ isEdit: !!editMedicine }}
            onSubmit={handleSubmit}
            enableReinitialize
          >
            {() => (
              <Form className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <SkuAutoFill isEdit={!!editMedicine} />
                <BatchNumberListener />

                {/* Medicine Name with autocomplete */}
                <MedicineNameAutocomplete />

                {[
                  { name: "genericName", label: "Generic Name", type: "text" },
                  { name: "manufacturer", label: "Manufacturer", type: "text" },
                  { name: "sku", label: "SKU (auto-generated)", type: "text" },
                ].map((f) => (
                  <div key={f.name}>
                    <label className="text-accent-700 mb-1.5 block text-sm font-medium">
                      {f.label}
                    </label>
                    <Field
                      name={f.name}
                      type={f.type}
                      placeholder={f.label}
                      className="border-accent-300 focus:border-primary-500 focus:ring-primary-100 w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none focus:ring-2"
                    />
                    <ErrorMessage
                      name={f.name}
                      component="p"
                      className="text-error-500 mt-1 text-xs"
                    />
                  </div>
                ))}

                {/* Category */}
                <div>
                  <label className="text-accent-700 mb-1.5 block text-sm font-medium">
                    Category
                  </label>
                  <Field
                    as="select"
                    name="category"
                    className="border-accent-300 focus:border-primary-500 focus:ring-primary-100 w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none focus:ring-2"
                  >
                    <option value="">Select category</option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </Field>
                  <ErrorMessage
                    name="category"
                    component="p"
                    className="text-error-500 mt-1 text-xs"
                  />
                </div>

                {/* Unit */}
                <div>
                  <label className="text-accent-700 mb-1.5 block text-sm font-medium">
                    Unit
                  </label>
                  <Field
                    as="select"
                    name="unit"
                    className="border-accent-300 focus:border-primary-500 focus:ring-primary-100 w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none focus:ring-2"
                  >
                    {UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </Field>
                  <ErrorMessage
                    name="unit"
                    component="p"
                    className="text-error-500 mt-1 text-xs"
                  />
                </div>

                {/* Low Stock Threshold */}
                <div>
                  <label className="text-accent-700 mb-1.5 block text-sm font-medium">
                    Low Stock Threshold
                  </label>
                  <Field
                    name="lowStockThreshold"
                    type="number"
                    min={1}
                    className="border-accent-300 focus:border-primary-500 focus:ring-primary-100 w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none focus:ring-2"
                  />
                  <ErrorMessage
                    name="lowStockThreshold"
                    component="p"
                    className="text-error-500 mt-1 text-xs"
                  />
                </div>

                {/* Prescription */}
                <div className="flex items-center gap-3 pt-5">
                  <Field
                    type="checkbox"
                    name="requiresPrescription"
                    id="requiresPrescription"
                    className="border-accent-300 text-primary-600 h-4 w-4 rounded"
                  />
                  <label
                    htmlFor="requiresPrescription"
                    className="text-accent-700 text-sm font-medium"
                  >
                    Requires Prescription
                  </label>
                </div>

                {/* Description with AI generator */}
                <div className="sm:col-span-2 lg:col-span-3">
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="text-accent-700 text-sm font-medium">
                      Description
                    </label>
                    <AiDescriptionButton />
                  </div>
                  <Field
                    as="textarea"
                    name="description"
                    rows={2}
                    placeholder="Optional description… or click AI Generate"
                    className="border-accent-300 focus:border-primary-500 focus:ring-primary-100 w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none focus:ring-2"
                  />
                </div>

                {/* Image auto-fetch + manual upload */}
                <MedicineImagePicker
                  onImageReady={setImageUrl}
                  resetKey={formResetKey}
                />

                {/* First Batch — only on Add (not edit) */}
                {!editMedicine && (
                  <div className="sm:col-span-2 lg:col-span-3">
                    <div className="border-accent-200 bg-accent-50 mt-2 rounded-xl border p-4">
                      <p className="text-accent-700 mb-3 flex items-center gap-2 text-sm font-semibold">
                        <span className="bg-primary-100 text-primary-600 rounded px-2 py-0.5 text-xs">
                          First Batch / Stock
                        </span>
                        Add opening stock for this medicine
                      </p>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {/* Batch Number */}
                        <div>
                          <label className="text-accent-700 mb-1.5 block text-sm font-medium">
                            Batch Number
                          </label>
                          <div className="flex gap-2">
                            <Field
                              name="batchNumber"
                              type="text"
                              placeholder="e.g. BT-2026-001"
                              className="border-accent-300 focus:border-primary-500 w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm outline-none"
                            />
                            <button
                              type="button"
                              title="Scan barcode"
                              onClick={() => {
                                setScanCallback(() => (v: string) => {
                                  // find the Formik setFieldValue via a workaround: dispatch a custom event
                                  document.dispatchEvent(
                                    new CustomEvent("__setBatchNumber", {
                                      detail: v,
                                    })
                                  );
                                });
                                setShowScanner(true);
                              }}
                              className="bg-accent-100 hover:bg-accent-200 text-accent-600 flex shrink-0 items-center justify-center rounded-lg px-3"
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
                            className="border-accent-300 focus:border-primary-500 w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm outline-none"
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
                            placeholder="e.g. 100"
                            className="border-accent-300 focus:border-primary-500 w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm outline-none"
                          />
                          <ErrorMessage
                            name="quantity"
                            component="p"
                            className="text-error-500 mt-1 text-xs"
                          />
                        </div>

                        {/* Purchase Price (cost) */}
                        <div>
                          <label className="text-accent-700 mb-1.5 block text-sm font-medium">
                            Purchase Price (₹)
                            <span className="text-accent-400 ml-1 text-xs font-normal">
                              cost from vendor
                            </span>
                          </label>
                          <Field
                            name="purchasePrice"
                            type="number"
                            min={0}
                            step="0.01"
                            placeholder="e.g. 45.00"
                            className="border-accent-300 focus:border-primary-500 w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm outline-none"
                          />
                          <ErrorMessage
                            name="purchasePrice"
                            component="p"
                            className="text-error-500 mt-1 text-xs"
                          />
                        </div>

                        {/* Selling Price (MRP) */}
                        <div>
                          <label className="text-accent-700 mb-1.5 block text-sm font-medium">
                            Selling Price / MRP (₹)
                          </label>
                          <Field
                            name="sellingPrice"
                            type="number"
                            min={0}
                            step="0.01"
                            placeholder="e.g. 65.00"
                            className="border-accent-300 focus:border-primary-500 w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm outline-none"
                          />
                          <ErrorMessage
                            name="sellingPrice"
                            component="p"
                            className="text-error-500 mt-1 text-xs"
                          />
                        </div>

                        {/* GST % */}
                        <div>
                          <label className="text-accent-700 mb-1.5 block text-sm font-medium">
                            GST (%)
                          </label>
                          <Field
                            as="select"
                            name="gst"
                            className="border-accent-300 focus:border-primary-500 w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm outline-none"
                          >
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
                      </div>
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
                    loading={isSaving}
                  >
                    {editMedicine ? "Save Changes" : "Add Medicine"}
                  </CustomButton>
                  <CustomButton
                    variant="cancel"
                    size="small"
                    fullWidth={false}
                    onClick={() => {
                      setShowForm(false);
                      setEditMedicine(null);
                      setImageUrl("");
                      setFormResetKey((k) => k + 1);
                    }}
                  >
                    Cancel
                  </CustomButton>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      )}

      {/* Table */}
      <div className="border-accent-200 rounded-xl border bg-white shadow-sm">
        <CustomTable data={medicines} columns={columns} isLoading={isLoading} />
      </div>
    </div>
  );
};

export default MedicinesPage;
