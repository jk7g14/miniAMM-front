'use client';

import { useAtom } from 'jotai';
import {
  mintLoadingAtom,
  approveLoadingAtom,
  swapLoadingAtom,
  addLiquidityLoadingAtom,
  removeLiquidityLoadingAtom,
  notificationAtom,
  dismissNotificationAtom,
  TransactionType,
} from '@/app/atoms';
import {
  waitForTransaction,
  parseTransactionError,
  isUserRejection,
} from '@/app/utils/transactions';
import { useBalances } from './useBalances';
import { usePoolState } from './usePoolState';

const loadingAtomMap = {
  mint: mintLoadingAtom,
  approve: approveLoadingAtom,
  swap: swapLoadingAtom,
  addLiquidity: addLiquidityLoadingAtom,
  removeLiquidity: removeLiquidityLoadingAtom,
};

export function useTransaction(type: TransactionType) {
  const [loading, setLoading] = useAtom(loadingAtomMap[type]);
  const [, setNotification] = useAtom(notificationAtom);
  const [, dismissNotification] = useAtom(dismissNotificationAtom);
  const { refetch: refetchBalances } = useBalances();
  const { refetch: refetchPool } = usePoolState();

  const execute = async (
    transactionFn: () => Promise<unknown>,
    options?: {
      onSuccess?: (receipt: unknown) => void;
      successMessage?: string;
      refetchBalances?: boolean;
      refetchPool?: boolean;
    }
  ) => {
    try {
      // Set loading state
      setLoading({ isLoading: true });

      // Execute transaction
      const tx = await transactionFn();

      // Set transaction hash
      const txHash = (tx as { hash?: string }).hash;
      setLoading({ isLoading: true, hash: txHash });

      // Show pending notification
      setNotification({
        type: 'info',
        message: 'Transaction pending...',
        txHash: txHash,
      });

      // Wait for confirmation
      const receipt = await waitForTransaction(
        tx as unknown as import('@/app/utils/transactions').TransactionResult
      );

      // Clear loading state
      setLoading({ isLoading: false });

      // Show success notification
      setNotification({
        type: 'success',
        message: options?.successMessage || 'Transaction successful!',
        txHash: (receipt as { transactionHash?: string }).transactionHash,
      });

      // Auto-dismiss notification
      dismissNotification();

      // Refetch data if needed
      if (options?.refetchBalances !== false) {
        refetchBalances();
      }

      if (options?.refetchPool) {
        refetchPool();
      }

      // Call success callback
      if (options?.onSuccess) {
        options.onSuccess(receipt);
      }

      return receipt;
    } catch (error) {
      console.error(`${type} transaction error:`, error);

      const errorMessage = parseTransactionError(error);

      // Clear loading state
      setLoading({ isLoading: false, error: errorMessage });

      // Special handling for different error types
      if (isUserRejection(error)) {
        // Don't show notification for user rejections - it's intentional
        console.log('ℹ️ Transaction rejected by user');
      } else if (error instanceof Error && error.message.includes('timeout')) {
        setNotification({
          type: 'warning',
          message:
            'Transaction is taking longer than expected. It may still be processing. Check the block explorer.',
        });
      } else {
        // Show error notification for actual errors
        setNotification({
          type: 'error',
          message: errorMessage,
        });
      }

      // Auto-dismiss notification after longer time for timeouts (but not for user rejections)
      if (!isUserRejection(error)) {
        const dismissTime =
          error instanceof Error && error.message.includes('timeout')
            ? 10000
            : 5000;
        setTimeout(() => {
          dismissNotification();
        }, dismissTime);
      }

      throw error;
    }
  };

  return {
    loading,
    execute,
  };
}
