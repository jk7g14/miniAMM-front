import { Provider, Signer, Contract } from 'ethers';
import { MiniAMM__factory, MockERC20__factory } from '@/typechain-types';
import { getContracts } from '@/lib/addresses';

// Get contract instances (ethers v6 compatible)
export function getContractInstances(
  chainId: number,
  signerOrProvider?: Signer | Provider
) {
  const contracts = getContracts(chainId);

  if (!contracts) {
    throw new Error(`No contracts configured for chain ${chainId}`);
  }

  if (!signerOrProvider) {
    throw new Error('Signer or provider is required');
  }

  return {
    amm: MiniAMM__factory.connect(contracts.amm, signerOrProvider),
    token0: MockERC20__factory.connect(contracts.token0, signerOrProvider),
    token1: MockERC20__factory.connect(contracts.token1, signerOrProvider),
  };
}

// Get LP token address from AMM contract (ethers v6 async)
export async function getLPTokenAddress(
  chainId: number,
  provider: Provider
): Promise<string> {
  const { amm } = getContractInstances(chainId, provider);

  try {
    // In ethers v6, getAddress() is async and returns the contract address
    return await amm.getAddress();
  } catch (error) {
    console.error('Error getting LP token address:', error);
    // Fallback to AMM address
    return await amm.getAddress();
  }
}

// Helper to check if a transaction will succeed (ethers v6 compatible)
export async function estimateGas(
  contract: Contract,
  method: string,
  args: unknown[]
): Promise<bigint | null> {
  try {
    // ethers v6 gas estimation
    const estimatedGas = await contract[method].estimateGas(...args);

    // Add 20% buffer for safety
    return (estimatedGas * 120n) / 100n;
  } catch (error) {
    console.error(`Gas estimation failed for ${method}:`, error);
    return null;
  }
}

// Check if contract has a specific method
export function hasMethod(contract: Contract, methodName: string): boolean {
  try {
    return typeof contract[methodName] === 'function';
  } catch {
    return false;
  }
}

// Get contract interface for decoding errors
export function getContractInterface(contractType: 'amm' | 'token') {
  switch (contractType) {
    case 'amm':
      return MiniAMM__factory.createInterface();
    case 'token':
      return MockERC20__factory.createInterface();
    default:
      throw new Error(`Unknown contract type: ${contractType}`);
  }
}

// Type guard for contract errors
function isContractError(
  error: unknown
): error is { data: string; message?: string } {
  return typeof error === 'object' && error !== null && 'data' in error;
}

function hasMessage(error: unknown): error is { message: string } {
  return typeof error === 'object' && error !== null && 'message' in error;
}

// Decode contract error (ethers v6 compatible)
export function decodeContractError(
  error: unknown,
  contractType: 'amm' | 'token'
): string {
  try {
    if (!isContractError(error)) {
      return hasMessage(error) ? error.message : 'Unknown contract error';
    }

    const contractInterface = getContractInterface(contractType);
    const decodedError = contractInterface.parseError(error.data);

    if (decodedError) {
      return `${decodedError.name}: ${decodedError.args.join(', ')}`;
    }
  } catch (decodeError) {
    console.error('Failed to decode contract error:', decodeError);
  }

  return hasMessage(error) ? error.message : 'Contract execution failed';
}
