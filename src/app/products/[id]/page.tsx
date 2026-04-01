import type { Metadata } from "next";
import dynamic from "next/dynamic";
import StoreLayout from "@/shared/layouts/store";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/medicines/${id}`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const json = await res.json();
      const med = json?.data;
      if (med) {
        return {
          title: med.name,
          description:
            `Buy ${med.name}${med.genericName ? ` (${med.genericName})` : ""} online. ${med.description ?? "Genuine medicine from a trusted pharmacy."}`.slice(
              0,
              160
            ),
          keywords: [
            med.name,
            med.genericName,
            med.category,
            "buy medicine",
            "pharmacy",
          ]
            .filter(Boolean)
            .join(", "),
          alternates: { canonical: `/products/${id}` },
          openGraph: {
            title: `${med.name} | Sidheswar Drugs House`,
            description: med.description ?? `Buy genuine ${med.name} online.`,
            url: `/products/${id}`,
            type: "website",
            ...(med.photo
              ? { images: [{ url: med.photo, alt: med.name }] }
              : {}),
          },
        };
      }
    }
  } catch {
    // fallback below
  }
  return {
    title: "Medicine Details",
    description:
      "View medicine details and buy online at Sidheswar Drugs House.",
  };
}

const ProductDetailPage = dynamic(
  () => import("@/features/store/pages/ProductDetailPage"),
  { loading: () => <div className="p-8 text-center text-sm">Loading...</div> }
);

export default function ProductPage() {
  return (
    <StoreLayout>
      <ProductDetailPage />
    </StoreLayout>
  );
}
