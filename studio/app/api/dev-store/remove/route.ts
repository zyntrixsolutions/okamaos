import { NextRequest, NextResponse } from "next/server";
import { unlink } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const DEV_GAMES_DIR = path.join(process.cwd(), "public", "dev-games");

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name");

  if (!name || name.includes("..") || name.includes("/")) {
    return NextResponse.json({ error: "Invalid name." }, { status: 400 });
  }

  const okPath = path.join(DEV_GAMES_DIR, `${name}.ok`);
  const mfPath = path.join(DEV_GAMES_DIR, `${name}.manifest.json`);

  let removed = 0;
  for (const p of [okPath, mfPath]) {
    if (existsSync(p)) {
      await unlink(p);
      removed++;
    }
  }

  return NextResponse.json({ ok: true, removed });
}
