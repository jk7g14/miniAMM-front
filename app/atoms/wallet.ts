import { atom } from 'jotai';
import { Address } from 'viem';

// Wallet connection state
export const walletAddressAtom = atom<Address | undefined>(undefined);
export const chainIdAtom = atom<number | undefined>(undefined);
export const isConnectedAtom = atom<boolean>(false);

// Selected token for swapping (0 or 1)
export const selectedTokenAtom = atom<0 | 1>(0);
