'use client';

import { useAtom } from 'jotai';
import { Card } from './Card';
import {
  poolStateAtom,
  token0MetadataAtom,
  token1MetadataAtom,
  lpTokenMetadataAtom,
  poolRatioAtom,
} from '@/app/atoms';
import { formatTokenAmount } from '@/app/utils/format';

export function PoolInfo() {
  const [poolState] = useAtom(poolStateAtom);
  const [token0Metadata] = useAtom(token0MetadataAtom);
  const [token1Metadata] = useAtom(token1MetadataAtom);
  const [lpTokenMetadata] = useAtom(lpTokenMetadataAtom);
  const [poolRatio] = useAtom(poolRatioAtom);

  const isPoolEmpty = poolState.reserve0 === 0n && poolState.reserve1 === 0n;

  return (
    <Card title="Pool Information" subtitle="Current AMM pool state">
      <div className="space-y-4">
        {!isPoolEmpty ? (
          <>
            {/* Pool reserves */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-dark/60">
                  Total {token0Metadata.symbol}
                </span>
                <span className="font-mono font-medium">
                  {formatTokenAmount(
                    poolState.reserve0,
                    token0Metadata.decimals
                  )}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-dark/60">
                  Total {token1Metadata.symbol}
                </span>
                <span className="font-mono font-medium">
                  {formatTokenAmount(
                    poolState.reserve1,
                    token1Metadata.decimals
                  )}
                </span>
              </div>
            </div>

            {/* Exchange rate */}
            <div className="border-t border-neutral-dark/10 pt-4">
              <div className="text-sm text-neutral-dark/60 mb-2">
                Exchange Rate
              </div>
              <div className="bg-neutral-dark/5 rounded-lg p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>1 {token0Metadata.symbol} =</span>
                  <span className="font-mono font-medium">
                    {poolRatio.toFixed(6)} {token1Metadata.symbol}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>1 {token1Metadata.symbol} =</span>
                  <span className="font-mono font-medium">
                    {poolRatio > 0 ? (1 / poolRatio).toFixed(6) : '0'}{' '}
                    {token0Metadata.symbol}
                  </span>
                </div>
              </div>
            </div>

            {/* LP Token info */}
            <div className="border-t border-neutral-dark/10 pt-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-dark/60">
                  Total LP Supply
                </span>
                <span className="font-mono font-medium">
                  {formatTokenAmount(
                    poolState.totalSupply,
                    lpTokenMetadata.decimals
                  )}
                </span>
              </div>

              {/* K value (constant product) */}
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-neutral-dark/60">
                  Constant Product (k)
                </span>
                <span className="font-mono text-xs">
                  {formatTokenAmount(
                    poolState.reserve0 * poolState.reserve1,
                    36, // 18 + 18 decimals (both tokens combined)
                    2 // Show 2 decimal places
                  )}
                </span>
              </div>
            </div>

            {/* Pool stats */}
            <div className="bg-primary/5 rounded-lg p-3">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-2xl">💰</span>
                <div>
                  <div className="font-medium">Trading Fee: 0.3%</div>
                  <div className="text-xs text-neutral-dark/60">
                    Earned by liquidity providers
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🏊‍♂️</div>
            <div className="text-lg font-medium mb-2">Pool is Empty</div>
            <p className="text-sm text-neutral-dark/60">
              Be the first to add liquidity and set the initial price!
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
