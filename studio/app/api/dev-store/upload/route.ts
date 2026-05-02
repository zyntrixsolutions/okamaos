import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const DEV_GAMES_DIR = path.join(process.cwd(), "public", "dev-games");

export async function POST(request: NextRequest) {
  try {
    if (!existsSync(DEV_GAMES_DIR)) {
      await mkdir(DEV_GAMES_DIR, { recursive: true });
    }

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
    const okFilename = `${safeName}.ok`;
    const manifestFilename = `${safeName}.manifest.json`;

    const packageBuffer = Buffer.from(await packageFile.arrayBuffer());
    await writeFile(path.join(DEV_GAMES_DIR, okFilename), packageBuffer);

    const baseUrl = request.headers.get("host") ?? "localhost:3000";
    const proto = request.headers.get("x-forwarded-proto") ?? "http";
    const downloadUrl = `${proto}://${baseUrl}/dev-games/${okFilename}`;

    const catalogEntry = {
      ...manifest,
      download_url: downloadUrl,
      size_bytes: packageBuffer.length,
      status: "available",
      hosted_at: new Date().toISOString(),
    };

    await writeFile(
      path.join(DEV_GAMES_DIR, manifestFilename),
      JSON.stringify(catalogEntry, null, 2)
    );

    return NextResponse.json({
      ok: true,
      filename: okFilename,
      download_url: downloadUrl,
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
