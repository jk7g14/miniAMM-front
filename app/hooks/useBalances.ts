'use client';

import { useEffect } from 'react';
import { useAtom } from 'jotai';
import { useAccount } from 'wagmi';
import { useContracts } from './useContracts';
import {
  walletBalancesAtom,
  ammBalancesAtom,
  allowancesAtom,
  token0MetadataAtom,
  token1MetadataAtom,
  lpTokenMetadataAtom,
} from '@/app/atoms';

export function useBalances() {
  const { address } = useAccount();
  const contracts = useContracts();

  const [walletBalances, setWalletBalances] = useAtom(walletBalancesAtom);
  const [ammBalances, setAmmBalances] = useAtom(ammBalancesAtom);
  const [allowances, setAllowances] = useAtom(allowancesAtom);
  const [, setToken0Metadata] = useAtom(token0MetadataAtom);
  const [, setToken1Metadata] = useAtom(token1MetadataAtom);
  const [, setLPMetadata] = useAtom(lpTokenMetadataAtom);

  // Fetch all balances
  const fetchBalances = async () => {
    if (!contracts || !address) return;

    try {
      // Fetch wallet balances
      const [token0Balance, token1Balance, lpBalance] = await Promise.all([
        contracts.token0.balanceOf(address),
        contracts.token1.balanceOf(address),
        contracts.amm.balanceOf(address), // LP token balance
      ]);

      setWalletBalances({
        token0: BigInt(token0Balance.toString()),
        token1: BigInt(token1Balance.toString()),
        lpToken: BigInt(lpBalance.toString()),
      });

      // Fetch AMM reserves
      const [reserve0, reserve1] = await Promise.all([
        contracts.amm.xReserve(),
        contracts.amm.yReserve(),
      ]);
      setAmmBalances({
        token0: BigInt(reserve0.toString()),
        token1: BigInt(reserve1.toString()),
      });

      // Fetch allowances
      const [token0Allowance, token1Allowance] = await Promise.all([
        contracts.token0.allowance(address, contracts.amm.target),
        contracts.token1.allowance(address, contracts.amm.target),
      ]);

      setAllowances({
        token0: BigInt(token0Allowance.toString()),
        token1: BigInt(token1Allowance.toString()),
      });
    } catch (error) {
      // Silently handle balance fetch errors
    }
  };

  // Fetch token metadata once (works without wallet connection)
  const fetchMetadata = async () => {
    if (!contracts) return;

    try {
      console.log('🔍 Fetching token metadata...');

      // Fetch token0 metadata with individual error handling
      console.log('📝 Fetching token0 metadata...');
      const [name0, symbol0, decimals0] = await Promise.all([
        contracts.token0.name().catch((err) => {
          console.error('❌ Failed to fetch token0 name:', err);
          return 'Token A';
        }),
        contracts.token0.symbol().catch((err) => {
          console.error('❌ Failed to fetch token0 symbol:', err);
          return 'TKA';
        }),
        contracts.token0.decimals().catch((err) => {
          console.error('❌ Failed to fetch token0 decimals:', err);
          return 18n;
        }),
      ]);

      console.log(`✅ Token0: ${name0} (${symbol0}) - ${decimals0} decimals`);
      setToken0Metadata({
        name: name0,
        symbol: symbol0,
        decimals: Number(decimals0),
      });

      // Fetch token1 metadata with individual error handling
      console.log('📝 Fetching token1 metadata...');
      const [name1, symbol1, decimals1] = await Promise.all([
        contracts.token1.name().catch((err) => {
          console.error('❌ Failed to fetch token1 name:', err);
          return 'Token B';
        }),
        contracts.token1.symbol().catch((err) => {
          console.error('❌ Failed to fetch token1 symbol:', err);
          return 'TKB';
        }),
        contracts.token1.decimals().catch((err) => {
          console.error('❌ Failed to fetch token1 decimals:', err);
          return 18n;
        }),
      ]);

      console.log(`✅ Token1: ${name1} (${symbol1}) - ${decimals1} decimals`);
      setToken1Metadata({
        name: name1,
        symbol: symbol1,
        decimals: Number(decimals1),
      });

      // Fetch LP token metadata with individual error handling
      console.log('📝 Fetching LP token metadata...');
      const [nameLP, symbolLP, decimalsLP] = await Promise.all([
        contracts.amm.name().catch((err) => {
          console.error('❌ Failed to fetch LP name:', err);
          return 'MiniAMM LP';
        }),
        contracts.amm.symbol().catch((err) => {
          console.error('❌ Failed to fetch LP symbol:', err);
          return 'MINI-LP';
        }),
        contracts.amm.decimals().catch((err) => {
          console.error('❌ Failed to fetch LP decimals:', err);
          return 18n;
        }),
      ]);

      console.log(
        `✅ LP Token: ${nameLP} (${symbolLP}) - ${decimalsLP} decimals`
      );
      setLPMetadata({
        name: nameLP,
        symbol: symbolLP,
        decimals: Number(decimalsLP),
      });

      console.log('✅ All metadata fetched successfully!');
    } catch (error) {
      console.error('❌ Error fetching metadata:', error);
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          code: (error as unknown as { code?: string }).code,
          data: (error as unknown as { data?: unknown }).data,
          reason: (error as unknown as { reason?: string }).reason,
        });
      }
    }
  };

  // Fetch metadata when contracts are available (independent of wallet connection)
  useEffect(() => {
    if (contracts) {
      // Add a delay to allow connection to stabilize
      const timer = setTimeout(() => {
        fetchMetadata();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [contracts]);

  // Fetch balances when wallet is connected
  useEffect(() => {
    if (contracts && address) {
      fetchBalances();

      // Set up polling interval (every 10 seconds)
      const interval = setInterval(fetchBalances, 10000);

      return () => clearInterval(interval);
    }
  }, [contracts, address]);

  return {
    walletBalances,
    ammBalances,
    allowances,
    refetch: fetchBalances,
  };
}
