# Medicine Image Fetcher - Documentation

## Overview

The Medicine Image Fetcher utility fetches medicine images from PharmEasy API when you provide a medicine name.

## ⚠️ IMPORTANT: File Storage

**Downloaded files are in MEMORY only - they are NOT automatically saved!**

- ❌ NOT saved to disk
- ❌ NOT saved to cloud storage
- ❌ NOT saved to database
- ✅ Only exist in memory as Blob/File/Buffer objects

**To persist images, you MUST upload them to MediaService (Cloudinary)**

---

## How It Works

### Flow Diagram

```
1. Medicine Name (Input)
   ↓
2. Call fetchMedicineImage("Paracetamol")
   ↓
3. Fetches from PharmEasy API
   ↓
4. Downloads image → Returns File object (IN MEMORY)
   ↓
5. Upload to MediaService (Cloudinary) ← YOU DO THIS
   ↓
6. Get Cloudinary URL (STORED IN CLOUD)
   ↓
7. Save URL to database with medicine record
```

---

## Usage Examples

### Example 1: Client-side (React Hook)

```typescript
import useMedicineFetcher from "@/shared/hooks/useMedicineFetcher";
import MediaService from "@/shared/hooks/mediaService";
import useMutation from "@/shared/hooks/useMutation";

function MedicineForm() {
  const { fetchAndDownloadImage, isLoading } = useMedicineFetcher();
  const { mutation } = useMutation();

  const handleSubmit = async (formData) => {
    // Step 1: Fetch image from PharmEasy (in memory)
    const blob = await fetchAndDownloadImage(formData.medicineName);

    if (blob) {
      // Step 2: Convert to File (still in memory)
      const file = new File([blob], `${formData.medicineName}.jpg`, {
        type: blob.type
      });

      // Step 3: Upload to Cloudinary (NOW it's stored permanently)
      const cloudinaryUrl = await MediaService.upload(file);

      // Step 4: Save to database with medicine data
      await mutation("/api/medicines", {
        method: "POST",
        body: {
          name: formData.medicineName,
          price: formData.price,
          image: cloudinaryUrl  // ← Permanent URL
        }
      });
    }
  };

  return (/* your form JSX */);
}
```

### Example 2: Client-side (Direct Utility)

```typescript
import { fetchMedicineImage } from "@/shared/utils/medicineFetcher";
import MediaService from "@/shared/hooks/mediaService";

// Get image file (in memory)
const imageFile = await fetchMedicineImage("Paracetamol");

if (imageFile) {
  // Upload to Cloudinary to store permanently
  const url = await MediaService.upload(imageFile);

  // Now save URL to database
  const medicine = {
    name: "Paracetamol",
    image: url, // ← This is the permanent URL
  };
}
```

### Example 3: Server-side (API Route)

```typescript
// src/app/api/medicines/auto-fetch/route.ts
import { NextRequest, NextResponse } from "next/server";
import { fetchMedicineImageBuffer } from "@/shared/utils/medicineFetcherServer";
import MediaService from "@/shared/hooks/mediaService";

export async function POST(request: NextRequest) {
  const { medicineName } = await request.json();

  // Step 1: Fetch image buffer (in memory)
  const imageBuffer = await fetchMedicineImageBuffer(medicineName);

  if (!imageBuffer) {
    return NextResponse.json({ error: "No image found" }, { status: 404 });
  }

  // Step 2: Convert Buffer to File
  const blob = new Blob([imageBuffer.buffer], {
    type: imageBuffer.contentType,
  });
  const file = new File([blob], imageBuffer.fileName, {
    type: imageBuffer.contentType,
  });

  // Step 3: Upload to Cloudinary (permanent storage)
  const cloudinaryUrl = await MediaService.upload(file);

  // Step 4: Return URL or save to database
  return NextResponse.json({
    success: true,
    imageUrl: cloudinaryUrl, // ← Permanent URL
  });
}
```

---

## Available Functions

### Client-side

#### `useMedicineFetcher()` - React Hook

```typescript
const {
  fetchAndDownloadImage, // Fetch image as Blob
  fetchSuggestions, // Get medicine suggestions
  getImageUrl, // Get API proxy URL
  isLoading,
  error,
  suggestions,
} = useMedicineFetcher();
```

#### `fetchMedicineImage(name)` - Utility Function

```typescript
import { fetchMedicineImage } from "@/shared/utils/medicineFetcher";

const file: File | null = await fetchMedicineImage("Paracetamol");
// Returns File object (in memory) or null if not found
```

### Server-side

#### `fetchMedicineImageBuffer(name)` - Server Utility

```typescript
import { fetchMedicineImageBuffer } from "@/shared/utils/medicineFetcherServer";

const imageBuffer: ImageBuffer | null =
  await fetchMedicineImageBuffer("Paracetamol");
// Returns { buffer: Buffer, contentType: string, fileName: string }
```

---

## API Endpoint

### GET `/api/medicines/fetch-image`

**Query Parameters:**

- `medicineName` (required) - Name of medicine
- `action` - Either `image` or `suggestions`

**Examples:**

```bash
# Get suggestions
GET /api/medicines/fetch-image?medicineName=Paracetamol&action=suggestions

# Get image directly
GET /api/medicines/fetch-image?medicineName=Paracetamol&action=image
```

---

## Quick Reference

### ✅ Do This:

```typescript
// 1. Fetch image (in memory)
const file = await fetchMedicineImage(name);

// 2. Upload to MediaService (permanent storage)
const url = await MediaService.upload(file);

// 3. Save URL to database
await saveMedicine({ name, image: url });
```

### ❌ Don't Do This:

```typescript
// ❌ Wrong: File not stored anywhere
const file = await fetchMedicineImage(name);
await saveMedicine({ name, image: file }); // File object can't be saved!

// ❌ Wrong: Skipping upload step
const file = await fetchMedicineImage(name);
// File disappears when page reloads!
```

---

## PharmEasy API Response Structure

```json
{
  "status": 1,
  "data": {
    "products": [
      {
        "productId": 5080,
        "name": "Tusq D Orange Flavour Strip Of 6 Lozenges",
        "subtitleText": "6 Lozenge(s) in Strip",
        "damImages": [
          {
            "url": "https://cdn01.pharmeasy.in/dam/products/...",
            "face": "front",
            "sequence": "2"
          }
        ]
      }
    ]
  }
}
```

The utility extracts the first available image from products with `damImages` array.

---

## Notes

1. **Memory Only**: File/Blob/Buffer objects exist only in memory
2. **Upload Required**: Must upload to MediaService to persist
3. **URL Storage**: Store the Cloudinary URL in database, not the File object
4. **Error Handling**: Always check if image fetch returns null
5. **API Source**: Images come from PharmEasy's public API

---

## Summary

**Medicine Fetcher = Image Downloader (Memory Only)**

To actually save images:

1. Fetch → `fetchMedicineImage(name)` → File in memory
2. Upload → `MediaService.upload(file)` → URL from Cloudinary
3. Save → Store URL in database → Permanent storage
