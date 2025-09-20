'use client';

import { useEffect } from 'react';
import { useAtom } from 'jotai';
import { useContracts } from './useContracts';
import { poolStateAtom } from '@/app/atoms';

export function usePoolState() {
  const contracts = useContracts();
  const [poolState, setPoolState] = useAtom(poolStateAtom);

  const fetchPoolState = async () => {
    if (!contracts) {
      return;
    }

    try {
      // Fetch reserves with individual error handling
      const [reserve0, reserve1, totalSupply] = await Promise.all([
        contracts.amm.xReserve().catch(() => 0n),
        contracts.amm.yReserve().catch(() => 0n),
        contracts.amm.totalSupply().catch(() => 0n),
      ]);

      setPoolState({
        reserve0,
        reserve1,
        totalSupply,
      });
    } catch (error) {
      // Set default values on error
      setPoolState({
        reserve0: 0n,
        reserve1: 0n,
        totalSupply: 0n,
      });
    }
  };

  useEffect(() => {
    // Add a small delay to allow connection to stabilize
    const timer = setTimeout(() => {
      fetchPoolState();
    }, 500);

    // Poll every 10 seconds
    const interval = setInterval(fetchPoolState, 10000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [contracts]);

  return {
    poolState,
    refetch: fetchPoolState,
  };
}
