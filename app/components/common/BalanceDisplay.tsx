'use client';

import { useAtom } from 'jotai';
import { Card } from './Card';
import {
  walletBalancesAtom,
  token0MetadataAtom,
  token1MetadataAtom,
  lpTokenMetadataAtom,
  poolStateAtom,
  userPoolShareAtom,
} from '@/app/atoms';
import { formatTokenAmount, formatPercentage } from '@/app/utils/format';

export function BalanceDisplay() {
  const [walletBalances] = useAtom(walletBalancesAtom);
  const [token0Metadata] = useAtom(token0MetadataAtom);
  const [token1Metadata] = useAtom(token1MetadataAtom);
  const [lpTokenMetadata] = useAtom(lpTokenMetadataAtom);
  const [poolState] = useAtom(poolStateAtom);
  const [userPoolShare] = useAtom(userPoolShareAtom);

  // Calculate underlying value of LP tokens
  const lpToken0Value =
    poolState.totalSupply > 0n
      ? (walletBalances.lpToken * poolState.reserve0) / poolState.totalSupply
      : 0n;

  const lpToken1Value =
    poolState.totalSupply > 0n
      ? (walletBalances.lpToken * poolState.reserve1) / poolState.totalSupply
      : 0n;

  return (
    <Card title="Your Balances" subtitle="Token balances in your wallet">
      <div className="space-y-4">
        {/* Token balances */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div>
              <div className="font-medium">{token0Metadata.symbol}</div>
              <div className="text-xs text-neutral-dark/60">
                {token0Metadata.name}
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono font-medium">
                {formatTokenAmount(
                  walletBalances.token0,
                  token0Metadata.decimals
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div>
              <div className="font-medium">{token1Metadata.symbol}</div>
              <div className="text-xs text-neutral-dark/60">
                {token1Metadata.name}
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono font-medium">
                {formatTokenAmount(
                  walletBalances.token1,
                  token1Metadata.decimals
                )}
              </div>
            </div>
          </div>
        </div>

        {/* LP Token section */}
        {walletBalances.lpToken > 0n && (
          <>
            <div className="border-t border-neutral-dark/10 pt-4">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <div className="font-medium">{lpTokenMetadata.symbol}</div>
                  <div className="text-xs text-neutral-dark/60">
                    Liquidity Position
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-medium">
                    {formatTokenAmount(
                      walletBalances.lpToken,
                      lpTokenMetadata.decimals
                    )}
                  </div>
                  <div className="text-xs text-neutral-dark/60">
                    {formatPercentage(userPoolShare)} of pool
                  </div>
                </div>
              </div>

              {/* LP token value breakdown */}
              <div className="bg-neutral-dark/5 rounded-lg p-3 space-y-2">
                <div className="text-xs font-medium text-neutral-dark/60 mb-2">
                  Underlying Assets
                </div>
                <div className="flex justify-between text-sm">
                  <span>{token0Metadata.symbol}</span>
                  <span className="font-mono">
                    {formatTokenAmount(lpToken0Value, token0Metadata.decimals)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>{token1Metadata.symbol}</span>
                  <span className="font-mono">
                    {formatTokenAmount(lpToken1Value, token1Metadata.decimals)}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* No LP tokens message */}
        {walletBalances.lpToken === 0n && poolState.totalSupply > 0n && (
          <div className="text-sm text-neutral-dark/50 text-center py-2">
            Add liquidity to earn LP tokens and trading fees
          </div>
        )}
      </div>
    </Card>
  );
}
