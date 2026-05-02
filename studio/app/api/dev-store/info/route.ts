import { NextRequest, NextResponse } from "next/server";
import { networkInterfaces } from "os";

export async function GET(request: NextRequest) {
  const host = request.headers.get("host") ?? "localhost:3000";
  const proto = request.headers.get("x-forwarded-proto") ?? "http";

  const lanIPs: string[] = [];
  const nets = networkInterfaces();
  for (const iface of Object.values(nets)) {
    if (!iface) continue;
    for (const net of iface) {
      if (net.family === "IPv4" && !net.internal) {
        lanIPs.push(net.address);
      }
    }
  }

  const port = host.includes(":") ? host.split(":")[1] : "3000";
  const catalogPaths = lanIPs.map(
    (ip) => `${proto}://${ip}:${port}/api/dev-store/catalog`
  );

  return NextResponse.json({
    localhost_url: `${proto}://localhost:${port}/api/dev-store/catalog`,
    lan_ips: lanIPs,
    catalog_urls: catalogPaths,
    port,
  });
}
