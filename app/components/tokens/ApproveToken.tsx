'use client';

import { useState } from 'react';
import { useAtom } from 'jotai';
import { parseEther } from 'viem';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { useContracts, useTransaction } from '@/app/hooks';
import {
  token0MetadataAtom,
  token1MetadataAtom,
  allowancesAtom,
  walletBalancesAtom,
} from '@/app/atoms';
import { formatTokenAmount } from '@/app/utils/format';
import { ethers } from 'ethers';

export function ApproveToken() {
  const contracts = useContracts();
  const [token0Metadata] = useAtom(token0MetadataAtom);
  const [token1Metadata] = useAtom(token1MetadataAtom);
  const [allowances] = useAtom(allowancesAtom);
  const [walletBalances] = useAtom(walletBalancesAtom);

  // Individual loading states for each button
  const [loadingStates, setLoadingStates] = useState({
    token0Unlimited: false,
    token1Unlimited: false,
  });

  const { execute } = useTransaction('approve');

  const handleApprove = async (tokenIndex: 0 | 1, isInfinite: boolean) => {
    if (!contracts) return;

    // Verify we have a signer for write operations
    if (!contracts.hasSigner || !contracts.walletProvider) {
      throw new Error('Wallet not connected or signer not available');
    }

    const contract = tokenIndex === 0 ? contracts.token0 : contracts.token1;
    const tokenSymbol =
      tokenIndex === 0 ? token0Metadata.symbol : token1Metadata.symbol;

    // Use max uint256 for infinite approval, or user's balance for exact approval
    const amount = isInfinite
      ? ethers.MaxUint256
      : tokenIndex === 0
      ? walletBalances.token0
      : walletBalances.token1;

    // Determine which loading state to update
    const loadingKey =
      `token${tokenIndex}Unlimited` as keyof typeof loadingStates;

    try {
      // Set individual loading state
      setLoadingStates((prev) => ({ ...prev, [loadingKey]: true }));

      await execute(
        async () => {
          console.log('📤 Sending approve transaction...');

          // Get the signer from wallet provider
          const signer = await contracts.walletProvider.getSigner();
          console.log('🔑 Using signer:', await signer.getAddress());

          // Connect contract with signer for write operations
          const contractWithSigner = contract.connect(signer);

          // Get AMM contract address for approval
          const ammAddress = await contracts.amm.getAddress();

          console.log('📋 Approval details:', {
            token: tokenSymbol,
            spender: ammAddress,
            amount: amount.toString(),
            isInfinite,
            signerAddress: await signer.getAddress(),
          });

          // Estimate gas first
          console.log('⛽ Estimating gas...');
          try {
            const gasEstimate = await contractWithSigner.approve.estimateGas(
              ammAddress,
              amount
            );
            console.log('Gas estimate:', gasEstimate.toString());
          } catch (gasError) {
            console.error('❌ Gas estimation failed:', gasError);
            throw new Error(
              'Transaction would fail. Please check your inputs and try again.'
            );
          }

          // Call the approve function
          console.log('🔄 Calling approve...');
          const tx = await contractWithSigner.approve(ammAddress, amount, {
            gasLimit: 100000n, // Fixed gas limit for approve operations
          });

          console.log('✅ Approve transaction sent:', {
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
          successMessage: `${tokenSymbol} approved for MiniAMM!`,
        }
      );
    } catch (error) {
      console.error('Approve failed:', error);
    } finally {
      // Clear individual loading state
      setLoadingStates((prev) => ({ ...prev, [loadingKey]: false }));
    }
  };

  const hasToken0Allowance = allowances.token0 > 0n;
  const hasToken1Allowance = allowances.token1 > 0n;
  const hasInfiniteToken0 = allowances.token0 >= ethers.MaxUint256 / 2n;
  const hasInfiniteToken1 = allowances.token1 >= ethers.MaxUint256 / 2n;

  return (
    <Card title="Token Approvals" subtitle="Allow MiniAMM to spend your tokens">
      <div className="space-y-6">
        {/* Token 0 Approval */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h4 className="font-medium">{token0Metadata.symbol}</h4>
            <span className="text-sm text-neutral-dark/60">
              {hasToken0Allowance ? (
                hasInfiniteToken0 ? (
                  <span className="text-green-600">✓ Unlimited approval</span>
                ) : (
                  <span className="text-yellow-600">
                    Approved:{' '}
                    {formatTokenAmount(
                      allowances.token0,
                      token0Metadata.decimals
                    )}
                  </span>
                )
              ) : (
                <span className="text-red-600">Not approved</span>
              )}
            </span>
          </div>

          <div className="flex">
            <Button
              variant={hasInfiniteToken0 ? 'outline' : 'primary'}
              size="sm"
              onClick={() => handleApprove(0, true)}
              isLoading={loadingStates.token0Unlimited}
              className="w-full"
            >
              {hasInfiniteToken0 ? 'Approved ✓' : 'Approve Unlimited'}
            </Button>
          </div>
        </div>

        {/* Token 1 Approval */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h4 className="font-medium">{token1Metadata.symbol}</h4>
            <span className="text-sm text-neutral-dark/60">
              {hasToken1Allowance ? (
                hasInfiniteToken1 ? (
                  <span className="text-green-600">✓ Unlimited approval</span>
                ) : (
                  <span className="text-yellow-600">
                    Approved:{' '}
                    {formatTokenAmount(
                      allowances.token1,
                      token1Metadata.decimals
                    )}
                  </span>
                )
              ) : (
                <span className="text-red-600">Not approved</span>
              )}
            </span>
          </div>

          <div className="flex">
            <Button
              variant={hasInfiniteToken1 ? 'outline' : 'primary'}
              size="sm"
              onClick={() => handleApprove(1, true)}
              isLoading={loadingStates.token1Unlimited}
              className="w-full"
            >
              {hasInfiniteToken1 ? 'Approved ✓' : 'Approve Unlimited'}
            </Button>
          </div>
        </div>

        {/* Info message */}
        <div className="space-y-3 text-xs">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="font-medium text-blue-800 mb-1">
              💡 About Token Approval
            </p>
            <p className="text-blue-700">
              Approvals allow MiniAMM to transfer your tokens when you swap or
              add liquidity. "Unlimited" approval means you won't need to
              approve again for future transactions.
            </p>
          </div>

          <div className="p-2 bg-gray-50 border border-gray-200 rounded text-center">
            <p className="text-gray-600">
              🧪 This is testnet - tokens have no real value
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
