import { NextRequest, NextResponse } from "next/server";
import { uploadToCloudinary, type CloudinaryFolder } from "@/lib/cloudinary";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folderParam = formData.get("folder") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate type (images only)
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image files are allowed" },
        { status: 400 }
      );
    }

    // Validate size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size exceeds 5MB limit" },
        { status: 400 }
      );
    }

    // Match or fallback folder
    const validFolders: CloudinaryFolder[] = [
      "aayam/logos",
      "aayam/banners",
      "aayam/qr-codes",
      "aayam/payment-proofs",
      "aayam/events",
    ];

    const folder: CloudinaryFolder =
      folderParam && validFolders.includes(folderParam as any)
        ? (folderParam as CloudinaryFolder)
        : "aayam/payment-proofs";

    const result = await uploadToCloudinary(file, folder);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("API Upload error:", error);
    return NextResponse.json(
      { error: error?.message || "File upload failed" },
      { status: 500 }
    );
  }
}
