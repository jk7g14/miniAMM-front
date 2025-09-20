# MiniAMM Frontend Development Plan

## Overview

Build a Uniswap V2-style AMM interface for interacting with deployed contracts on Flare Coston2 testnet.

## Phase 1: Foundation Setup

### 1. Setup project foundation with design system and global styles

- [ ] Create design system tokens (colors, typography, spacing)
- [ ] Setup Tailwind CSS with custom theme configuration
- [ ] Create base component styles
- [ ] Setup global CSS variables

### 2. Implement wallet connection with RainbowKit and initial UI layout

- [ ] Configure RainbowKit for Coston2 testnet
- [ ] Create header component with wallet connect button
- [ ] Implement pre-connect landing page (title/logo)
- [ ] Create main layout structure that appears after connection

### 3. Setup Jotai state management

- [ ] Create atoms for wallet state (address, chainId, connected)
- [ ] Create atoms for token balances
- [ ] Create atoms for AMM state (reserves, LP balance)
- [ ] Create atoms for UI states (loading, errors, selected tokens)

## Phase 2: Contract Integration

### 4. Create contract hooks and utilities

- [ ] Create custom hooks for reading contract data
- [ ] Create utilities for formatting BigNumbers
- [ ] Setup ethers.js providers and signers
- [ ] Create transaction helpers with error handling

## Phase 3: Core Features (In Order)

### 5. Build token minting interface

- [ ] Create mint component for both MockERC20 tokens
- [ ] Add input validation (max supply, decimals)
- [ ] Show current token balances
- [ ] Implement transaction feedback

### 6. Implement token approval flow

- [ ] Check current allowances
- [ ] Create approval interface for both tokens
- [ ] Show approval status indicators
- [ ] Handle infinite vs specific approval amounts

### 7. Create add liquidity interface

- [ ] Build dual token input component
- [ ] Calculate required token ratios
- [ ] Show expected LP tokens to receive:
  - [ ] Exact amount of LP tokens
  - [ ] Pool share percentage after addition
  - [ ] Value breakdown in Token0 and Token1
- [ ] Implement slippage protection
- [ ] Add transaction confirmation flow

### 8. Build swap interface

- [ ] Create token selector (Token0 ↔ Token1)
- [ ] Implement input amount field
- [ ] Calculate output using constant product formula: `outputAmount = (inputAmount * outputReserve) / (inputReserve + inputAmount)`
- [ ] Show price impact and exchange rate
- [ ] Add swap execution with loading states

### 9. Implement remove liquidity functionality

- [ ] Create LP token input interface
- [ ] Show current LP token holdings:
  - [ ] LP token balance
  - [ ] Current pool share percentage
  - [ ] Underlying token values
- [ ] Calculate expected token outputs:
  - [ ] Token0 amount to receive
  - [ ] Token1 amount to receive
  - [ ] Impact on pool share
- [ ] Implement removal transaction flow

## Phase 4: Polish & UX

### 10. Add real-time balance displays

- [ ] Show wallet balances for Token0, Token1, and LP tokens
- [ ] Display AMM contract reserves
- [ ] Update balances after each transaction
- [ ] Add refresh functionality
- [ ] Show LP token specific information:
  - [ ] Total LP token supply
  - [ ] User's LP token balance and percentage of total supply
  - [ ] Value of LP tokens in underlying Token0 and Token1
  - [ ] Historical LP token minting/burning events
  - [ ] APY/fees earned (if applicable)

### 11. Implement transaction loading states

- [ ] Add loading spinners during transactions
- [ ] Disable buttons while pending
- [ ] Show transaction status messages
- [ ] Implement error handling with user-friendly messages
- [ ] Add transaction success notifications

### 12. Final UI polish

- [ ] Ensure responsive design for mobile/tablet
- [ ] Add hover states and transitions
- [ ] Implement keyboard navigation
- [ ] Test all flows end-to-end
- [ ] Add tooltips for complex features

## Technical Architecture

### State Management (Jotai)

```
atoms/
  ├── wallet.ts      # Wallet connection state
  ├── balances.ts    # Token & LP balances
  ├── amm.ts         # AMM reserves & calculations
  └── ui.ts          # Loading states, errors, selections
```

### Component Structure

```
components/
  ├── layout/
  │   ├── Header.tsx
  │   └── Container.tsx
  ├── wallet/
  │   └── ConnectButton.tsx
  ├── tokens/
  │   ├── MintToken.tsx
  │   └── ApproveToken.tsx
  ├── liquidity/
  │   ├── AddLiquidity.tsx
  │   └── RemoveLiquidity.tsx
  ├── swap/
  │   ├── SwapInterface.tsx
  │   └── TokenSelector.tsx
  └── common/
      ├── Button.tsx
      ├── Input.tsx
      └── Card.tsx
```

### Key Libraries

- Next.js 13+ (App Router)
- TypeScript
- Ethers.js v6
- RainbowKit
- Jotai
- Tailwind CSS
- TypeChain (already generated)

## Design Tokens Implementation

```typescript
// Primary: #FF007A
// Secondary: #D973A3
// Neutral Dark: #33363D
// White: #FFFFFF
// Black: #000000

// Typography:
// Heading: Inter 700 32px
// Body: Inter 400 16px
// Button: Inter 500 14px

// Spacing: 8px grid system
// Container: max 1200px
// Section padding: 64px

// Button Primary:
// bg: #FF007A, text: #FFFFFF
// radius: 8px, padding: 12px 20px
```

## Success Criteria

- [x] All contract addresses properly configured
- [ ] Wallet connection works on Coston2
- [ ] Users can mint test tokens
- [ ] Approval flow is clear and functional
- [ ] Liquidity can be added/removed
- [ ] Swaps execute correctly with proper calculations
- [ ] All balances update in real-time
- [ ] Loading states prevent double transactions
- [ ] UI matches design specifications
- [ ] Mobile responsive
