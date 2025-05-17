import {
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction,
  SystemProgram,
  Transaction,
  ComputeBudgetProgram,
  TransactionExpiredBlockheightExceededError,
  Connection,
  Commitment,
} from "@solana/web3.js";
import { DEFAULT_NETWORK, NetworkType } from "./config";
import { Keypair, PublicKey } from "@solana/web3.js";
import { isValidSolanaAddress } from "./walletUtils";
import { getConnection } from "./walletUtils";

// Constants for transaction optimization
const DEFAULT_PRIORITY_FEE = 20000; // microLamports
const DEFAULT_COMPUTE_UNITS = 200000;
const MAX_RETRIES = 3;
const CONFIRMATION_TIMEOUT = 30000; // 30 seconds

// Enhanced token transfer with error handling and retries
export async function createTokenTransferTransaction(
  from: Keypair,
  to: string,
  tokenMintAddress: string,
  amount: number,
  decimals: number,
  network: NetworkType = DEFAULT_NETWORK,
  priorityFee: number = DEFAULT_PRIORITY_FEE
) {
  // Validate addresses
  if (!isValidSolanaAddress(to)) {
    throw new Error("Invalid destination address");
  }
  if (!isValidSolanaAddress(tokenMintAddress)) {
    throw new Error("Invalid token mint address");
  }

  try {
    const connection = getConnection(network);
    const fromPublicKey = from.publicKey;
    const toPublicKey = new PublicKey(to);
    const mintPublicKey = new PublicKey(tokenMintAddress);

    // Import required functions from spl-token
    const {
      createTransferInstruction,
      getAssociatedTokenAddress,
      getAccount,
      createAssociatedTokenAccountInstruction,
      getAssociatedTokenAddressSync,
    } = await import("@solana/spl-token");

    // Get source token account
    const sourceTokenAccount = await getAssociatedTokenAddress(
      mintPublicKey,
      fromPublicKey
    );

    // Check if source account exists and has sufficient balance
    const sourceAccountInfo = await getAccount(connection, sourceTokenAccount);
    const tokenAmount = BigInt(Math.floor(amount * Math.pow(10, decimals)));

    if (sourceAccountInfo.amount < tokenAmount) {
      throw new Error(
        `Insufficient token balance. Available: ${sourceAccountInfo.amount}, Required: ${tokenAmount}`
      );
    }

    // Get or create destination token account
    const destinationTokenAccount = await getAssociatedTokenAddress(
      mintPublicKey,
      toPublicKey
    );

    // Start building the transaction
    const transaction = new Transaction();

    // Add priority fee
    transaction.add(
      ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: priorityFee,
      })
    );

    // Add compute budget
    transaction.add(
      ComputeBudgetProgram.setComputeUnitLimit({
        units: DEFAULT_COMPUTE_UNITS,
      })
    );

    // Check if destination token account exists
    try {
      await getAccount(connection, destinationTokenAccount);
    } catch (error) {
      // If the account doesn't exist, add instruction to create it
      console.log("Creating destination token account...");
      transaction.add(
        createAssociatedTokenAccountInstruction(
          fromPublicKey, // payer
          destinationTokenAccount, // associated token account
          toPublicKey, // owner
          mintPublicKey // mint
        )
      );
    }

    // Add transfer instruction
    transaction.add(
      createTransferInstruction(
        sourceTokenAccount, // source
        destinationTokenAccount, // destination
        fromPublicKey, // owner
        tokenAmount // amount
      )
    );

    // Get the latest blockhash with proper commitment
    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash("confirmed");
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = fromPublicKey;

    // Store lastValidBlockHeight for later confirmation
    (transaction as any).lastValidBlockHeight = lastValidBlockHeight;

    return transaction;
  } catch (error) {
    console.error("Error creating token transfer transaction:", error);
    throw error;
  }
}

// Enhanced SOL transfer with proper error handling
export async function createTransferTransaction(
  from: Keypair,
  to: string,
  amount: number,
  network: NetworkType = DEFAULT_NETWORK,
  priorityFee: number = DEFAULT_PRIORITY_FEE
) {
  if (!isValidSolanaAddress(to)) {
    throw new Error("Invalid recipient address");
  }

  if (amount <= 0) {
    throw new Error("Transfer amount must be greater than 0");
  }

  try {
    const connection = getConnection(network);
    const toPublicKey = new PublicKey(to);

    // Check sender balance
    const balance = await connection.getBalance(from.publicKey);
    const requiredLamports = amount * LAMPORTS_PER_SOL;

    if (balance < requiredLamports) {
      throw new Error(
        `Insufficient SOL balance. Available: ${
          balance / LAMPORTS_PER_SOL
        } SOL, Required: ${amount} SOL`
      );
    }

    const transaction = new Transaction();

    // Add priority fee
    transaction.add(
      ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: priorityFee,
      })
    );

    // Add transfer instruction
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: from.publicKey,
        toPubkey: toPublicKey,
        lamports: requiredLamports,
      })
    );

    // Get the latest blockhash
    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash("confirmed");
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = from.publicKey;

    // Store lastValidBlockHeight for later confirmation
    (transaction as any).lastValidBlockHeight = lastValidBlockHeight;

    return transaction;
  } catch (error) {
    console.error("Error creating transfer transaction:", error);
    throw error;
  }
}

// Enhanced transaction sending with retries and proper confirmation
export async function sendTransaction(
  transaction: Transaction,
  signers: Keypair[],
  network: NetworkType = DEFAULT_NETWORK,
  commitment: Commitment = "confirmed"
) {
  const connection = getConnection(network);

  return await sendTransactionWithRetry(
    connection,
    transaction,
    signers,
    commitment
  );
}

// Retry logic for transaction sending
async function sendTransactionWithRetry(
  connection: Connection,
  transaction: Transaction,
  signers: Keypair[],
  commitment: Commitment = "confirmed",
  maxRetries: number = MAX_RETRIES
): Promise<string> {
  let retries = 0;
  let lastError: Error | undefined;

  while (retries < maxRetries) {
    try {
      if (retries > 0) {
        // Refresh blockhash on retry
        console.log(`Retry attempt ${retries} - refreshing blockhash...`);
        const { blockhash, lastValidBlockHeight } =
          await connection.getLatestBlockhash(commitment);
        transaction.recentBlockhash = blockhash;
        (transaction as any).lastValidBlockHeight = lastValidBlockHeight;
      }

      // Simulate transaction first to catch any errors early
      const simulation = await connection.simulateTransaction(transaction);
      if (simulation.value.err) {
        throw new Error(
          `Transaction simulation failed: ${JSON.stringify(
            simulation.value.err
          )}`
        );
      }

      // Send and confirm the transaction
      const signature = await sendAndConfirmTransaction(
        connection,
        transaction,
        signers,
        {
          commitment,
          maxRetries: Math.floor(maxRetries / 2),
          skipPreflight: false,
          preflightCommitment: commitment,
        }
      );

      console.log(`Transaction confirmed with signature: ${signature}`);
      return signature;
    } catch (error) {
      console.warn(`Transaction attempt ${retries + 1} failed:`, error);
      lastError = error as Error;

      // Check if error is due to blockhash expiration
      if (error instanceof TransactionExpiredBlockheightExceededError) {
        console.log("Blockhash expired, retrying with new blockhash...");
      } else if ((error as Error).toString().includes("BlockhashNotFound")) {
        console.log("Blockhash not found, retrying with new blockhash...");
      } else if ((error as Error).toString().includes("AlreadyInFlight")) {
        // Transaction might already be processing
        console.log("Transaction may already be in flight, checking status...");
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } else {
        // Don't retry certain errors
        const nonRetryableErrors = [
          "insufficient funds",
          "invalid account",
          "invalid instruction",
          "custom program error",
          "account not found",
        ];

        const errorStr = (error as Error).toString().toLowerCase();
        if (nonRetryableErrors.some((msg) => errorStr.includes(msg))) {
          throw error;
        }
      }

      // Exponential backoff between retries
      const delay = Math.min(1000 * Math.pow(2, retries), 5000);
      console.log(`Waiting ${delay}ms before retry...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      retries++;
    }
  }

  throw new Error(
    `Transaction failed after ${maxRetries} attempts: ${
      lastError?.message || "Unknown error"
    }`
  );
}

// Utility function to monitor transaction status
export async function monitorTransactionStatus(
  connection: Connection,
  signature: string,
  timeout: number = CONFIRMATION_TIMEOUT
): Promise<{ status: "confirmed" | "finalized" | "failed"; error?: string }> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const status = await connection.getSignatureStatus(signature);

    if (status?.value) {
      if (status.value.err) {
        return { status: "failed", error: JSON.stringify(status.value.err) };
      }

      if (
        status.value.confirmationStatus === "confirmed" ||
        status.value.confirmationStatus === "finalized"
      ) {
        return { status: status.value.confirmationStatus };
      }
    }

    // Wait before checking again
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error(`Transaction confirmation timeout after ${timeout}ms`);
}

// Batch transaction helper for multiple operations
export async function createBatchTransaction(
  instructions: any[],
  feePayer: Keypair,
  network: NetworkType = DEFAULT_NETWORK,
  priorityFee: number = DEFAULT_PRIORITY_FEE
): Promise<Transaction> {
  const connection = getConnection(network);
  const transaction = new Transaction();

  // Add priority fee
  transaction.add(
    ComputeBudgetProgram.setComputeUnitPrice({
      microLamports: priorityFee,
    })
  );

  // Add all instructions
  instructions.forEach((instruction) => transaction.add(instruction));

  // Get blockhash
  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash("confirmed");
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = feePayer.publicKey;
  (transaction as any).lastValidBlockHeight = lastValidBlockHeight;

  return transaction;
}

// Helper to estimate transaction fee
export async function estimateTransactionFee(
  transaction: Transaction,
  network: NetworkType = DEFAULT_NETWORK
): Promise<number> {
  const connection = getConnection(network);
  const message = transaction.compileMessage();
  const fee = await connection.getFeeForMessage(message, "confirmed");

  if (fee.value === null) {
    throw new Error("Unable to estimate transaction fee");
  }

  return fee.value;
}
