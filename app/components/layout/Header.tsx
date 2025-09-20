'use client';

import { Container } from './Container';
import { ConnectButton } from '../wallet/ConnectButton';

export function Header() {
  return (
    <header className="bg-white border-b border-neutral-dark/10">
      <Container className="py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              MiniAMM
            </h1>
            <span
              style={{
                padding: '4px 8px',
              }}
              className="text-xs text-neutral-dark/60 bg-neutral-dark/10 rounded-full hidden sm:inline-block"
            >
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
