import { DEFAULT_NETWORK } from "./config";
import { isValidSolanaAddress } from "./walletUtils";
import {
  LAMPORTS_PER_SOL,
  AccountInfo,
  ParsedAccountData,
} from "@solana/web3.js";
import { PublicKey } from "@solana/web3.js";
import { getConnection } from "./walletUtils";
import { NetworkType } from "./config";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { TokenInfo } from "../../types/blinks";
import type { ParsedCoinDataMap } from "../../types/prices";
import { BACKEND_API_URL } from "../../config";

const SOL_ADDRESS = "So11111111111111111111111111111111111111112";
const SOL_MOCK = {
  symbol: "SOL",
  name: "Solana",
  balance: 0,
  usdValue: 0,
  address: SOL_ADDRESS,
  decimals: 9,
  logoUrl: "https://raw.githubusercontent.com/github/explore/14191328e15689ba52d5c10e18b43417bf79b2ef/topics/solana/solana.png",
};

// Get balance for a wallet address
export async function getBalanceViaRpc(
  address: string,
  network: NetworkType = DEFAULT_NETWORK
) {
  if (!address || !isValidSolanaAddress(address)) {
    throw new Error("Invalid address");
  }

  try {
    const connection = getConnection(network);
    const publicKey = new PublicKey(address);
    const balance = await connection.getBalance(publicKey);

    // Convert lamports to SOL
    return balance / LAMPORTS_PER_SOL;
  } catch (error) {
    console.error("Failed to get balance via web3.js:", error);
    throw error;
  }
}

// Fetch token balances for an address
export async function getTokenBalances(
  address: string,
  network: NetworkType = DEFAULT_NETWORK
) {
  try {
    if (!isValidSolanaAddress(address)) {
      throw new Error("Invalid wallet address");
    }

    console.log(
      `Fetching token balances for address ${address} on network ${network}`
    );
    const connection = getConnection(network);
    const ownerPublicKey = new PublicKey(address);

    // Get SOL balance first
    const solBalance =
      (await connection.getBalance(ownerPublicKey)) / LAMPORTS_PER_SOL;
    console.log(`SOL balance: ${solBalance}`);

    // Fetch token accounts owned by this address
    console.log("Fetching token accounts...");
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      ownerPublicKey,
      { programId: TOKEN_PROGRAM_ID }
    );
    console.log(`Found ${tokenAccounts.value.length} token accounts`);

    const addresses = [
      SOL_MOCK.address,
      ...tokenAccounts.value.map(
        (account) => account.account.data.parsed.info.mint
      ),
    ];
    if (!addresses.length) {
      return [];
    }
    // Fetch current token prices from an API (simplified version here)
    const tokenPrices = await getTokenPrices(addresses);
    console.log("Token prices:", tokenPrices);
    console.log("Type of tokenPrices:", typeof tokenPrices);

    const tokenInfos = convertTokenPricesToTokenInfo(
      tokenPrices,
      tokenAccounts.value,
      solBalance
    );
    console.log("Token infos:", tokenInfos);

    return tokenInfos;
  } catch (error) {
    console.error("Error getting token balances:", error);
    // Fall back to mock data in case of error
  }
}

export async function getTokenPrices(mint_addresses: string[]) {
  try {
    console.log(`BACKEND_API_URL: ${process.env.BACKEND_API_URL}`);
    if (!process.env.BACKEND_API_URL) {
      throw new Error("BACKEND_API_URL is not set");
    }
    const urlMock = `${process.env.BACKEND_API_URL}/wallet-prices`;
    // const urlMock = "http://localhost:3000/api/wallet-prices";
    console.log(`${urlMock}`);
    const response = await fetch(urlMock, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      mode: "cors",
      body: JSON.stringify({ smartContractAddresses: mint_addresses }),
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch token prices ${response}`);
    }
    const data = await response.json();
    // Convert plain object to Map
    return new Map(Object.entries(data)) as Map<string, ParsedCoinDataMap>;
  } catch (error) {
    throw new Error(`Failed to fetch token prices ${error}`);
  }
}

function convertTokenPricesToTokenInfo(
  tokenPrices: Map<string, ParsedCoinDataMap>,
  tokenAccounts: {
    pubkey: PublicKey;
    account: AccountInfo<ParsedAccountData>;
  }[],
  solBalance: number
) {
  const result: TokenInfo[] = [];

  for (const { account } of tokenAccounts) {
    const parsedInfo = account.data.parsed.info;
    const mintAddress = parsedInfo.mint;
    const tokenAmount = parsedInfo.tokenAmount;

    // Get price data from map using contract address
    const priceData = tokenPrices.get(mintAddress);
    if (!priceData) continue; // Skip if no price data found

    const balance =
      parseFloat(tokenAmount.amount) / Math.pow(10, tokenAmount.decimals);

    result.push({
      symbol: priceData.symbol,
      name: priceData.name,
      balance: balance,
      usdValue: balance * priceData.price,
      address: mintAddress,
      decimals: tokenAmount.decimals,
    });
  }

  const solPrice = tokenPrices.get(SOL_MOCK.address);
  if (solPrice) {
    result.push({
      symbol: SOL_MOCK.symbol,
      name: SOL_MOCK.name,
      balance: solBalance,
      usdValue: solBalance * solPrice.price,
      address: SOL_MOCK.address,
      decimals: SOL_MOCK.decimals,
      logoUrl: SOL_MOCK.logoUrl,
    });
  }

  return result;
}
