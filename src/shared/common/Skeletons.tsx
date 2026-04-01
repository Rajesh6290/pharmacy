/**
 * Reusable skeleton loaders for medicine cards and related UI.
 * Use these wherever API data is loading for consistent UX.
 */

/** Single medicine card skeleton */
export function MedicineCardSkeleton() {
  return (
    <div className="border-accent-200 flex flex-col rounded-xl border bg-white p-4 shadow-sm">
      {/* Image area */}
      <div className="bg-accent-100 mb-3 h-36 w-full animate-pulse rounded-lg" />

      {/* Badge row */}
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="bg-accent-100 h-4 w-16 animate-pulse rounded-full" />
        <div className="bg-accent-100 h-4 w-14 animate-pulse rounded-full" />
      </div>

      {/* Name */}
      <div className="bg-accent-100 mb-1.5 h-4 w-3/4 animate-pulse rounded" />
      {/* Generic name */}
      <div className="bg-accent-100 mb-1 h-3 w-1/2 animate-pulse rounded" />
      {/* Meta */}
      <div className="bg-accent-100 mb-4 h-3 w-2/3 animate-pulse rounded" />

      {/* Price + button */}
      <div className="mt-auto flex items-center justify-between">
        <div className="bg-accent-100 h-5 w-16 animate-pulse rounded" />
        <div className="bg-accent-100 h-8 w-24 animate-pulse rounded-lg" />
      </div>
    </div>
  );
}

/** Grid of card skeletons — pass `count` for how many to show */
export function MedicineGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <MedicineCardSkeleton key={i} />
      ))}
    </div>
  );
}

/** Skeleton for a single product detail page */
export function ProductDetailSkeleton() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      {/* back button */}
      <div className="bg-accent-100 h-4 w-24 animate-pulse rounded" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Image pane */}
        <div className="border-accent-200 bg-accent-100 h-64 animate-pulse rounded-2xl border lg:col-span-2" />

        {/* Info pane */}
        <div className="space-y-4 lg:col-span-3">
          <div className="flex gap-2">
            <div className="bg-accent-100 h-5 w-20 animate-pulse rounded-full" />
            <div className="bg-accent-100 h-5 w-24 animate-pulse rounded-full" />
          </div>
          <div className="bg-accent-100 h-7 w-2/3 animate-pulse rounded" />
          <div className="bg-accent-100 h-4 w-1/3 animate-pulse rounded" />
          <div className="bg-accent-100 h-4 w-1/2 animate-pulse rounded" />
          <div className="space-y-2">
            <div className="bg-accent-100 h-3 w-full animate-pulse rounded" />
            <div className="bg-accent-100 h-3 w-5/6 animate-pulse rounded" />
          </div>
          <div className="flex gap-2">
            <div className="bg-accent-100 h-10 w-32 animate-pulse rounded-lg" />
            <div className="bg-accent-100 h-10 w-32 animate-pulse rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Small inline skeleton for table rows */
export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div
            className="bg-accent-100 h-4 rounded"
            style={{ width: `${60 + (i % 3) * 20}%` }}
          />
        </td>
      ))}
    </tr>
  );
}
