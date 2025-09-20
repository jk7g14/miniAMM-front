import { atom } from 'jotai';

// Token balances in wallet
export interface TokenBalances {
  token0: bigint;
  token1: bigint;
  lpToken: bigint;
}

export const walletBalancesAtom = atom<TokenBalances>({
  token0: 0n,
  token1: 0n,
  lpToken: 0n,
});

// Token balances in AMM contract
export const ammBalancesAtom = atom<{
  token0: bigint;
  token1: bigint;
}>({
  token0: 0n,
  token1: 0n,
});

// User's allowances for AMM contract
export const allowancesAtom = atom<{
  token0: bigint;
  token1: bigint;
}>({
  token0: 0n,
  token1: 0n,
});

// Token metadata
export interface TokenMetadata {
  name: string;
  symbol: string;
  decimals: number;
}

export const token0MetadataAtom = atom<TokenMetadata>({
  name: 'Token A',
  symbol: 'TKA',
  decimals: 18,
});

export const token1MetadataAtom = atom<TokenMetadata>({
  name: 'Token B',
  symbol: 'TKB',
  decimals: 18,
});

export const lpTokenMetadataAtom = atom<TokenMetadata>({
  name: 'MiniAMM LP Token',
  symbol: 'MINI-LP',
  decimals: 18,
});
