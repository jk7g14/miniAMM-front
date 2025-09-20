'use client';

import React from 'react';
import { useAtom } from 'jotai';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { useContracts, useTransaction } from '@/app/hooks';
import {
  token0MetadataAtom,
  token1MetadataAtom,
  walletBalancesAtom,
  poolStateAtom,
  allowancesAtom,
  swapInputAmountAtom,
  selectedTokenAtom,
  calculateSwapOutputAtom,
  calculatePriceImpactAtom,
} from '@/app/atoms';
import {
  formatTokenAmount,
  parseTokenAmount,
  formatPercentage,
} from '@/app/utils/format';
// Removed unused imports

export function SwapInterface() {
  const contracts = useContracts();
  const [token0Metadata] = useAtom(token0MetadataAtom);
  const [token1Metadata] = useAtom(token1MetadataAtom);
  const [walletBalances] = useAtom(walletBalancesAtom);
  const [poolState] = useAtom(poolStateAtom);
  const [allowances] = useAtom(allowancesAtom);
  const slippage = 0.5; // Fixed 0.5% slippage

  const [swapInput, setSwapInput] = useAtom(swapInputAmountAtom);
  const [selectedToken, setSelectedToken] = useAtom(selectedTokenAtom);
  const [calculateOutput] = useAtom(calculateSwapOutputAtom);
  const [calculatePriceImpact] = useAtom(calculatePriceImpactAtom);

  const { loading, execute } = useTransaction('swap');

  // Token metadata based on selection
  const inputToken = selectedToken === 0 ? token0Metadata : token1Metadata;
  const outputToken = selectedToken === 0 ? token1Metadata : token0Metadata;
  const inputBalance =
    selectedToken === 0 ? walletBalances.token0 : walletBalances.token1;
  const inputAllowance =
    selectedToken === 0 ? allowances.token0 : allowances.token1;
  // Fix: Match contract logic - when TKB is selected (selectedToken=1),
  // it uses xAmountIn and swaps from yReserve to xReserve
  const inputReserve =
    selectedToken === 0 ? poolState.reserve1 : poolState.reserve0; // Y->X or X->Y
  const outputReserve =
    selectedToken === 0 ? poolState.reserve0 : poolState.reserve1; // X->Y or Y->X

  // Calculate output amount
  const inputAmount = parseTokenAmount(swapInput, inputToken.decimals);
  const outputAmount = calculateOutput(
    inputAmount,
    inputReserve,
    outputReserve
  );
  const priceImpact = calculatePriceImpact(
    inputAmount,
    inputReserve,
    outputReserve
  );

  // Calculate exchange rate
  const exchangeRate =
    inputAmount > 0n && outputAmount > 0n
      ? Number(formatTokenAmount(outputAmount, outputToken.decimals)) /
        Number(formatTokenAmount(inputAmount, inputToken.decimals))
      : poolState.reserve0 > 0n && poolState.reserve1 > 0n
      ? Number(
          formatTokenAmount(
            selectedToken === 0 ? poolState.reserve1 : poolState.reserve0,
            outputToken.decimals
          )
        ) /
        Number(
          formatTokenAmount(
            selectedToken === 0 ? poolState.reserve0 : poolState.reserve1,
            inputToken.decimals
          )
        )
      : 0;

  const handleSwap = async () => {
    if (!contracts || inputAmount === 0n) return;

    // Verify we have a signer for write operations
    if (!contracts.hasSigner || !contracts.walletProvider) {
      throw new Error('Wallet not connected or signer not available');
    }

    await execute(
      async () => {
        // Get the signer from wallet provider
        const signer = await contracts.walletProvider!.getSigner();

        // Connect contract with signer for write operations
        const ammWithSigner = contracts.amm.connect(signer);

        // Fix: Contract expects opposite mapping
        // selectedToken 0 (TKA) should use yAmountIn
        // selectedToken 1 (TKB) should use xAmountIn
        const xAmountIn = selectedToken === 1 ? inputAmount : 0n;
        const yAmountIn = selectedToken === 0 ? inputAmount : 0n;

        // Skip gas estimation due to RPC issues, use fixed gas limit
        const tx = await ammWithSigner.swap(xAmountIn, yAmountIn, {
          gasLimit: 500000n, // Increased gas limit to handle RPC issues
          gasPrice: 25000000000n, // 25 gwei - manual gas price
        });

        // Transaction sent successfully

        return tx;
      },
      {
        successMessage: `Swapped ${formatTokenAmount(
          inputAmount,
          inputToken.decimals
        )} ${inputToken.symbol} for ${formatTokenAmount(
          outputAmount,
          outputToken.decimals
        )} ${outputToken.symbol}`,
        refetchPool: true,
        onSuccess: () => {
          setSwapInput('');
        },
      }
    );
  };

  const handleSwitchTokens = () => {
    setSelectedToken(selectedToken === 0 ? 1 : 0);
    setSwapInput(''); // Clear input when switching
  };

  // Check conditions
  const hasInsufficientBalance = inputAmount > inputBalance;
  const needsApproval = inputAmount > inputAllowance;
  const isPoolEmpty = poolState.reserve0 === 0n || poolState.reserve1 === 0n;

  return (
    <Card>
      <div className="space-y-4">
        {/* From token */}
        <div>
          <label className="text-sm font-medium text-neutral-dark/60 block mb-1">
            From
          </label>
          <div className="bg-neutral-dark/5 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">{inputToken.symbol}</span>
              <span className="text-sm text-neutral-dark/60">
                Balance: {formatTokenAmount(inputBalance, inputToken.decimals)}
              </span>
            </div>
            <Input
              type="text"
              value={swapInput}
              onChange={(e) => setSwapInput(e.target.value)}
              placeholder="0.0"
              className="text-2xl font-medium"
              suffix={
                <button
                  onClick={() =>
                    setSwapInput(
                      formatTokenAmount(inputBalance, inputToken.decimals)
                    )
                  }
                  className="text-xs text-primary hover:underline"
                >
                  MAX
                </button>
              }
            />
          </div>
        </div>

        {/* Switch button */}
        <div className="flex justify-center">
          <button
            onClick={handleSwitchTokens}
            className="p-2 rounded-full bg-white border border-neutral-dark/10 hover:bg-neutral-dark/5 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
              />
            </svg>
          </button>
        </div>

        {/* To token */}
        <div>
          <label className="text-sm font-medium text-neutral-dark/60 block mb-1">
            To
          </label>
          <div className="bg-neutral-dark/5 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">{outputToken.symbol}</span>
              <span className="text-sm text-neutral-dark/60">
                Balance:{' '}
                {formatTokenAmount(
                  selectedToken === 0
                    ? walletBalances.token1
                    : walletBalances.token0,
                  outputToken.decimals
                )}
              </span>
            </div>
            <div className="text-2xl font-medium text-neutral-dark">
              {outputAmount > 0n
                ? formatTokenAmount(outputAmount, outputToken.decimals)
                : '0.0'}
            </div>
          </div>
        </div>

        {/* Trade info */}
        {inputAmount > 0n && outputAmount > 0n && (
          <div className="bg-neutral-dark/5 rounded-lg p-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-dark/60">Exchange Rate</span>
              <span>
                1 {inputToken.symbol} = {exchangeRate.toFixed(6)}{' '}
                {outputToken.symbol}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-dark/60">Price Impact</span>
              <span
                className={
                  priceImpact > 5
                    ? 'text-red-500'
                    : priceImpact > 2
                    ? 'text-yellow-500'
                    : ''
                }
              >
                {formatPercentage(priceImpact)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-dark/60">Minimum Received</span>
              <span>
                {formatTokenAmount(outputAmount, outputToken.decimals)}{' '}
                {outputToken.symbol}
              </span>
            </div>
          </div>
        )}

        {/* Warnings */}
        {priceImpact > 5 && (
          <div className="text-sm text-red-500 bg-red-50 p-3 rounded-lg">
            ⚠️ High price impact! Consider splitting your trade into smaller
            amounts.
          </div>
        )}

        {/* Action button */}
        {isPoolEmpty ? (
          <Button variant="secondary" size="md" className="w-full" disabled>
            Pool is empty
          </Button>
        ) : needsApproval ? (
          <div className="space-y-2">
            <Button variant="secondary" size="md" className="w-full" disabled>
              Approval Required
            </Button>
            <p className="text-xs text-center text-neutral-dark/60">
              Please approve {inputToken.symbol} in the Mint & Approve tab first
            </p>
          </div>
        ) : (
          <Button
            variant="primary"
            size="md"
            onClick={handleSwap}
            isLoading={loading.isLoading}
            disabled={
              !contracts ||
              hasInsufficientBalance ||
              inputAmount === 0n ||
              outputAmount === 0n
            }
            className="w-full"
          >
            {hasInsufficientBalance
              ? `Insufficient ${inputToken.symbol} balance`
              : inputAmount === 0n
              ? 'Enter an amount'
              : `Swap ${inputToken.symbol} for ${outputToken.symbol}`}
          </Button>
        )}

        {/* Trading info */}
        <div className="text-xs text-neutral-dark/50 text-center">
          Trading Fee: 0.3%
        </div>
      </div>
    </Card>
  );
}
