'use client';

import { useState, useEffect } from 'react';
import { useAtom } from 'jotai';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { useContracts, useTransaction, useBalances } from '@/app/hooks';
import {
  token0MetadataAtom,
  token1MetadataAtom,
  walletBalancesAtom,
  poolStateAtom,
  allowancesAtom,
  token0InputAmountAtom,
  token1InputAmountAtom,
} from '@/app/atoms';
import { formatTokenAmount, parseTokenAmount } from '@/app/utils/format';
// Removed unused imports

export function AddLiquidity() {
  const contracts = useContracts();
  const [token0Metadata] = useAtom(token0MetadataAtom);
  const [token1Metadata] = useAtom(token1MetadataAtom);
  const [walletBalances] = useAtom(walletBalancesAtom);
  const [poolState] = useAtom(poolStateAtom);
  const [allowances] = useAtom(allowancesAtom);
  // const slippage = 0.5; // Fixed 0.5% slippage - unused for now

  const [token0Input, setToken0Input] = useAtom(token0InputAmountAtom);
  const [token1Input, setToken1Input] = useAtom(token1InputAmountAtom);

  const { loading, execute } = useTransaction('addLiquidity');
  const { refetch: refetchBalances } = useBalances();

  // Calculate token amounts once at component level
  const token0Amount = parseTokenAmount(token0Input, token0Metadata.decimals);
  const token1Amount = parseTokenAmount(token1Input, token1Metadata.decimals);

  // State to track which input was last changed
  const [lastChangedInput, setLastChangedInput] = useState<
    'token0' | 'token1' | null
  >(null);

  // Calculate the required amount of the other token
  useEffect(() => {
    if (poolState.reserve0 === 0n || poolState.reserve1 === 0n) {
      // First liquidity - no ratio needed, user can input any amounts
      return;
    }

    // Only auto-calculate if we have a clear indication of which input changed
    if (lastChangedInput === 'token0' && token0Amount > 0n) {
      // Calculate required token1 based on token0 input
      const requiredToken1 =
        (token0Amount * poolState.reserve1) / poolState.reserve0;
      // Add small buffer (0.1%) to avoid ratio mismatch issues
      const bufferedToken1 = (requiredToken1 * 1001n) / 1000n;
      const token1Value = formatTokenAmount(
        bufferedToken1,
        token1Metadata.decimals
      );
      if (token1Value !== token1Input) {
        setToken1Input(token1Value);
      }
    } else if (lastChangedInput === 'token1' && token1Amount > 0n) {
      // Calculate required token0 based on token1 input
      const requiredToken0 =
        (token1Amount * poolState.reserve0) / poolState.reserve1;
      // Add small buffer (0.1%) to avoid ratio mismatch issues
      const bufferedToken0 = (requiredToken0 * 1001n) / 1000n;
      const token0Value = formatTokenAmount(
        bufferedToken0,
        token0Metadata.decimals
      );
      if (token0Value !== token0Input) {
        setToken0Input(token0Value);
      }
    }
  }, [
    token0Amount,
    token1Amount,
    poolState.reserve0,
    poolState.reserve1,
    lastChangedInput,
  ]);

  // Calculate expected LP tokens
  const calculateLPTokens = (): bigint => {
    if (token0Amount === 0n || token1Amount === 0n) return 0n;

    if (poolState.totalSupply === 0n) {
      // First liquidity provider gets sqrt(token0 * token1) LP tokens
      // Simplified: just return the minimum of the two amounts
      return token0Amount < token1Amount ? token0Amount : token1Amount;
    }

    // Calculate LP tokens based on the ratio
    const lpFromToken0 =
      (token0Amount * poolState.totalSupply) / poolState.reserve0;
    const lpFromToken1 =
      (token1Amount * poolState.totalSupply) / poolState.reserve1;

    // Return the minimum to ensure proper ratio
    return lpFromToken0 < lpFromToken1 ? lpFromToken0 : lpFromToken1;
  };

  const expectedLP = calculateLPTokens();
  const poolShareAfter =
    poolState.totalSupply > 0n
      ? (Number(expectedLP) * 100) /
        (Number(poolState.totalSupply) + Number(expectedLP))
      : 100;

  // Check if approvals are needed
  const needsToken0Approval =
    token0Amount > 0n && allowances.token0 < token0Amount;
  const needsToken1Approval =
    token1Amount > 0n && allowances.token1 < token1Amount;
  const needsApproval = needsToken0Approval || needsToken1Approval;

  const handleAddLiquidity = async () => {
    if (!contracts) return;

    // Verify we have a signer for write operations
    if (!contracts.hasSigner || !contracts.walletProvider) {
      throw new Error('Wallet not connected or signer not available');
    }

    // Use the already calculated amounts
    // const token0Amount and token1Amount are already defined above

    // Pre-transaction validation

    // Check amounts are positive
    if (token0Amount <= 0n || token1Amount <= 0n) {
      throw new Error('Both token amounts must be greater than zero');
    }

    // Check balances
    if (token0Amount > walletBalances.token0) {
      throw new Error(`Insufficient ${token0Metadata.symbol} balance`);
    }
    if (token1Amount > walletBalances.token1) {
      throw new Error(`Insufficient ${token1Metadata.symbol} balance`);
    }

    // Check allowances with detailed logging
    if (allowances.token0 < token0Amount) {
      console.error(`❌ ${token0Metadata.symbol} allowance insufficient:`, {
        current: allowances.token0.toString(),
        needed: token0Amount.toString(),
      });
      throw new Error(
        `❌ ${
          token0Metadata.symbol
        } 토큰 승인이 부족합니다. 현재: ${allowances.token0.toString()}, 필요: ${token0Amount.toString()}`
      );
    }
    if (allowances.token1 < token1Amount) {
      console.error(`❌ ${token1Metadata.symbol} allowance insufficient:`, {
        current: allowances.token1.toString(),
        needed: token1Amount.toString(),
      });
      throw new Error(
        `❌ ${
          token1Metadata.symbol
        } 토큰 승인이 부족합니다. 현재: ${allowances.token1.toString()}, 필요: ${token1Amount.toString()}`
      );
    }

    await execute(
      async () => {
        // Get the signer from wallet provider
        const signer = await contracts.walletProvider!.getSigner();

        // Connect contract with signer for write operations
        const ammWithSigner = contracts.amm.connect(signer);

        // Skip gas estimation for now due to RPC issues, use fixed gas limit

        // Call the addLiquidity function with manual gas price
        const tx = await ammWithSigner.addLiquidity(
          token0Amount,
          token1Amount,
          {
            gasLimit: 800000n, // Further increased gas limit
            gasPrice: 25000000000n, // 25 gwei - manual gas price
          }
        );

        // Transaction sent successfully

        return tx;
      },
      {
        successMessage: 'Liquidity added successfully!',
        refetchPool: true,
        onSuccess: () => {
          setToken0Input('');
          setToken1Input('');
        },
      }
    );
  };

  // Check if user has sufficient balances and allowances
  const hasInsufficientBalance =
    token0Amount > walletBalances.token0 ||
    token1Amount > walletBalances.token1;

  const isFirstLiquidity = poolState.totalSupply === 0n;

  return (
    <Card>
      <div className="space-y-4">
        {/* Token inputs */}
        <div className="space-y-3">
          <Input
            type="text"
            label={`${token0Metadata.symbol} Amount`}
            value={token0Input}
            onChange={(e) => {
              setToken0Input(e.target.value);
              setLastChangedInput('token0');
            }}
            placeholder="0.0"
            helperText={`Balance: ${formatTokenAmount(
              walletBalances.token0,
              token0Metadata.decimals
            )}`}
            error={
              token0Amount > walletBalances.token0
                ? 'Insufficient balance'
                : undefined
            }
          />

          <div className="flex justify-center">
            <span className="text-2xl text-neutral-dark/40">+</span>
          </div>

          <Input
            type="text"
            label={`${token1Metadata.symbol} Amount`}
            value={token1Input}
            onChange={(e) => {
              setToken1Input(e.target.value);
              setLastChangedInput('token1');
            }}
            placeholder="0.0"
            helperText={`Balance: ${formatTokenAmount(
              walletBalances.token1,
              token1Metadata.decimals
            )}`}
            error={
              token1Amount > walletBalances.token1
                ? 'Insufficient balance'
                : undefined
            }
          />
        </div>

        {/* Pool info */}
        {expectedLP > 0n && (
          <div className="bg-neutral-dark/5 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-neutral-dark/60">LP Tokens to Receive</span>
              <span className="font-medium">
                {formatTokenAmount(expectedLP, 18)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-dark/60">Share of Pool</span>
              <span className="font-medium">{poolShareAfter.toFixed(2)}%</span>
            </div>
            {isFirstLiquidity && (
              <div className="text-xs text-yellow-600 mt-2">
                ⚠️ You are the first liquidity provider. The ratio you set will
                determine the initial price.
              </div>
            )}
          </div>
        )}

        {/* Current pool state */}
        {!isFirstLiquidity && (
          <div className="text-xs text-neutral-dark/60">
            Current pool ratio: 1 {token0Metadata.symbol} ={' '}
            {poolState.reserve0 > 0n
              ? formatTokenAmount(
                  (poolState.reserve1 * 10n ** 18n) / poolState.reserve0,
                  18,
                  4
                )
              : '0'}{' '}
            {token1Metadata.symbol}
          </div>
        )}

        {/* Action button */}
        {needsApproval ? (
          <div className="space-y-2">
            <Button variant="secondary" size="md" className="w-full" disabled>
              Approval Required
            </Button>
            <p className="text-xs text-center text-neutral-dark/60">
              Please approve tokens in the Mint & Approve tab first
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={refetchBalances}
              className="w-full"
            >
              🔄 Refresh Allowances
            </Button>
          </div>
        ) : (
          <Button
            variant="primary"
            size="md"
            onClick={handleAddLiquidity}
            isLoading={loading.isLoading}
            disabled={
              !contracts ||
              hasInsufficientBalance ||
              token0Amount === 0n ||
              token1Amount === 0n
            }
            className="w-full"
          >
            {hasInsufficientBalance ? 'Insufficient Balance' : 'Add Liquidity'}
          </Button>
        )}
      </div>
    </Card>
  );
}
