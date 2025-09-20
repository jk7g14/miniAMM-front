import { atom } from 'jotai';
import { walletBalancesAtom } from './balances';

// AMM pool state
export interface PoolState {
  reserve0: bigint;
  reserve1: bigint;
  totalSupply: bigint; // Total LP token supply
}

export const poolStateAtom = atom<PoolState>({
  reserve0: 0n,
  reserve1: 0n,
  totalSupply: 0n,
});

// Calculated values
export const poolRatioAtom = atom((get) => {
  const { reserve0, reserve1 } = get(poolStateAtom);
  if (reserve0 === 0n || reserve1 === 0n) return 0;

  // Calculate price of token0 in terms of token1
  return Number(reserve1) / Number(reserve0);
});

// User's pool share
export const userPoolShareAtom = atom((get) => {
  const { totalSupply } = get(poolStateAtom);
  const { lpToken } = get(walletBalancesAtom);

  if (totalSupply === 0n) return 0;

  // Calculate percentage share (with 2 decimal precision)
  return (Number(lpToken) * 100) / Number(totalSupply);
});

// Swap calculation helper - matches MiniAMM.sol exactly
export const calculateSwapOutputAtom = atom((get) => {
  return (
    inputAmount: bigint,
    inputReserve: bigint,
    outputReserve: bigint
  ): bigint => {
    if (inputAmount === 0n || inputReserve === 0n || outputReserve === 0n) {
      return 0n;
    }

    // Exact formula from MiniAMM.sol
    // amountInWithFee = inputAmount * 997
    // numerator = amountInWithFee * outputReserve
    // denominator = inputReserve * 1000 + amountInWithFee
    // output = numerator / denominator
    const amountInWithFee = inputAmount * 997n;
    const numerator = amountInWithFee * outputReserve;
    const denominator = inputReserve * 1000n + amountInWithFee;

    return numerator / denominator;
  };
});

// Price impact calculation
export const calculatePriceImpactAtom = atom((get) => {
  return (
    inputAmount: bigint,
    inputReserve: bigint,
    outputReserve: bigint
  ): number => {
    if (inputAmount === 0n || inputReserve === 0n || outputReserve === 0n) {
      return 0;
    }

    // Current price
    const currentPrice = Number(outputReserve) / Number(inputReserve);

    // Price after swap
    const outputAmount = get(calculateSwapOutputAtom)(
      inputAmount,
      inputReserve,
      outputReserve
    );
    const newInputReserve = Number(inputReserve) + Number(inputAmount);
    const newOutputReserve = Number(outputReserve) - Number(outputAmount);
    const newPrice = newOutputReserve / newInputReserve;

    // Price impact percentage
    return ((currentPrice - newPrice) / currentPrice) * 100;
  };
});
