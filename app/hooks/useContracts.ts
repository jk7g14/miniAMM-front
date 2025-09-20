'use client';

import { useMemo } from 'react';
import {
  useAccount,
  useChainId,
  usePublicClient,
  useWalletClient,
} from 'wagmi';
import { BrowserProvider } from 'ethers';
import {
  MiniAMM__factory,
  MockERC20__factory,
  type MiniAMM,
  type MockERC20,
} from '@/typechain-types';
import { COSTON2_CHAIN_ID, getContracts } from '@/lib/addresses';

export function useContracts() {
  const chainId = useChainId();
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  return useMemo(() => {
    async function createContractsAsync() {
      try {
        // Check if we're on the correct chain
        if (chainId !== COSTON2_CHAIN_ID) {
          return null;
        }

        if (!publicClient) {
          return null;
        }

        // Create ethers provider from wagmi public client
        const provider = new BrowserProvider(
          {
            request: async ({ method, params }) => {
              try {
                const result = await publicClient.request({
                  method: method as never,
                  params: params as never,
                });
                return result;
              } catch (error) {
                console.error('Provider request failed:', error);
                throw error;
              }
            },
          },
          {
            chainId: chainId,
            name: 'Flare Testnet Coston2',
          }
        );

        // Determine the contract runner
        let contractRunner = provider;
        let hasSigner = false;

        // If wallet is connected, create a signer for write operations
        if (walletClient && isConnected && address) {
          try {
            const walletProvider = new BrowserProvider(
              {
                request: async ({ method, params }) => {
                  try {
                    const result = await walletClient.request({
                      method: method as never,
                      params: params as never,
                    });
                    return result;
                  } catch (error) {
                    console.error('Wallet request failed:', error);
                    throw error;
                  }
                },
              },
              {
                chainId: chainId,
                name: 'Flare Testnet Coston2',
              }
            );

            // Get signer synchronously for ethers v6
            const signer = await walletProvider.getSigner();
            console.log(
              '✅ Signer created for address:',
              await signer.getAddress()
            );

            contractRunner = signer as unknown as BrowserProvider;
            hasSigner = true;
          } catch (error) {
            console.error('❌ Failed to create signer:', error);
            // Fall back to read-only provider
            contractRunner = provider;
            hasSigner = false;
          }
        }

        // Get contract addresses for the current chain
        const contracts = getContracts(chainId);
        if (!contracts) {
          throw new Error(`No contracts configured for chain ${chainId}`);
        }

        // Create contract instances
        const amm = MiniAMM__factory.connect(
          contracts.amm,
          contractRunner
        ) as MiniAMM;

        const token0 = MockERC20__factory.connect(
          contracts.token0,
          contractRunner
        ) as MockERC20;

        const token1 = MockERC20__factory.connect(
          contracts.token1,
          contractRunner
        ) as MockERC20;

        // Contract instances created successfully

        return {
          amm,
          token0,
          token1,
          provider,
          hasSigner,
          isConnected,
        };
      } catch (error) {
        console.error(
          '❌ Failed to create contract instances:',
          error instanceof Error ? error.message : 'Unknown error'
        );
        return null;
      }
    }

    // For synchronous return, we need to handle the async operation differently
    // We'll use a different approach that works with React's useMemo
    try {
      console.log('🔗 Creating contract instances (sync)...', {
        chainId,
        hasPublicClient: !!publicClient,
        hasWalletClient: !!walletClient,
        isConnected,
        address,
      });

      // Check if we're on the correct chain
      if (chainId !== COSTON2_CHAIN_ID) {
        console.log(
          '❌ Wrong chain ID:',
          chainId,
          'expected:',
          COSTON2_CHAIN_ID
        );
        return null;
      }

      if (!publicClient) {
        console.log('❌ No public client available');
        return null;
      }

      // Create ethers provider from wagmi public client
      const provider = new BrowserProvider(
        {
          request: async ({ method, params }) => {
            try {
              const result = await publicClient.request({
                method: method as never,
                params: params as never,
              });
              return result;
            } catch (error) {
              console.error('Provider request failed:', error);
              throw error;
            }
          },
        },
        {
          chainId: chainId,
          name: 'Flare Testnet Coston2',
        }
      );

      // For write operations, we need a signer, but we'll create it when needed
      // For now, just use provider for read operations
      let contractRunner = provider;
      let hasSigner = false;

      // If wallet is connected, we can potentially create a signer
      if (walletClient && isConnected && address) {
        // Create a wallet provider that can be used to get signer later
        const walletProvider = new BrowserProvider(
          {
            request: async ({ method, params }) => {
              try {
                const result = await walletClient.request({
                  method: method as never,
                  params: params as never,
                });
                return result;
              } catch (error) {
                console.error('Wallet request failed:', error);
                throw error;
              }
            },
          },
          {
            chainId: chainId,
            name: 'Flare Testnet Coston2',
          }
        );

        contractRunner = walletProvider;
        hasSigner = true;
      }

      // Get contract addresses for the current chain
      const contracts = getContracts(chainId);
      if (!contracts) {
        throw new Error(`No contracts configured for chain ${chainId}`);
      }

      // Create contract instances
      const amm = MiniAMM__factory.connect(
        contracts.amm,
        contractRunner
      ) as MiniAMM;

      const token0 = MockERC20__factory.connect(
        contracts.token0,
        contractRunner
      ) as MockERC20;

      const token1 = MockERC20__factory.connect(
        contracts.token1,
        contractRunner
      ) as MockERC20;

      console.log('✅ Contract instances created successfully', {
        ammAddress: contracts.amm,
        token0Address: contracts.token0,
        token1Address: contracts.token1,
        hasSigner,
        isConnected,
        runnerType: hasSigner ? 'wallet-provider' : 'provider',
      });

      return {
        amm,
        token0,
        token1,
        provider,
        walletProvider: hasSigner ? contractRunner : null,
        hasSigner,
        isConnected,
      };
    } catch (error) {
      console.error(
        '❌ Failed to create contract instances:',
        error instanceof Error ? error.message : 'Unknown error'
      );
      return null;
    }
  }, [publicClient, walletClient, chainId, isConnected, address]);
}
