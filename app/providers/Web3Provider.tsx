'use client';

import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultConfig, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { WagmiProvider, http } from 'wagmi';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { Provider as JotaiProvider } from 'jotai';
import { useEffect } from 'react';
import { COSTON2_CHAIN_ID } from '@/lib/addresses';

// Define Coston2 testnet
const coston2 = {
  id: COSTON2_CHAIN_ID,
  name: 'Coston2',
  nativeCurrency: {
    decimals: 18,
    name: 'Coston2 Flare',
    symbol: 'C2FLR',
  },
  rpcUrls: {
    default: {
      http: [
        'https://rpc.ankr.com/flare_coston2',
        'https://coston2-api.flare.network/ext/bc/C/rpc',
        'https://coston2-api.flare.network/ext/C/rpc',
      ],
    },
    public: {
      http: [
        'https://rpc.ankr.com/flare_coston2',
        'https://coston2-api.flare.network/ext/bc/C/rpc',
        'https://coston2-api.flare.network/ext/C/rpc',
      ],
    },
  },
  blockExplorers: {
    default: {
      name: 'Coston2 Explorer',
      url: 'https://coston2-explorer.flare.network',
    },
  },
  testnet: true,
} as const;

const config = getDefaultConfig({
  appName: 'MiniAMM',
  projectId:
    process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID', // Get from https://cloud.walletconnect.com
  chains: [coston2],
  ssr: true,
  // Remove custom transport to use default behavior
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
    },
  },
});

// Error boundary component for wallet connection errors
function WalletErrorHandler({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Global error handler for unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason;

      // Check if it's a user rejection error
      if (
        error &&
        (error.name === 'UserRejectedRequestError' ||
          (error.message && error.message.includes('User rejected')) ||
          (error.message && error.message.includes('User denied')) ||
          error.code === 4001 ||
          error.code === 'ACTION_REJECTED')
      ) {
        // Prevent the error from being logged to console
        event.preventDefault();
        console.log('ℹ️ User cancelled wallet connection');
        return;
      }

      // Let other errors through normally
    };

    // Global error handler for window errors
    const handleError = (event: ErrorEvent) => {
      const error = event.error;

      if (
        error &&
        (error.name === 'UserRejectedRequestError' ||
          (error.message && error.message.includes('User rejected')) ||
          (error.message && error.message.includes('User denied')))
      ) {
        // Prevent the error from being logged to console
        event.preventDefault();
        console.log('ℹ️ User cancelled wallet connection');
        return;
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener(
        'unhandledrejection',
        handleUnhandledRejection
      );
      window.removeEventListener('error', handleError);
    };
  }, []);

  return <>{children}</>;
}

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <JotaiProvider>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider modalSize="compact">
            <WalletErrorHandler>{children}</WalletErrorHandler>
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </JotaiProvider>
  );
}
