'use client';

import { useState } from 'react';
import { useAtom } from 'jotai';
import { Card } from '../common/Card';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import {
  poolStateAtom,
  token0MetadataAtom,
  token1MetadataAtom,
  poolRatioAtom,
} from '@/app/atoms';
import { formatTokenAmount } from '@/app/utils/format';

export function SwapPreview() {
  const [poolState] = useAtom(poolStateAtom);
  const [token0Metadata] = useAtom(token0MetadataAtom);
  const [token1Metadata] = useAtom(token1MetadataAtom);
  const [poolRatio] = useAtom(poolRatioAtom);

  const [inputAmount, setInputAmount] = useState('');
  const [fromToken, setFromToken] = useState<0 | 1>(0);

  const isPoolEmpty = poolState.reserve0 === 0n && poolState.reserve1 === 0n;

  // Calculate output amount using constant product formula
  const calculateOutputAmount = (input: string): string => {
    if (!input || isNaN(Number(input)) || Number(input) <= 0 || isPoolEmpty) {
      return '0';
    }

    const inputValue = Number(input);
    const fromMetadata = fromToken === 0 ? token0Metadata : token1Metadata;
    const toMetadata = fromToken === 0 ? token1Metadata : token0Metadata;

    // Convert to wei
    const inputWei = BigInt(
      Math.floor(inputValue * 10 ** fromMetadata.decimals)
    );

    // Get reserves
    const reserveIn = fromToken === 0 ? poolState.reserve0 : poolState.reserve1;
    const reserveOut =
      fromToken === 0 ? poolState.reserve1 : poolState.reserve0;

    if (reserveIn === 0n || reserveOut === 0n) return '0';

    // Apply 0.3% fee (997/1000)
    const inputWithFee = inputWei * 997n;
    const numerator = inputWithFee * reserveOut;
    const denominator = reserveIn * 1000n + inputWithFee;

    const outputWei = numerator / denominator;

    // Convert back to human readable
    const output = Number(outputWei) / 10 ** toMetadata.decimals;
    return output.toFixed(6);
  };

  const outputAmount = calculateOutputAmount(inputAmount);
  const priceImpact =
    inputAmount && Number(inputAmount) > 0 && !isPoolEmpty
      ? Math.abs(Number(outputAmount) / Number(inputAmount) / poolRatio - 1) *
        100
      : 0;

  const fromMetadata = fromToken === 0 ? token0Metadata : token1Metadata;
  const toMetadata = fromToken === 0 ? token1Metadata : token0Metadata;

  return (
    <Card title="Swap Preview" subtitle="See estimated rates (read-only)">
      <div className="space-y-4">
        {isPoolEmpty ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🏊‍♂️</div>
            <div className="text-lg font-medium mb-2">Pool is Empty</div>
            <p className="text-sm text-neutral-dark/60">
              No liquidity available for swapping yet
            </p>
          </div>
        ) : (
          <>
            {/* From Token */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium">From</label>
                <button
                  onClick={() => setFromToken(fromToken === 0 ? 1 : 0)}
                  className="text-xs text-primary hover:text-primary/80 transition-colors"
                >
                  Switch tokens
                </button>
              </div>
              <div className="flex gap-3">
                <Input
                  type="number"
                  placeholder="0.0"
                  value={inputAmount}
                  onChange={(e) => setInputAmount(e.target.value)}
                  className="flex-1"
                />
                <div className="flex items-center px-3 py-2 bg-neutral-dark/5 rounded-lg border border-neutral-dark/10">
                  <span className="font-medium text-sm">
                    {fromMetadata.symbol}
                  </span>
                </div>
              </div>
            </div>

            {/* Swap Arrow */}
            <div className="flex justify-center">
              <div className="p-2 bg-neutral-dark/5 rounded-full border border-neutral-dark/10">
                <div className="text-lg">↓</div>
              </div>
            </div>

            {/* To Token */}
            <div className="space-y-2">
              <label className="text-sm font-medium">To (estimated)</label>
              <div className="flex gap-3">
                <div className="flex-1 px-3 py-2 bg-neutral-dark/5 rounded-lg border border-neutral-dark/10">
                  <span className="font-mono text-sm">{outputAmount}</span>
                </div>
                <div className="flex items-center px-3 py-2 bg-neutral-dark/5 rounded-lg border border-neutral-dark/10">
                  <span className="font-medium text-sm">
                    {toMetadata.symbol}
                  </span>
                </div>
              </div>
            </div>

            {/* Swap Details */}
            {inputAmount && Number(inputAmount) > 0 && (
              <div className="bg-neutral-dark/5 rounded-lg p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-dark/60">Exchange Rate</span>
                  <span className="font-mono">
                    1 {fromMetadata.symbol} ={' '}
                    {fromToken === 0
                      ? poolRatio.toFixed(6)
                      : (1 / poolRatio).toFixed(6)}{' '}
                    {toMetadata.symbol}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-dark/60">Price Impact</span>
                  <span
                    className={`font-mono ${
                      priceImpact > 5
                        ? 'text-red-500'
                        : priceImpact > 1
                        ? 'text-yellow-500'
                        : 'text-green-500'
                    }`}
                  >
                    {priceImpact.toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-dark/60">Trading Fee</span>
                  <span className="font-mono">0.3%</span>
                </div>
              </div>
            )}

            {/* Connect Wallet CTA */}
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 text-center">
              <p className="text-sm text-primary font-medium mb-2">
                Ready to make this swap?
              </p>
              <p className="text-xs text-neutral-dark/60">
                Connect your wallet to execute trades
              </p>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
