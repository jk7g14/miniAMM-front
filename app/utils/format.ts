import { formatUnits, parseUnits } from 'viem';

// Format bigint to human-readable string
export function formatTokenAmount(
  amount: bigint,
  decimals: number = 18,
  displayDecimals: number = 6
): string {
  const formatted = formatUnits(amount, decimals);
  const [whole, decimal] = formatted.split('.');

  if (!decimal) return whole;

  // Truncate to displayDecimals
  const truncatedDecimal = decimal.slice(0, displayDecimals);

  // Remove trailing zeros
  const cleanDecimal = truncatedDecimal.replace(/0+$/, '');

  return cleanDecimal ? `${whole}.${cleanDecimal}` : whole;
}

// Parse user input to bigint
export function parseTokenAmount(input: string, decimals: number = 18): bigint {
  if (!input || input === '.') return 0n;

  try {
    // Handle edge cases
    const cleanInput = input.replace(/[^\d.]/g, '');
    const parts = cleanInput.split('.');

    // Ensure only one decimal point
    if (parts.length > 2) throw new Error('Invalid input');

    // Limit decimal places to token decimals
    if (parts[1] && parts[1].length > decimals) {
      parts[1] = parts[1].slice(0, decimals);
    }

    const finalInput = parts.join('.');
    return parseUnits(finalInput, decimals);
  } catch {
    return 0n;
  }
}

// Format percentage
export function formatPercentage(value: number, decimals: number = 2): string {
  return `${value.toFixed(decimals)}%`;
}

// Shorten address for display
export function shortenAddress(address: string, chars: number = 4): string {
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

// Format USD value (placeholder - would need price feed)
export function formatUsdValue(
  amount: bigint,
  decimals: number = 18,
  tokenPrice: number = 0
): string {
  const value = Number(formatUnits(amount, decimals)) * tokenPrice;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
