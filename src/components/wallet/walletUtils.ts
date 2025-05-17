import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  getAccount,
} from '@solana/spl-token';
import { DEFAULT_NETWORK, NETWORKS, NetworkType } from './config';
import type { TokenInfo } from '../../types/blinks';

// Validate a Solana address
export function isValidSolanaAddress(address: string): boolean {
  try {
    if (!address) return false;
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

// Format SOL amount with proper decimal places
export function formatSolAmount(amount: number): string {
  return amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 5,
  });
}

// Format token balance based on decimals
export function formatTokenBalance(balance: number, decimals: number): string {
  if (decimals <= 6) {
    return balance.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: decimals,
    });
  } else {
    return balance.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    });
  }
}

// Format USD value
export function formatUsdValue(value: number): string {
  return value.toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// Get a connection to the Solana network
export function getConnection(network: NetworkType = DEFAULT_NETWORK) {
  const networkConfig = NETWORKS[network];
  
  try {
    return new Connection(networkConfig.endpoint, 'confirmed');
  } catch (error) {
    console.error('Error creating connection:', error);
    if (networkConfig.fallbackEndpoint) {
      console.log('Using fallback endpoint...');
      return new Connection(networkConfig.fallbackEndpoint, 'confirmed');
    }
    throw error;
  }
}

// Generate a new random keypair
export function generateKeypair() {
  return Keypair.generate();
}


// Request airdrop (for test networks)
export async function requestAirdrop(
  address: string,
  amount: number = 1, // Default 1 SOL
  network: NetworkType = DEFAULT_NETWORK,
) {
  if (network === 'mainnet-beta') {
    console.warn('Airdrop not available on mainnet');
    return null;
  }
  
  if (!isValidSolanaAddress(address)) {
    throw new Error('Invalid address');
  }
  
  try {
    const connection = getConnection(network);
    const publicKey = new PublicKey(address);
    const signature = await connection.requestAirdrop(
      publicKey,
      amount * LAMPORTS_PER_SOL
    );
    
    // Wait for confirmation
    await connection.confirmTransaction(signature);
    return signature;
  } catch (error) {
    console.error('Airdrop failed:', error);
    return null;
  }
}

// Truncate a Solana address for display
export function truncateAddress(address: string, prefixLength = 6, suffixLength = 4) {
  if (!address) return '';
  return `${address.slice(0, prefixLength)}...${address.slice(-suffixLength)}`;
}

// Export private key from keypair
export function exportPrivateKey(keypair: Keypair): string {
  return Buffer.from(keypair.secretKey).toString('hex');
}

// Import private key to create keypair
export function importPrivateKey(privateKeyHex: string): Keypair {
  const secretKey = Buffer.from(privateKeyHex, 'hex');
  return Keypair.fromSecretKey(secretKey);
}

// Export keypair as JSON for backup/storage
export function exportKeypairJson(keypair: Keypair) {
  return JSON.stringify({
    publicKey: keypair.publicKey.toString(),
    secretKey: Array.from(keypair.secretKey),
  });
}

// Import keypair from JSON
export function importKeypairJson(json: string){
  try {
    const { secretKey } = JSON.parse(json);
    return Keypair.fromSecretKey(Uint8Array.from(secretKey));
  } catch (error) {
    console.error('Failed to import keypair from JSON:', error);
    throw new Error('Invalid keypair JSON format');
  }
}

// Cache keys for local storage
const CACHE_KEYS = {
  KEYPAIR: 'wallet_keypair',
  NETWORK: 'wallet_network',
  CONNECTED: 'wallet_connected',
};

// Store keypair in browser local storage (encrypted in the future)
export function storeKeypairInCache(keypair: Keypair | null, network: string): void {
  try {
    if (!keypair) {
      localStorage.removeItem(CACHE_KEYS.KEYPAIR);
      localStorage.removeItem(CACHE_KEYS.CONNECTED);
      return;
    }
    
    const keypairJson = exportKeypairJson(keypair);
    localStorage.setItem(CACHE_KEYS.KEYPAIR, keypairJson);
    localStorage.setItem(CACHE_KEYS.NETWORK, network);
    localStorage.setItem(CACHE_KEYS.CONNECTED, 'true');
  } catch (error) {
    console.error('Failed to store keypair in cache:', error);
  }
}

// Retrieve keypair from browser local storage
export function getKeypairFromCache(): { 
  keypair: Keypair | null;
  network: string | null;
  wasConnected: boolean;
} {
  try {
    const keypairJson = localStorage.getItem(CACHE_KEYS.KEYPAIR);
    const network = localStorage.getItem(CACHE_KEYS.NETWORK);
    const wasConnected = localStorage.getItem(CACHE_KEYS.CONNECTED) === 'true';
    
    if (!keypairJson) {
      return { keypair: null, network, wasConnected };
    }
    
    const keypair = importKeypairJson(keypairJson);
    return { keypair, network, wasConnected };
  } catch (error) {
    console.error('Failed to retrieve keypair from cache:', error);
    // Clear potentially corrupted data
    localStorage.removeItem(CACHE_KEYS.KEYPAIR);
    return { keypair: null, network: null, wasConnected: false };
  }
}

// Clear keypair from cache (for security)
export function clearKeypairCache(): void {
  localStorage.removeItem(CACHE_KEYS.KEYPAIR);
  localStorage.removeItem(CACHE_KEYS.NETWORK);
  localStorage.removeItem(CACHE_KEYS.CONNECTED);
}