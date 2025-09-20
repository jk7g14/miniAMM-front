import { atom } from 'jotai';

// Transaction states
export type TransactionType =
  | 'mint'
  | 'approve'
  | 'swap'
  | 'addLiquidity'
  | 'removeLiquidity';

export interface TransactionState {
  isLoading: boolean;
  hash?: string;
  error?: string;
}

// Individual transaction states
export const mintLoadingAtom = atom<TransactionState>({ isLoading: false });
export const approveLoadingAtom = atom<TransactionState>({ isLoading: false });
export const swapLoadingAtom = atom<TransactionState>({ isLoading: false });
export const addLiquidityLoadingAtom = atom<TransactionState>({
  isLoading: false,
});
export const removeLiquidityLoadingAtom = atom<TransactionState>({
  isLoading: false,
});

// Global loading state
export const isAnyTransactionLoadingAtom = atom((get) => {
  return (
    get(mintLoadingAtom).isLoading ||
    get(approveLoadingAtom).isLoading ||
    get(swapLoadingAtom).isLoading ||
    get(addLiquidityLoadingAtom).isLoading ||
    get(removeLiquidityLoadingAtom).isLoading
  );
});

// UI state for inputs
export const swapInputAmountAtom = atom<string>('');
export const token0InputAmountAtom = atom<string>('');
export const token1InputAmountAtom = atom<string>('');
export const lpTokenInputAmountAtom = atom<string>('');

// Tab/view state
export type ActiveView = 'swap' | 'liquidity' | 'mint';
export const activeViewAtom = atom<ActiveView>('swap');

// Liquidity sub-view
export type LiquidityView = 'add' | 'remove';
export const liquidityViewAtom = atom<LiquidityView>('add');

// Success/error messages
export interface NotificationState {
  type: 'success' | 'error' | 'info';
  message: string;
  txHash?: string;
}

export const notificationAtom = atom<NotificationState | null>(null);

// Auto-dismiss notification after 5 seconds
export const dismissNotificationAtom = atom(null, (get, set) => {
  setTimeout(() => {
    set(notificationAtom, null);
  }, 5000);
});
