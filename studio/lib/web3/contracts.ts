import type { Address } from "viem";

export const OKTOKEN_ABI = [
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "totalSupply",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "symbol",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "decimals",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
  },
] as const;

export const OKASSETS_ABI = [
  {
    type: "function",
    name: "balanceOf",
    inputs: [
      { name: "account", type: "address" },
      { name: "id", type: "uint256" },
    ],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "balanceOfBatch",
    inputs: [
      { name: "accounts", type: "address[]" },
      { name: "ids", type: "uint256[]" },
    ],
    outputs: [{ name: "", type: "uint256[]" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "uri",
    inputs: [{ name: "id", type: "uint256" }],
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
  },
] as const;

export type ContractAddresses = {
  okToken: Address;
  okAssets: Address;
};

const ZERO: Address = "0x0000000000000000000000000000000000000000";

export const DEFAULT_ADDRESSES: Record<string, ContractAddresses> = {
  base: { okToken: ZERO, okAssets: ZERO },
  "base-sepolia": { okToken: ZERO, okAssets: ZERO },
};

export function getContractAddresses(network: string): ContractAddresses {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("okama-web3-contract-addresses");
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Record<string, ContractAddresses>;
        if (parsed[network]) return parsed[network];
      } catch {}
    }
  }
  return DEFAULT_ADDRESSES[network] ?? DEFAULT_ADDRESSES["base"];
}

export function saveContractAddresses(
  network: string,
  addresses: ContractAddresses
): void {
  if (typeof window === "undefined") return;
  let all: Record<string, ContractAddresses> = {};
  const stored = localStorage.getItem("okama-web3-contract-addresses");
  if (stored) {
    try { all = JSON.parse(stored); } catch {}
  }
  all[network] = addresses;
  localStorage.setItem("okama-web3-contract-addresses", JSON.stringify(all));
}
