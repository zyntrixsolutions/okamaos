import { NextRequest, NextResponse } from "next/server";
import { del } from "@vercel/blob";

const BLOB_PREFIX = "dev-games";

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name");

  if (!name || name.includes("..") || name.includes("/")) {
    return NextResponse.json({ error: "Invalid name." }, { status: 400 });
  }

  const okPath = `${BLOB_PREFIX}/${name}.ok`;
  const mfPath = `${BLOB_PREFIX}/${name}.manifest.json`;

  let removed = 0;
  const errors: string[] = [];
  
  for (const pathname of [okPath, mfPath]) {
    try {
      await del(pathname);
      removed++;
    } catch (err) {
      // Blob may not exist, which is ok
      errors.push(String(err instanceof Error ? err.message : err));
    }
  }

  return NextResponse.json({ ok: true, removed });
}
