'use client';

import { useAccount } from 'wagmi';
import { Container } from './Container';
import { ConnectButton } from '../wallet/ConnectButton';

export function Header() {
  const { isConnected } = useAccount();

  return (
    <header className="bg-white border-b border-neutral-dark/10">
      <Container className="py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              MiniAMM
            </h1>
            <span className="text-xs text-neutral-dark/60 bg-neutral-dark/10 px-2 py-1 rounded-full hidden sm:inline-block">
              Coston2 Testnet
            </span>
          </div>
          <div className="flex items-center gap-4">
            <ConnectButton />
          </div>
        </div>
      </Container>
    </header>
  );
}
