import type { Metadata } from 'next';
import './globals.css';
import { Web3Provider } from './providers/Web3Provider';
import { Notification } from './components/common/Notification';

export const metadata: Metadata = {
  title: 'MiniAMM - Uniswap V2 Style DEX',
  description: 'A minimal AMM implementation on Flare Coston2 testnet',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Web3Provider>
          {children}
          <Notification />
        </Web3Provider>
      </body>
    </html>
  );
}
