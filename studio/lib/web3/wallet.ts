import { createPublicClient, http, type Address } from "viem";
import { getChain, getRpcUrl, getNetworkFromSettings } from "./client";
import { OKTOKEN_ABI, OKASSETS_ABI, getContractAddresses } from "./contracts";

export function getStoredAddress(): Address | null {
  if (typeof window === "undefined") return null;
  const addr = localStorage.getItem("okama-web3-address");
  if (!addr || !addr.startsWith("0x")) return null;
  return addr as Address;
}

export function saveAddress(address: Address): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("okama-web3-address", address);
  }
}

export function clearWallet(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("okama-web3-address");
}

export async function getEthBalance(address: Address): Promise<bigint> {
  const net = getNetworkFromSettings();
  const client = createPublicClient({ chain: getChain(net), transport: http(getRpcUrl(net)) });
  return client.getBalance({ address });
}

export async function getOKTokenBalance(address: Address): Promise<bigint> {
  const net = getNetworkFromSettings();
  const { okToken } = getContractAddresses(net);
  const client = createPublicClient({ chain: getChain(net), transport: http(getRpcUrl(net)) });
  return client.readContract({
    address: okToken,
    abi: OKTOKEN_ABI,
    functionName: "balanceOf",
    args: [address],
  }) as Promise<bigint>;
}

export async function getOKAssetsBalance(
  address: Address,
  tokenId: bigint
): Promise<bigint> {
  const net = getNetworkFromSettings();
  const { okAssets } = getContractAddresses(net);
  const client = createPublicClient({ chain: getChain(net), transport: http(getRpcUrl(net)) });
  return client.readContract({
    address: okAssets,
    abi: OKASSETS_ABI,
    functionName: "balanceOf",
    args: [address, tokenId],
  }) as Promise<bigint>;
}

export function formatEther(wei: bigint): string {
  return (Number(wei) / 1e18).toFixed(6) + " ETH";
}

export function formatOK(units: bigint): string {
  return (Number(units) / 1e18).toFixed(2) + " OKT";
}
