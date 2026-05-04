import { createPublicClient, http } from "viem";
import { base, baseSepolia } from "viem/chains";

export type NetworkId = "base" | "base-sepolia";

export function getChain(network: NetworkId = "base") {
  return network === "base-sepolia" ? baseSepolia : base;
}

export function getNetworkFromSettings(): NetworkId {
  if (typeof window === "undefined") return "base";
  return (localStorage.getItem("okama-web3-network") as NetworkId) ?? "base";
}

export function getRpcUrl(network?: NetworkId): string {
  const net = network ?? getNetworkFromSettings();
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(`okama-web3-rpc-${net}`);
    if (stored) return stored;
  }
  return net === "base-sepolia"
    ? "https://sepolia.base.org"
    : "https://mainnet.base.org";
}

export function createClient(network?: NetworkId) {
  const net = network ?? getNetworkFromSettings();
  return createPublicClient({
    chain: getChain(net),
    transport: http(getRpcUrl(net)),
  });
}
