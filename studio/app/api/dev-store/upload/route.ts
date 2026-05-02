import { NextRequest, NextResponse } from "next/server";
import { put, del } from "@vercel/blob";

const BLOB_PREFIX = "dev-games";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const packageFile = formData.get("package") as File | null;
    const manifestStr = formData.get("manifest") as string | null;

    if (!packageFile || !manifestStr) {
      return NextResponse.json(
        { error: "Missing 'package' file or 'manifest' JSON." },
        { status: 400 }
      );
    }

    const manifest = JSON.parse(manifestStr) as Record<string, unknown>;
    const id = manifest.id as string;
    const version = manifest.version as string;

    if (!id || !version) {
      return NextResponse.json(
        { error: "Manifest must have 'id' and 'version' fields." },
        { status: 400 }
      );
    }

    const safeName = `${String(id).replace(/\./g, "-")}-${version}`;
    const okPathname = `${BLOB_PREFIX}/${safeName}.ok`;
    const manifestPathname = `${BLOB_PREFIX}/${safeName}.manifest.json`;

    const packageBuffer = Buffer.from(await packageFile.arrayBuffer());

    // Upload package to blob storage
    const blobResult = await put(okPathname, packageBuffer, {
      access: "public",
      contentType: "application/octet-stream",
    });

    const catalogEntry = {
      ...manifest,
      download_url: blobResult.url,
      size_bytes: packageBuffer.length,
      status: "available",
      hosted_at: new Date().toISOString(),
    };

    // Upload manifest to blob storage
    await put(manifestPathname, JSON.stringify(catalogEntry, null, 2), {
      access: "public",
      contentType: "application/json",
    });

    return NextResponse.json({
      ok: true,
      filename: `${safeName}.ok`,
      download_url: blobResult.url,
      size_bytes: packageBuffer.length,
    });
  } catch (err) {
    return NextResponse.json(
      { error: String(err instanceof Error ? err.message : err) },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
    },
  });
}
