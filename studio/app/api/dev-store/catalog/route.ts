import { NextResponse } from "next/server";
import { list } from "@vercel/blob";

const BLOB_PREFIX = "dev-games";

export async function GET() {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Content-Type": "application/json",
  };

  try {
    // List all blobs with the dev-games prefix
    const { blobs } = await list({ prefix: `${BLOB_PREFIX}/` });
    
    // Filter to only manifest files
    const manifestBlobs = blobs.filter((b) => 
      b.pathname.endsWith(".manifest.json")
    );

    // Fetch each manifest content
    const games = await Promise.all(
      manifestBlobs.map(async (blob) => {
        try {
          const response = await fetch(blob.url);
          if (!response.ok) return null;
          return await response.json();
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
