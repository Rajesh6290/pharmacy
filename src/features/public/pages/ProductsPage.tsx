"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Search,
  SlidersHorizontal,
  ShoppingCart,
  Pill,
  X,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import useSwr from "@/shared/hooks/useSwr";
import { MedicineGridSkeleton } from "@/shared/common/Skeletons";
import CustomButton from "@/shared/common/CustomButton";

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
    gst: number;
    quantity: number;
    expiryDate: string;
  }[];
}

interface ApiResponse {
  medicines: Medicine[];
  pagination: { total: number; pages: number; page: number; limit: number };
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

const SORT_OPTIONS = [
  { label: "Relevance", value: "" },
  { label: "Price: Low → High", value: "price_asc" },
  { label: "Price: High → Low", value: "price_desc" },
  { label: "Name: A → Z", value: "name_asc" },
  { label: "Name: Z → A", value: "name_desc" },
];

const PAGE_SIZE = 12;

function getLowestPrice(med: Medicine): number | null {
  const valid = med.batches.filter(
    (b) => b.quantity > 0 && new Date(b.expiryDate) > new Date()
  );
  if (!valid.length) return null;
  return Math.min(...valid.map((b) => b.sellingPrice));
}

function sortMedicines(list: Medicine[], sort: string): Medicine[] {
  if (!sort) return list;
  const copy = [...list];
  switch (sort) {
    case "price_asc":
      return copy.sort(
        (a, b) =>
          (getLowestPrice(a) ?? Infinity) - (getLowestPrice(b) ?? Infinity)
      );
    case "price_desc":
      return copy.sort(
        (a, b) => (getLowestPrice(b) ?? -1) - (getLowestPrice(a) ?? -1)
      );
    case "name_asc":
      return copy.sort((a, b) => a.name.localeCompare(b.name));
    case "name_desc":
      return copy.sort((a, b) => b.name.localeCompare(a.name));
    default:
      return copy;
  }
}

export default function PublicProductsPage() {
  const [search, setSearch] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [sort, setSort] = useState("");
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [rxOnly, setRxOnly] = useState(false);
  const [inStockOnly, setInStockOnly] = useState(false);

  // Build query string
  const category = selectedCategories.length === 1 ? selectedCategories[0] : "";
  const queryStr = [
    `search=${encodeURIComponent(search)}`,
    category ? `category=${encodeURIComponent(category)}` : "",
    `page=${page}`,
    `limit=${PAGE_SIZE}`,
  ]
    .filter(Boolean)
    .join("&");

  const { data, isLoading } = useSwr(`medicines?${queryStr}`);
  const apiData = data as ApiResponse | undefined;

  let medicines: Medicine[] = apiData?.medicines ?? [];
  const pagination = apiData?.pagination;

  // Client-side filters (price range, Rx, in-stock — not in API query)
  if (
    priceMin ||
    priceMax ||
    rxOnly ||
    inStockOnly ||
    selectedCategories.length > 1
  ) {
    medicines = medicines.filter((m) => {
      if (rxOnly && !m.requiresPrescription) return false;
      if (inStockOnly && m.quantity === 0) return false;
      if (
        selectedCategories.length > 1 &&
        !selectedCategories.includes(m.category)
      )
        return false;
      const price = getLowestPrice(m);
      if (priceMin && price !== null && price < Number(priceMin)) return false;
      if (priceMax && price !== null && price > Number(priceMax)) return false;
      return true;
    });
  }

  medicines = sortMedicines(medicines, sort);

  const toggleCategory = useCallback((cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
    setPage(1);
  }, []);

  const clearFilters = () => {
    setSelectedCategories([]);
    setPriceMin("");
    setPriceMax("");
    setRxOnly(false);
    setInStockOnly(false);
    setSort("");
    setPage(1);
  };

  const hasActiveFilters =
    selectedCategories.length > 0 ||
    priceMin !== "" ||
    priceMax !== "" ||
    rxOnly ||
    inStockOnly;

  return (
    <div className="min-h-dvh bg-white">
      {/* ── Page header ────────────────────────────────────────────────── */}
      <div className="from-primary-50 to-secondary-50 border-accent-200 border-b bg-linear-to-r px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-accent-900 text-3xl font-bold">
            Medicine Catalogue
          </h1>
          <p className="text-accent-500 mt-1 text-sm">
            Browse our complete range of authentic medicines
          </p>

          {/* Search bar */}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search
                size={18}
                className="text-accent-400 absolute top-1/2 left-4 -translate-y-1/2"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by name, generic name or SKU..."
                className="border-accent-300 focus:border-primary-500 focus:ring-primary-100 w-full rounded-xl border bg-white py-3 pr-4 pl-11 text-sm shadow-sm outline-none focus:ring-2"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setPage(1);
                  }}
                  className="text-accent-400 hover:text-accent-700 absolute top-1/2 right-3 -translate-y-1/2"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Sort */}
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="border-accent-300 focus:border-primary-500 min-w-[180px] rounded-xl border bg-white px-4 py-3 text-sm shadow-sm outline-none"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>

            {/* Filter toggle */}
            <button
              type="button"
              onClick={() => setShowFilters((v) => !v)}
              className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium shadow-sm transition-colors ${
                showFilters || hasActiveFilters
                  ? "border-primary-500 bg-primary-50 text-primary-700"
                  : "border-accent-300 text-accent-600 hover:border-primary-300"
              }`}
            >
              <SlidersHorizontal size={16} />
              Filters
              {hasActiveFilters && (
                <span className="bg-primary-500 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white">
                  {selectedCategories.length +
                    (priceMin ? 1 : 0) +
                    (priceMax ? 1 : 0) +
                    (rxOnly ? 1 : 0) +
                    (inStockOnly ? 1 : 0)}
                </span>
              )}
            </button>
          </div>

          {/* Expandable Filters Panel */}
          {showFilters && (
            <div className="border-accent-200 mt-4 rounded-xl border bg-white p-5 shadow-sm">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {/* Categories */}
                <div className="lg:col-span-2">
                  <p className="text-accent-700 mb-2 text-sm font-semibold">
                    Category
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => toggleCategory(cat)}
                        className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                          selectedCategories.includes(cat)
                            ? "border-primary-500 bg-primary-100 text-primary-700"
                            : "border-accent-300 text-accent-600 hover:border-primary-300"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div>
                  <p className="text-accent-700 mb-2 text-sm font-semibold">
                    Price Range (₹)
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={priceMin}
                      onChange={(e) => setPriceMin(e.target.value)}
                      placeholder="Min"
                      min={0}
                      className="border-accent-300 focus:border-primary-500 w-full rounded-lg border px-3 py-2 text-sm outline-none"
                    />
                    <span className="text-accent-400 text-xs">to</span>
                    <input
                      type="number"
                      value={priceMax}
                      onChange={(e) => setPriceMax(e.target.value)}
                      placeholder="Max"
                      min={0}
                      className="border-accent-300 focus:border-primary-500 w-full rounded-lg border px-3 py-2 text-sm outline-none"
                    />
                  </div>
                </div>

                {/* Other filters */}
                <div>
                  <p className="text-accent-700 mb-2 text-sm font-semibold">
                    Other
                  </p>
                  <div className="space-y-2">
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={inStockOnly}
                        onChange={(e) => setInStockOnly(e.target.checked)}
                        className="text-primary-600 h-4 w-4 rounded"
                      />
                      <span className="text-accent-700 text-sm">
                        In Stock Only
                      </span>
                    </label>
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={rxOnly}
                        onChange={(e) => setRxOnly(e.target.checked)}
                        className="text-primary-600 h-4 w-4 rounded"
                      />
                      <span className="text-accent-700 text-sm">
                        Prescription Medicines
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {hasActiveFilters && (
                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="text-error-600 hover:text-error-700 flex items-center gap-1 text-sm"
                  >
                    <X size={14} />
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Active filter chips */}
          {hasActiveFilters && (
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedCategories.map((cat) => (
                <span
                  key={cat}
                  className="border-primary-300 bg-primary-50 text-primary-700 flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs"
                >
                  {cat}
                  <button
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className="ml-0.5"
                  >
                    <X size={11} />
                  </button>
                </span>
              ))}
              {inStockOnly && (
                <span className="border-primary-300 bg-primary-50 text-primary-700 flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs">
                  In Stock
                  <button
                    type="button"
                    onClick={() => setInStockOnly(false)}
                    className="ml-0.5"
                  >
                    <X size={11} />
                  </button>
                </span>
              )}
              {rxOnly && (
                <span className="border-secondary-300 bg-secondary-50 text-secondary-700 flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs">
                  Rx Required
                  <button
                    type="button"
                    onClick={() => setRxOnly(false)}
                    className="ml-0.5"
                  >
                    <X size={11} />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Product grid ─────────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Result count */}
        {!isLoading && (
          <p className="text-accent-500 mb-5 text-sm">
            {medicines.length === 0
              ? "No medicines found"
              : `Showing ${medicines.length} medicine${medicines.length !== 1 ? "s" : ""}${pagination ? ` of ${pagination.total}` : ""}`}
          </p>
        )}

        {isLoading ? (
          <MedicineGridSkeleton count={PAGE_SIZE} />
        ) : medicines.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-24 text-center">
            <Pill size={52} className="text-accent-200" strokeWidth={1} />
            <div>
              <p className="text-accent-700 font-semibold">
                No medicines found
              </p>
              <p className="text-accent-500 mt-1 text-sm">
                Try a different search term or clear filters.
              </p>
            </div>
            {hasActiveFilters && (
              <CustomButton
                variant="secondary"
                size="small"
                fullWidth={false}
                onClick={clearFilters}
              >
                Clear filters
              </CustomButton>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {medicines.map((med) => {
              const price = getLowestPrice(med);
              const inStock = med.quantity > 0;

              return (
                <div
                  key={med._id}
                  className="border-accent-200 group flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
                >
                  {/* Image */}
                  <div className="bg-accent-50 relative h-40 w-full overflow-hidden">
                    {med.photo ? (
                      <Image
                        src={med.photo}
                        alt={med.name}
                        fill
                        className="object-contain p-3 transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Pill
                          size={44}
                          className="text-accent-200"
                          strokeWidth={1}
                        />
                      </div>
                    )}
                    {/* badges */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      {med.requiresPrescription && (
                        <span className="bg-secondary-600 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white shadow">
                          Rx
                        </span>
                      )}
                    </div>
                    <div className="absolute top-2 right-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold shadow ${
                          inStock
                            ? "bg-primary-500 text-white"
                            : "bg-error-500 text-white"
                        }`}
                      >
                        {inStock ? "In Stock" : "Out of Stock"}
                      </span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex flex-1 flex-col p-4">
                    <span className="text-primary-600 mb-1 text-[10px] font-semibold tracking-wider uppercase">
                      {med.category}
                    </span>
                    <h3 className="text-accent-900 line-clamp-2 text-sm leading-snug font-bold">
                      {med.name}
                    </h3>
                    {med.genericName && (
                      <p className="text-accent-400 mt-0.5 line-clamp-1 text-xs">
                        {med.genericName}
                      </p>
                    )}
                    <p className="text-accent-400 mt-1 text-xs">
                      {med.manufacturer}
                    </p>

                    <div className="mt-auto flex items-center justify-between pt-4">
                      <div>
                        {price !== null ? (
                          <>
                            <p className="text-primary-600 text-lg leading-none font-bold">
                              ₹{price.toFixed(2)}
                            </p>
                            <p className="text-accent-400 text-[10px]">
                              per {med.unit} (incl. GST)
                            </p>
                          </>
                        ) : (
                          <p className="text-accent-400 text-sm">—</p>
                        )}
                      </div>
                      <Link href={`/products/${med._id}`}>
                        <CustomButton
                          variant={inStock ? "primary" : "cancel"}
                          size="small"
                          fullWidth={false}
                          disabled={!inStock}
                          startIcon={
                            inStock ? (
                              <ShoppingCart size={13} />
                            ) : (
                              <AlertCircle size={13} />
                            )
                          }
                        >
                          {inStock ? "Buy" : "OOS"}
                        </CustomButton>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="border-accent-300 text-accent-600 hover:border-primary-400 hover:text-primary-600 flex items-center gap-1 rounded-lg border px-3 py-2 text-sm transition-colors disabled:opacity-40"
            >
              <ChevronLeft size={15} />
              Prev
            </button>

            {Array.from({ length: pagination.pages }, (_, i) => i + 1)
              .filter(
                (p) =>
                  p === 1 || p === pagination.pages || Math.abs(p - page) <= 2
              )
              .reduce<(number | "…")[]>((acc, p, i, arr) => {
                if (i > 0 && (p as number) - (arr[i - 1] as number) > 1)
                  acc.push("…");
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === "…" ? (
                  <span key={`ellipsis-${i}`} className="text-accent-400 px-1">
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPage(p as number)}
                    className={`h-9 w-9 rounded-lg border text-sm font-medium transition-colors ${
                      page === p
                        ? "border-primary-500 bg-primary-500 text-white"
                        : "border-accent-300 text-accent-600 hover:border-primary-400"
                    }`}
                  >
                    {p}
                  </button>
                )
              )}

            <button
              type="button"
              onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
              disabled={page === pagination.pages}
              className="border-accent-300 text-accent-600 hover:border-primary-400 hover:text-primary-600 flex items-center gap-1 rounded-lg border px-3 py-2 text-sm transition-colors disabled:opacity-40"
            >
              Next
              <ChevronRight size={15} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
