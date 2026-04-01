import { NextRequest, NextResponse } from "next/server";
import { MediaService } from "@/shared/hooks/mediaService";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const uploaded = await MediaService.uploadFile(file);
    return NextResponse.json({
      url: uploaded.url,
      publicId: uploaded.publicId,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
