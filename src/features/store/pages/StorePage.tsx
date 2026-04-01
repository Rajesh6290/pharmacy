"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Search,
  ShoppingCart,
  Pill,
  AlertCircle,
  SlidersHorizontal,
  X,
  ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import useSwr from "@/shared/hooks/useSwr";

interface Medicine {
  _id: string;
  name: string;
  genericName?: string;
  category: string;
  manufacturer: string;
  sku: string;
  unit: string;
  quantity: number;
  requiresPrescription: boolean;
  photo?: string;
  batches: {
    sellingPrice: number;
    mrp?: number;
    gst: number;
    quantity: number;
    expiryDate: string;
  }[];
}

const CATEGORIES = [
  "All",
  "Tablet",
  "Capsule",
  "Syrup",
  "Injection",
  "Cream/Ointment",
  "Drops",
  "Powder",
  "Inhaler",
  "Vitamins",
  "Other",
];

const SORT_OPTIONS = [
  { label: "Newest First", value: "newest" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
  { label: "Name A–Z", value: "name_asc" },
];

function getLowestPrice(med: Medicine) {
  const valid = med.batches.filter(
    (b) => b.quantity > 0 && new Date(b.expiryDate) > new Date()
  );
  if (!valid.length) return null;
  return Math.min(...valid.map((b) => b.sellingPrice));
}

function getHighestMrp(med: Medicine) {
  const valid = med.batches.filter(
    (b) => b.quantity > 0 && new Date(b.expiryDate) > new Date()
  );
  if (!valid.length) return null;
  const mrps = valid.map((b) => b.mrp ?? b.sellingPrice * 1.2);
  return Math.max(...mrps);
}

function MedicineCard({ med }: { med: Medicine }) {
  const price = getLowestPrice(med);
  const mrp = getHighestMrp(med);
  const inStock = med.quantity > 0;
  const discount =
    price && mrp && mrp > price
      ? Math.round(((mrp - price) / mrp) * 100)
      : null;

  return (
    <motion.div
      whileHover={{ y: -3, boxShadow: "0 8px 28px rgba(0,0,0,0.09)" }}
      transition={{ duration: 0.18 }}
      className="border-accent-100 group flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm"
    >
      {/* Image */}
      <div className="bg-accent-50 relative h-44 w-full overflow-hidden">
        {discount !== null && (
          <span className="bg-error-500 absolute top-2 left-2 z-10 rounded-full px-2 py-0.5 text-[10px] font-bold text-white">
            {discount}% OFF
          </span>
        )}
        {med.requiresPrescription && (
          <span className="bg-secondary-100 text-secondary-700 absolute top-2 right-2 z-10 rounded-full px-2 py-0.5 text-[10px] font-semibold">
            Rx
          </span>
        )}
        {med.photo ? (
          <Image
            src={med.photo}
            alt={med.name}
            fill
            className="object-contain p-3 transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Pill size={44} className="text-accent-200" strokeWidth={1.2} />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col p-4">
        <p className="text-primary-600 mb-0.5 text-[10px] font-bold tracking-widest uppercase">
          {med.category}
        </p>
        <h3 className="text-accent-900 line-clamp-2 text-sm leading-snug font-semibold">
          {med.name}
        </h3>
        {med.genericName && (
          <p className="text-accent-400 mt-0.5 line-clamp-1 text-xs">
            {med.genericName}
          </p>
        )}
        <p className="text-accent-400 mt-0.5 text-xs">{med.manufacturer}</p>

        {/* Price row */}
        <div className="mt-3 flex items-end gap-2">
          {price ? (
            <>
              <p className="text-accent-900 text-lg font-extrabold">
                ₹{price.toFixed(0)}
              </p>
              {mrp && mrp > price && (
                <p className="text-accent-400 mb-0.5 text-xs line-through">
                  ₹{mrp.toFixed(0)}
                </p>
              )}
            </>
          ) : (
            <p className="text-accent-400 text-sm">Unavailable</p>
          )}
        </div>

        <p className="text-accent-400 text-[10px]">per {med.unit}</p>

        {/* Stock badge */}
        <span
          className={`mt-2 inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
            inStock
              ? "bg-primary-50 text-primary-700"
              : "bg-error-50 text-error-600"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${inStock ? "bg-primary-500" : "bg-error-500"}`}
          />
          {inStock ? "In Stock" : "Out of Stock"}
        </span>

        {/* CTA */}
        <Link href={`/products/${med._id}`} className="mt-4">
          <motion.button
            whileTap={{ scale: 0.96 }}
            disabled={!inStock}
            className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-colors ${
              inStock
                ? "bg-primary-500 hover:bg-primary-600 text-white"
                : "bg-accent-100 text-accent-400 cursor-not-allowed"
            }`}
          >
            {inStock ? (
              <>
                <ShoppingCart size={15} /> Add to Cart
              </>
            ) : (
              <>
                <AlertCircle size={15} /> Out of Stock
              </>
            )}
          </motion.button>
        </Link>
      </div>
    </motion.div>
  );
}

function SkeletonCard() {
  return (
    <div className="border-accent-100 rounded-2xl border bg-white p-4 shadow-sm">
      <div className="bg-accent-100 mb-4 h-44 animate-pulse rounded-xl" />
      <div className="bg-accent-100 mb-2 h-3 w-1/3 animate-pulse rounded" />
      <div className="bg-accent-100 mb-1 h-4 animate-pulse rounded" />
      <div className="bg-accent-100 mb-4 h-3 w-2/3 animate-pulse rounded" />
      <div className="bg-accent-100 h-10 animate-pulse rounded-xl" />
    </div>
  );
}

const StorePage = () => {
  const searchParams = useSearchParams();
  const initialSearch = searchParams?.get("search") ?? "";
  const initialCategory = searchParams?.get("category") ?? "";

  const [search, setSearch] = useState(initialSearch);
  const [category, setCategory] = useState(initialCategory);
  const [sort, setSort] = useState("newest");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const query = `medicines?search=${encodeURIComponent(search)}${
    category && category !== "All"
      ? `&category=${encodeURIComponent(category)}`
      : ""
  }`;
  const { data, isLoading } = useSwr(query);
  const medicines: Medicine[] = data?.data?.medicines ?? [];

  const sorted = [...medicines].sort((a, b) => {
    const pa = getLowestPrice(a) ?? 0;
    const pb = getLowestPrice(b) ?? 0;
    if (sort === "price_asc") return pa - pb;
    if (sort === "price_desc") return pb - pa;
    if (sort === "name_asc") return a.name.localeCompare(b.name);
    return 0;
  });

  const activeCategory = category || "All";

  return (
    <div className="bg-accent-50 min-h-dvh">
      {/* Page header */}
      <div className="border-accent-200 border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <h1 className="text-accent-900 text-xl font-bold sm:text-2xl">
            Medicine Store
          </h1>
          <p className="text-accent-500 mt-0.5 text-sm">
            {isLoading ? "Loading…" : `${medicines.length} medicines available`}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Search + Sort + Filter bar */}
        <div className="mb-5 flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative min-w-0 flex-1 sm:max-w-sm">
            <Search
              size={15}
              className="text-accent-400 absolute top-1/2 left-3 -translate-y-1/2"
            />
            <input
              type="text"
              placeholder="Search by name, generic name or SKU…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-accent-200 focus:border-primary-500 focus:ring-primary-100 w-full rounded-full border bg-white py-2 pr-3 pl-9 text-sm outline-none focus:ring-2"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="text-accent-400 hover:text-accent-600 absolute top-1/2 right-3 -translate-y-1/2"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Sort */}
          <div className="relative shrink-0">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="border-accent-200 focus:border-primary-400 appearance-none rounded-full border bg-white py-2 pr-8 pl-3 text-sm outline-none"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <ChevronDown
              size={13}
              className="text-accent-400 pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2"
            />
          </div>

          {/* Filter toggle (mobile) */}
          <button
            onClick={() => setFiltersOpen((v) => !v)}
            className="border-accent-200 text-accent-700 flex shrink-0 items-center gap-2 rounded-full border bg-white px-4 py-2 text-sm font-medium sm:hidden"
          >
            <SlidersHorizontal size={15} /> Filters
          </button>
        </div>

        {/* Category chips */}
        <div
          className={`mb-6 flex flex-wrap gap-2 ${filtersOpen ? "" : "hidden sm:flex"}`}
        >
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat === "All" ? "" : cat)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                activeCategory === cat
                  ? "bg-primary-500 text-white shadow-sm"
                  : "border-accent-200 text-accent-600 hover:border-primary-300 hover:text-primary-600 border bg-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-4 py-24"
          >
            <div className="bg-accent-100 flex h-20 w-20 items-center justify-center rounded-full">
              <Pill size={40} className="text-accent-300" strokeWidth={1.2} />
            </div>
            <p className="text-accent-700 text-lg font-semibold">
              No medicines found
            </p>
            <p className="text-accent-400 text-sm">
              Try a different search or category
            </p>
            <button
              onClick={() => {
                setSearch("");
                setCategory("");
              }}
              className="bg-primary-500 rounded-full px-5 py-2 text-sm font-semibold text-white"
            >
              Clear filters
            </button>
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={`${search}-${category}-${sort}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
            >
              {sorted.map((med) => (
                <MedicineCard key={med._id} med={med} />
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default StorePage;
