'use client';

import { useState } from 'react';
import { parseEther } from 'ethers';
import { useAccount, useChainId } from 'wagmi';
import { Card, Button, Input } from '@/app/components';
import { useContracts } from '@/app/hooks/useContracts';
import { useTransaction } from '@/app/hooks/useTransaction';
import { useAtom } from 'jotai';
import { token0MetadataAtom, token1MetadataAtom } from '@/app/atoms';

export function MintToken() {
  const [mintAmount, setMintAmount] = useState('1000');
  const [selectedToken, setSelectedToken] = useState(0);

  const { address, isConnected } = useAccount();
  const chain = useChainId();
  const contracts = useContracts();
  const { loading, execute } = useTransaction('mint');

  const [token0Metadata] = useAtom(token0MetadataAtom);
  const [token1Metadata] = useAtom(token1MetadataAtom);

  const handleMint = async () => {
    // Enhanced validation for ethers v6
    if (!contracts || !mintAmount || parseFloat(mintAmount) <= 0) {
      console.log('❌ Invalid mint parameters:', {
        contracts: !!contracts,
        mintAmount,
        parsedAmount: parseFloat(mintAmount || '0'),
        isConnected,
        address,
        chainId: chain,
      });
      return;
    }

    // Additional connection checks
    if (!isConnected || !address || chain !== 114) {
      console.log('❌ Wallet not properly connected:', {
        isConnected,
        address,
        chainId: chain,
        expectedChainId: 114,
      });
      return;
    }

    try {
      const amount = parseEther(mintAmount);
      const contract =
        selectedToken === 0 ? contracts.token0 : contracts.token1;
      const tokenSymbol =
        selectedToken === 0 ? token0Metadata.symbol : token1Metadata.symbol;

      console.log('🪙 Attempting to mint:', {
        amount: amount.toString(),
        tokenSymbol,
        userAddress: address,
        chainId: chain,
        hasSigner: contracts.hasSigner,
        selectedToken,
      });

      await execute(
        async () => {
          console.log('📤 Sending mint transaction...');

          // Verify we have a signer for write operations
          if (!contracts.hasSigner || !contracts.walletProvider) {
            throw new Error('Wallet not connected or signer not available');
          }

          // Get the signer from wallet provider
          const signer = await contracts.walletProvider.getSigner();
          console.log('🔑 Using signer:', await signer.getAddress());

          // Connect contract with signer for write operations
          const contractWithSigner = contract.connect(signer);

          // Verify contract and function exist
          if (
            !contractWithSigner ||
            typeof contractWithSigner.freeMintToSender !== 'function'
          ) {
            throw new Error('freeMintToSender function not found on contract');
          }

          // Get contract address for logging (ethers v6 async method)
          const contractAddress = await contractWithSigner.getAddress();
          console.log('📋 Contract details:', {
            address: contractAddress,
            tokenSymbol,
            amount: amount.toString(),
            signerAddress: await signer.getAddress(),
          });

          // Estimate gas first for better error handling
          console.log('⛽ Estimating gas...');
          try {
            const gasEstimate =
              await contractWithSigner.freeMintToSender.estimateGas(amount);
            console.log('Gas estimate:', gasEstimate.toString());
          } catch (gasError) {
            console.error('❌ Gas estimation failed:', gasError);
            throw new Error(
              'Transaction would fail. Please check your inputs and try again.'
            );
          }

          // Call the mint function (ethers v6 style) with gas settings
          console.log('🔄 Calling freeMintToSender...');
          const tx = await contractWithSigner.freeMintToSender(amount, {
            // Add some buffer to gas limit
            gasLimit: 200000n, // Fixed gas limit for mint operations
          });

          console.log('✅ Mint transaction sent:', {
            hash: tx.hash,
            from: tx.from,
            to: tx.to,
            value: tx.value?.toString(),
            gasLimit: tx.gasLimit?.toString(),
            gasPrice: tx.gasPrice?.toString(),
            nonce: tx.nonce,
            explorerUrl: `https://coston2-explorer.flare.network/tx/${tx.hash}`,
          });

          return tx;
        },
        {
          successMessage: `Successfully minted ${mintAmount} ${tokenSymbol}!`,
        }
      );

      // Reset amount after successful mint
      setMintAmount('1000');
    } catch (error) {
      console.error('❌ Mint failed:', error);

      // Additional error logging for debugging
      if (error instanceof Error) {
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          code: 'code' in error ? (error as { code: unknown }).code : undefined,
          reason:
            'reason' in error
              ? (error as { reason: unknown }).reason
              : undefined,
        });
      }
    }
  };

  const currentMetadata = selectedToken === 0 ? token0Metadata : token1Metadata;

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Mint Test Tokens</h3>

      {/* Token Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Token
        </label>
        <div className="flex space-x-2">
          <Button
            variant={selectedToken === 0 ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setSelectedToken(0)}
            className="flex-1"
          >
            {token0Metadata.symbol}
          </Button>
          <Button
            variant={selectedToken === 1 ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setSelectedToken(1)}
            className="flex-1"
          >
            {token1Metadata.symbol}
          </Button>
        </div>
      </div>

      {/* Amount Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Amount to Mint
        </label>
        <Input
          type="number"
          value={mintAmount}
          onChange={(e) => setMintAmount(e.target.value)}
          placeholder="Enter amount"
          min="0"
          step="1"
        />
      </div>

      {/* Mint Button */}
      <Button
        variant="primary"
        size="md"
        onClick={handleMint}
        isLoading={loading.isLoading}
        disabled={
          !contracts ||
          !mintAmount ||
          parseFloat(mintAmount) <= 0 ||
          !isConnected ||
          !address ||
          chain !== 114 ||
          !contracts.hasSigner ||
          !contracts.walletProvider
        }
        className="w-full"
      >
        {!isConnected
          ? 'Connect Wallet'
          : chain !== 114
          ? 'Wrong Network'
          : !contracts?.hasSigner || !contracts?.walletProvider
          ? 'Wallet Not Ready'
          : `Mint ${currentMetadata.symbol}`}
      </Button>

      {/* Loading State */}
      {loading.isLoading && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm text-blue-700">
              {loading.hash
                ? 'Confirming transaction...'
                : 'Preparing transaction...'}
            </span>
          </div>
          {loading.hash && (
            <div className="mt-2 space-y-1">
              <div className="text-xs text-blue-600 break-all">
                Hash: {loading.hash}
              </div>
              <a
                href={`https://coston2-explorer.flare.network/tx/${loading.hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-500 hover:text-blue-700 underline"
              >
                View on Block Explorer →
              </a>
            </div>
          )}
        </div>
      )}

      {/* Error State */}
      {loading.error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-sm text-red-700">Error: {loading.error}</div>
        </div>
      )}

      {/* Info */}
      <div className="mt-4 text-xs text-gray-500">
        <p>• Free test tokens for development</p>
        <p>• No real value - testnet only</p>
        <p>• Use these tokens to test the AMM</p>
      </div>
    </Card>
  );
}
