import { NextRequest, NextResponse } from "next/server";
import {
  fetchMedicineData,
  fetchMedicineImageBuffer,
} from "@/shared/utils/medicineFetcherServer";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const medicineName = searchParams.get("medicineName")?.trim();
  const action = searchParams.get("action") ?? "suggestions";

  if (!medicineName) {
    return NextResponse.json(
      { error: "medicineName is required" },
      { status: 400 }
    );
  }

  try {
    if (action === "suggestions") {
      const products = await fetchMedicineData(medicineName);
      const suggestions = products.slice(0, 8).map((p) => ({
        id: p.productId,
        name: p.name,
        subtitle: p.subtitleText,
        hasImages: !!(p.damImages && p.damImages.length > 0),
        imageCount: p.damImages?.length ?? 0,
        firstImageUrl: p.damImages?.[0]?.url ?? null,
      }));
      return NextResponse.json({ data: suggestions });
    }

    if (action === "image") {
      const imageBuffer = await fetchMedicineImageBuffer(medicineName);
      if (!imageBuffer) {
        return NextResponse.json({ error: "No image found" }, { status: 404 });
      }
      return new Response(Uint8Array.from(imageBuffer.buffer), {
        headers: {
          "Content-Type": imageBuffer.contentType,
          "Cache-Control": "public, max-age=86400",
        },
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch medicine data" },
      { status: 500 }
    );
  }
}
