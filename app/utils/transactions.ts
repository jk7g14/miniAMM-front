import { ethers, TransactionReceipt } from 'ethers';

// ethers v6 compatible transaction result interface
export interface TransactionResult {
  hash: string;
  wait: (confirmations?: number) => Promise<TransactionReceipt>;
  from?: string;
  to?: string;
  value?: bigint;
  gasLimit?: bigint;
  gasPrice?: bigint;
  nonce?: number;
}

// Wait for transaction with timeout (ethers v6 compatible)
export async function waitForTransaction(
  tx: TransactionResult,
  confirmations: number = 1,
  timeoutMs: number = 180000 // Increased to 3 minutes for testnet
): Promise<TransactionReceipt> {
  console.log('⏳ Waiting for transaction confirmation...', {
    hash: tx.hash,
    confirmations,
    timeoutMs: `${timeoutMs / 1000}s`,
  });

  // Create a more informative timeout
  let timeoutId: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      console.error(
        '❌ Transaction timeout after',
        timeoutMs / 1000,
        'seconds'
      );
      console.error('Transaction hash:', tx.hash);
      console.error('This might be due to network congestion or low gas fees');
      reject(
        new Error(
          `Transaction timeout after ${timeoutMs / 1000} seconds. Hash: ${
            tx.hash
          }`
        )
      );
    }, timeoutMs);
  });

  // Add periodic status updates
  const statusInterval = setInterval(() => {
    console.log('⏳ Still waiting for transaction...', {
      hash: tx.hash,
      elapsed: `${Math.floor(
        (Date.now() - (tx as any).timestamp || Date.now()) / 1000
      )}s`,
    });
  }, 15000); // Log every 15 seconds

  try {
    const receipt = await Promise.race([
      tx.wait(confirmations),
      timeoutPromise,
    ]);

    // Clear the status interval and timeout
    clearInterval(statusInterval);
    clearTimeout(timeoutId);

    console.log('✅ Transaction confirmed:', {
      hash: receipt.hash,
      status: receipt.status,
      gasUsed: receipt.gasUsed?.toString(),
      blockNumber: receipt.blockNumber,
      confirmations: receipt.confirmations,
      effectiveGasPrice: receipt.gasPrice?.toString(),
    });

    // In ethers v6, status 0 means failed, status 1 means success
    if (receipt.status === 0) {
      throw new Error('Transaction failed - reverted');
    }

    return receipt;
  } catch (error) {
    // Clear the status interval and timeout on error
    clearInterval(statusInterval);
    clearTimeout(timeoutId);

    console.error('❌ Transaction error:', error);

    // If it's a timeout, provide helpful information
    if (error instanceof Error && error.message.includes('timeout')) {
      console.error('💡 Troubleshooting tips:');
      console.error(
        '1. Check if transaction is still pending on block explorer'
      );
      console.error('2. Network might be congested - try again later');
      console.error('3. Consider increasing gas price for faster confirmation');
      console.error(
        `4. Explorer: https://coston2-explorer.flare.network/tx/${tx.hash}`
      );
    }

    throw error;
  }
}

// Type guard for error objects
function isErrorWithCode(error: unknown): error is { code: string | number } {
  return typeof error === 'object' && error !== null && 'code' in error;
}

function isErrorWithMessage(error: unknown): error is { message: string } {
  return typeof error === 'object' && error !== null && 'message' in error;
}

function isErrorWithReason(error: unknown): error is { reason: string } {
  return typeof error === 'object' && error !== null && 'reason' in error;
}

function isErrorWithData(error: unknown): error is { data: string } {
  return typeof error === 'object' && error !== null && 'data' in error;
}

// Parse error messages with ethers v6 error handling
export function parseTransactionError(error: unknown): string {
  console.log('🔍 Parsing transaction error:', error);

  // ethers v6 error codes
  if (
    isErrorWithCode(error) &&
    (error.code === 'ACTION_REJECTED' || error.code === 4001)
  ) {
    return 'Transaction rejected by user';
  }

  // Handle viem UserRejectedRequestError
  if (
    isErrorWithMessage(error) &&
    error.message.includes('User rejected the request')
  ) {
    return 'Transaction rejected by user';
  }

  if (
    isErrorWithMessage(error) &&
    error.message.includes('User denied request signature')
  ) {
    return 'Transaction rejected by user';
  }

  // Handle UserRejectedRequestError by name
  if (
    error &&
    typeof error === 'object' &&
    'name' in error &&
    error.name === 'UserRejectedRequestError'
  ) {
    return 'Transaction rejected by user';
  }

  if (
    isErrorWithCode(error) &&
    (error.code === 'INSUFFICIENT_FUNDS' || error.code === -32000)
  ) {
    return 'Insufficient funds for transaction';
  }

  // Network connection errors
  if (
    isErrorWithCode(error) &&
    (error.code === 'NETWORK_ERROR' || error.code === 'SERVER_ERROR')
  ) {
    return 'Network error. Please check your connection and try again.';
  }

  // Timeout errors
  if (isErrorWithCode(error) && error.code === 'TIMEOUT') {
    return 'Transaction timeout. Please try again.';
  }

  // Check for unknown account error (common with wallet connection issues)
  if (isErrorWithMessage(error) && error.message.includes('unknown account')) {
    return 'Wallet not properly connected. Please reconnect your wallet.';
  }

  // Check for network errors
  if (isErrorWithMessage(error) && error.message.includes('Failed to fetch')) {
    return 'Network error. Please check your connection and try again.';
  }

  // Check for gas estimation errors
  if (
    isErrorWithMessage(error) &&
    error.message.includes('cannot estimate gas')
  ) {
    return 'Transaction would fail. Please check your inputs and try again.';
  }

  // Check for nonce errors
  if (isErrorWithMessage(error) && error.message.includes('nonce')) {
    return 'Transaction nonce error. Please try again.';
  }

  // ethers v6 revert reason handling
  if (isErrorWithReason(error)) {
    return error.reason;
  }

  // Contract revert messages
  if (isErrorWithData(error) && typeof error.data === 'string') {
    try {
      // Try to decode revert reason from error data
      const decoded = ethers.toUtf8String(error.data);
      if (decoded) {
        return `Contract error: ${decoded}`;
      }
    } catch {
      // If decoding fails, continue to other error handling
    }
  }

  if (isErrorWithMessage(error)) {
    // Extract revert reason if present
    const revertMatch = error.message.match(
      /reverted with reason string '(.+)'/
    );
    if (revertMatch) {
      return revertMatch[1];
    }

    // Check for common patterns
    if (error.message.includes('insufficient funds')) {
      return 'Insufficient funds';
    }

    if (error.message.includes('user rejected')) {
      return 'Transaction rejected';
    }

    if (error.message.includes('timeout')) {
      return 'Transaction timeout. Please try again.';
    }

    if (error.message.includes('replacement fee too low')) {
      return 'Transaction replacement fee too low. Please try again.';
    }

    // Return first 150 characters of error message
    return error.message.length > 150
      ? error.message.substring(0, 150) + '...'
      : error.message;
  }

  return 'Transaction failed';
}

// Calculate deadline for transactions (10 minutes from now)
export function getDeadline(): bigint {
  return BigInt(Math.floor(Date.now() / 1000) + 600);
}

// Calculate minimum amount with slippage (ethers v6 BigInt compatible)
export function calculateMinimumAmount(
  amount: bigint,
  slippagePercent: number
): bigint {
  const slippageBps = BigInt(Math.floor(slippagePercent * 100)); // Convert to basis points
  return (amount * (10000n - slippageBps)) / 10000n;
}

// Format transaction hash for display
export function formatTxHash(hash: string): string {
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
}

// Check if error is user rejection
export function isUserRejection(error: unknown): boolean {
  return (
    (isErrorWithCode(error) &&
      (error.code === 'ACTION_REJECTED' || error.code === 4001)) ||
    (isErrorWithMessage(error) && error.message.includes('user rejected')) ||
    (isErrorWithMessage(error) &&
      error.message.includes('User rejected the request')) ||
    (isErrorWithMessage(error) &&
      error.message.includes('User denied request signature')) ||
    (error &&
      typeof error === 'object' &&
      'name' in error &&
      error.name === 'UserRejectedRequestError')
  );
}

// Get explorer URL for transaction
export function getExplorerUrl(hash: string, chainId: number): string {
  // Flare Coston2 explorer
  if (chainId === 114) {
    return `https://coston2-explorer.flare.network/tx/${hash}`;
  }

  return `https://etherscan.io/tx/${hash}`;
}
