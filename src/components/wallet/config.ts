import { Cluster, clusterApiUrl } from '@solana/web3.js';
// const { Cluster, clusterApiUrl } = require('@solana/web3.js');
import process from 'process';
// Network configuration
export type NetworkType = 'mainnet-beta' | 'testnet' | 'devnet' | 'custom';

export interface NetworkConfig {
  name: string;
  endpoint: string;
  cluster: Cluster | 'custom';
  explorerUrl: string;
  fallbackEndpoint?: string;
}

// const HELIUS_API_KEY = process.env.HELIUS_API_KEY;
const HELIUS_API_KEY = 'f1c97737-8d9c-426f-b59c-28b6b3f83200';

export const NETWORKS: Record<NetworkType, NetworkConfig> = {
  'mainnet-beta': {
    name: 'Mainnet Beta',
    // endpoint: 'https://api.mainnet-beta.solana.com',
    // Using Helius RPC endpoint as fallback
    endpoint: 'https://rpc.helius.xyz/?api-key=' + HELIUS_API_KEY,
    cluster: 'mainnet-beta',
    explorerUrl: 'https://explorer.solana.com',
  },
  'testnet': {
    name: 'Testnet',
    endpoint: 'https://api.testnet.solana.com',
    cluster: 'testnet',
    explorerUrl: 'https://explorer.solana.com',
  },
  'devnet': {
    name: 'Devnet',
    endpoint: 'https://api.devnet.solana.com',
    cluster: 'devnet',
    explorerUrl: 'https://explorer.solana.com',
  },
  'custom': {
    name: 'Custom',
    endpoint: '',
    cluster: 'custom',
    explorerUrl: 'https://explorer.solana.com',
  },
};

// Default network to use
export const DEFAULT_NETWORK: NetworkType = 'mainnet-beta';

// SOL token constants
export const LAMPORTS_PER_SOL = 1_000_000_000; // 1 SOL = 1 billion lamports

// Explorer URL builders
export function getAddressExplorerUrl(address: string, network: NetworkType = DEFAULT_NETWORK): string {
  return `${NETWORKS[network].explorerUrl}/address/${address}?cluster=${NETWORKS[network].cluster}`;
}

export function getTransactionExplorerUrl(signature: string, network: NetworkType = DEFAULT_NETWORK): string {
  return `${NETWORKS[network].explorerUrl}/tx/${signature}?cluster=${NETWORKS[network].cluster}`;
}

// Utility function to truncate addresses for display
export function truncateAddress(address: string, startChars = 4, endChars = 4): string {
  if (!address) return '';
  if (address.length <= startChars + endChars) return address;
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}