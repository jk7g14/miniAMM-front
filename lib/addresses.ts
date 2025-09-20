export type AddressHex = `0x${string}`;

// Flare Coston2 testnet chain id (per Flare docs): 114
export const COSTON2_CHAIN_ID = 114;

type Contracts = {
  amm: AddressHex; // MiniAMM pair contract
  token0: AddressHex; // MockERC20 #1
  token1: AddressHex; // MockERC20 #2
};

export const CONTRACTS: Record<number, Contracts> = {
  // Fill these three with your deployed addresses on Coston2
  [COSTON2_CHAIN_ID]: {
    amm: '0x1CE3D5B5EBD3FC147b42DCe5C64b2036D24D7aEa', // MiniAMM, LPToken contract
    token0: '0xda84b7739C4C43E1F837e74Fa5D66F4a0EE82726', // MockERC20 #1
    token1: '0xA6E809b6107f254Dcb9487270bE6C61FB41E57A8', // MockERC20 #2
  },
};

export const getContracts = (chainId: number): Contracts | undefined => {
  return CONTRACTS[chainId];
};
