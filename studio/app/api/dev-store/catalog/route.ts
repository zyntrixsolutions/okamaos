import { NextResponse } from "next/server";
import { readdir, readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const DEV_GAMES_DIR = path.join(process.cwd(), "public", "dev-games");

export async function GET() {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Content-Type": "application/json",
  };

  if (!existsSync(DEV_GAMES_DIR)) {
    return NextResponse.json({ version: 1, games: [] }, { headers });
  }

  try {
    const files = await readdir(DEV_GAMES_DIR);
    const manifestFiles = files.filter((f) => f.endsWith(".manifest.json"));

    const games = await Promise.all(
      manifestFiles.map(async (mf) => {
        try {
          const raw = await readFile(path.join(DEV_GAMES_DIR, mf), "utf-8");
          return JSON.parse(raw);
        } catch {
          return null;
        }
      })
    );

    return NextResponse.json(
      { version: 1, games: games.filter(Boolean) },
      { headers }
    );
  } catch {
    return NextResponse.json({ version: 1, games: [] }, { headers });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
    },
  });
}
