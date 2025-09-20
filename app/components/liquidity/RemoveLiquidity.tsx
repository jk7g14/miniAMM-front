'use client';

import { useState } from 'react';
import { useAtom } from 'jotai';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { useContracts, useTransaction } from '@/app/hooks';
import {
  token0MetadataAtom,
  token1MetadataAtom,
  lpTokenMetadataAtom,
  walletBalancesAtom,
  poolStateAtom,
  lpTokenInputAmountAtom,
  userPoolShareAtom,
} from '@/app/atoms';
import {
  formatTokenAmount,
  parseTokenAmount,
  formatPercentage,
} from '@/app/utils/format';
import { calculateMinimumAmount, getDeadline } from '@/app/utils/transactions';

export function RemoveLiquidity() {
  const contracts = useContracts();
  const [token0Metadata] = useAtom(token0MetadataAtom);
  const [token1Metadata] = useAtom(token1MetadataAtom);
  const [lpTokenMetadata] = useAtom(lpTokenMetadataAtom);
  const [walletBalances] = useAtom(walletBalancesAtom);
  const [poolState] = useAtom(poolStateAtom);
  const slippage = 0.5; // Fixed 0.5% slippage
  const [userPoolShare] = useAtom(userPoolShareAtom);

  const [lpInput, setLpInput] = useAtom(lpTokenInputAmountAtom);
  const [removePercentage, setRemovePercentage] = useState(50);

  const { loading, execute } = useTransaction('removeLiquidity');

  // Calculate LP amount based on percentage
  const lpAmountFromPercentage =
    (walletBalances.lpToken * BigInt(removePercentage)) / 100n;
  const lpAmount = lpInput
    ? parseTokenAmount(lpInput, lpTokenMetadata.decimals)
    : lpAmountFromPercentage;

  // Calculate expected token outputs
  const calculateTokenOutputs = () => {
    if (lpAmount === 0n || poolState.totalSupply === 0n) {
      return { token0Out: 0n, token1Out: 0n };
    }

    const token0Out = (lpAmount * poolState.reserve0) / poolState.totalSupply;
    const token1Out = (lpAmount * poolState.reserve1) / poolState.totalSupply;

    return { token0Out, token1Out };
  };

  const { token0Out, token1Out } = calculateTokenOutputs();

  // Calculate pool share after removal
  const lpRemaining = walletBalances.lpToken - lpAmount;
  const totalSupplyAfter = poolState.totalSupply - lpAmount;
  const poolShareAfter =
    totalSupplyAfter > 0n
      ? (Number(lpRemaining) * 100) / Number(totalSupplyAfter)
      : 0;

  const handleRemoveLiquidity = async () => {
    if (!contracts || lpAmount === 0n) return;

    // Verify we have a signer for write operations
    if (!contracts.hasSigner || !contracts.walletProvider) {
      throw new Error('Wallet not connected or signer not available');
    }

    await execute(
      async () => {
        console.log('📤 Sending remove liquidity transaction...');

        // Get the signer from wallet provider
        const signer = await contracts.walletProvider.getSigner();
        console.log('🔑 Using signer:', await signer.getAddress());

        // Connect contract with signer for write operations
        const ammWithSigner = contracts.amm.connect(signer);

        console.log('📋 Remove liquidity details:', {
          lpAmount: lpAmount.toString(),
          removePercentage,
          expectedToken0: token0Out.toString(),
          expectedToken1: token1Out.toString(),
          signerAddress: await signer.getAddress(),
        });

        // Estimate gas first
        console.log('⛽ Estimating gas...');
        try {
          const gasEstimate = await ammWithSigner.removeLiquidity.estimateGas(
            lpAmount
          );
          console.log('Gas estimate:', gasEstimate.toString());
        } catch (gasError) {
          console.error('❌ Gas estimation failed:', gasError);
          throw new Error(
            'Transaction would fail. Please check your inputs and try again.'
          );
        }

        // Call the removeLiquidity function
        console.log('🔄 Calling removeLiquidity...');
        const tx = await ammWithSigner.removeLiquidity(lpAmount, {
          gasLimit: 350000n, // Fixed gas limit for remove liquidity operations
        });

        console.log('✅ Remove liquidity transaction sent:', {
          hash: tx.hash,
          from: tx.from,
          to: tx.to,
          gasLimit: tx.gasLimit?.toString(),
          gasPrice: tx.gasPrice?.toString(),
          nonce: tx.nonce,
          explorerUrl: `https://coston2-explorer.flare.network/tx/${tx.hash}`,
        });

        return tx;
      },
      {
        successMessage: 'Liquidity removed successfully!',
        refetchPool: true,
        onSuccess: () => {
          setLpInput('');
          setRemovePercentage(50);
        },
      }
    );
  };

  const handlePercentageClick = (percentage: number) => {
    setRemovePercentage(percentage);
    const amount = (walletBalances.lpToken * BigInt(percentage)) / 100n;
    setLpInput(formatTokenAmount(amount, lpTokenMetadata.decimals));
  };

  return (
    <Card>
      <div className="space-y-4">
        {/* Current position */}
        <div className="bg-neutral-dark/5 rounded-lg p-4 space-y-2">
          <h4 className="font-medium text-sm text-neutral-dark/60">
            Your Position
          </h4>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>LP Tokens</span>
              <span className="font-medium">
                {formatTokenAmount(
                  walletBalances.lpToken,
                  lpTokenMetadata.decimals
                )}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Pool Share</span>
              <span className="font-medium">
                {formatPercentage(userPoolShare)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Pooled {token0Metadata.symbol}</span>
              <span className="font-medium">
                {formatTokenAmount(
                  poolState.totalSupply > 0n
                    ? (walletBalances.lpToken * poolState.reserve0) /
                        poolState.totalSupply
                    : 0n,
                  token0Metadata.decimals
                )}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Pooled {token1Metadata.symbol}</span>
              <span className="font-medium">
                {formatTokenAmount(
                  poolState.totalSupply > 0n
                    ? (walletBalances.lpToken * poolState.reserve1) /
                        poolState.totalSupply
                    : 0n,
                  token1Metadata.decimals
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Amount to remove */}
        <div>
          <label className="text-sm font-medium text-neutral-dark/60 block mb-2">
            Amount to Remove
          </label>

          {/* Percentage slider */}
          <div className="bg-neutral-dark/5 rounded-lg p-4 mb-3">
            <div className="text-3xl font-bold text-center mb-2">
              {removePercentage}%
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={removePercentage}
              onChange={(e) => {
                const percentage = parseInt(e.target.value);
                setRemovePercentage(percentage);
                const amount =
                  (walletBalances.lpToken * BigInt(percentage)) / 100n;
                setLpInput(formatTokenAmount(amount, lpTokenMetadata.decimals));
              }}
              className="w-full"
            />
            <div className="flex justify-between mt-2">
              {[25, 50, 75, 100].map((percentage) => (
                <Button
                  key={percentage}
                  variant="outline"
                  size="sm"
                  onClick={() => handlePercentageClick(percentage)}
                >
                  {percentage}%
                </Button>
              ))}
            </div>
          </div>

          {/* LP token input */}
          <Input
            type="text"
            value={lpInput}
            onChange={(e) => {
              setLpInput(e.target.value);
              const amount = parseTokenAmount(
                e.target.value,
                lpTokenMetadata.decimals
              );
              const percentage =
                walletBalances.lpToken > 0n
                  ? Number((amount * 100n) / walletBalances.lpToken)
                  : 0;
              setRemovePercentage(Math.min(100, Math.max(0, percentage)));
            }}
            placeholder="0.0"
            suffix="LP"
            helperText={`Balance: ${formatTokenAmount(
              walletBalances.lpToken,
              lpTokenMetadata.decimals
            )} LP`}
            error={
              lpInput && lpAmount > walletBalances.lpToken
                ? 'Insufficient LP token balance'
                : undefined
            }
          />
        </div>

        {/* Expected output */}
        {lpAmount > 0n && (
          <div className="bg-neutral-dark/5 rounded-lg p-4 space-y-2">
            <h4 className="font-medium text-sm text-neutral-dark/60">
              You Will Receive
            </h4>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-sm">{token0Metadata.symbol}</span>
                <span className="font-medium">
                  {formatTokenAmount(token0Out, token0Metadata.decimals)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">{token1Metadata.symbol}</span>
                <span className="font-medium">
                  {formatTokenAmount(token1Out, token1Metadata.decimals)}
                </span>
              </div>
            </div>

            {/* Pool share after */}
            <div className="pt-2 mt-2 border-t border-neutral-dark/10">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-dark/60">Pool Share After</span>
                <span>
                  {formatPercentage(userPoolShare)} →{' '}
                  {formatPercentage(poolShareAfter)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Action button */}
        <Button
          variant="primary"
          size="md"
          onClick={handleRemoveLiquidity}
          isLoading={loading.isLoading}
          disabled={
            !contracts ||
            lpAmount === 0n ||
            lpAmount > walletBalances.lpToken ||
            poolState.totalSupply === 0n
          }
          className="w-full"
        >
          {lpAmount > walletBalances.lpToken
            ? 'Insufficient LP Balance'
            : lpAmount === 0n
            ? 'Enter an amount'
            : 'Remove Liquidity'}
        </Button>

        {/* Info */}
        <div className="text-xs text-neutral-dark/50 text-center">
          <p>Removing liquidity will burn your LP tokens</p>
        </div>
      </div>
    </Card>
  );
}
