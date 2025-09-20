'use client';

import { useAccount } from 'wagmi';
import { useAtom } from 'jotai';
import { Header } from './components/layout/Header';
import { Container } from './components/layout/Container';
import { Card } from './components/common/Card';
import { MintToken } from './components/tokens/MintToken';
import { ApproveToken } from './components/tokens/ApproveToken';
import { AddLiquidity } from './components/liquidity/AddLiquidity';
import { RemoveLiquidity } from './components/liquidity/RemoveLiquidity';
import { SwapInterface } from './components/swap/SwapInterface';
import { SwapPreview } from './components/swap/SwapPreview';
import { BalanceDisplay } from './components/common/BalanceDisplay';
import { PoolInfo } from './components/common/PoolInfo';
import { Tabs } from './components/common/Tabs';
import { useBalances, usePoolState } from './hooks';
import { activeViewAtom, liquidityViewAtom } from '@/app/atoms';

export default function Home() {
  const { isConnected } = useAccount();
  const [activeView, setActiveView] = useAtom(activeViewAtom);
  const [liquidityView, setLiquidityView] = useAtom(liquidityViewAtom);

  // Activate balance and pool hooks
  useBalances();
  usePoolState();

  const mainTabs = [
    { id: 'swap', label: 'Swap', icon: '🔄' },
    { id: 'liquidity', label: 'Liquidity', icon: '💧' },
    { id: 'mint', label: 'Mint & Approve', icon: '🪙' },
  ];

  const liquidityTabs = [
    { id: 'add', label: 'Add Liquidity' },
    { id: 'remove', label: 'Remove Liquidity' },
  ];

  return (
    <div className="min-h-screen bg-neutral-dark/5">
      <Header />

      <div
        className={`transition-all duration-500 ease-in-out ${
          !isConnected
            ? 'opacity-100'
            : 'opacity-0 pointer-events-none absolute'
        }`}
      >
        {!isConnected && (
          // Pre-connect landing page with live data
          <Container className="py-8">
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Welcome to MiniAMM
              </h1>
              <p className="text-lg md:text-xl text-neutral-dark/70 mb-6 max-w-2xl mx-auto px-4 md:px-0">
                A minimal Uniswap V2 style AMM on Flare Coston2 testnet. Swap
                tokens, provide liquidity, and earn from trading fees.
              </p>
              <div className="flex flex-col gap-4 items-center mb-8">
                <p className="text-sm text-neutral-dark/50">
                  Connect your wallet using the button in the header to start
                  trading
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
              {/* Left column - Pool information */}
              <div className="space-y-6">
                <PoolInfo />

                <Card
                  title="How it Works"
                  subtitle="Learn about automated market making"
                >
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">🔄</div>
                      <div>
                        <h4 className="font-semibold mb-1">Automated Swaps</h4>
                        <p className="text-sm text-neutral-dark/60">
                          Trade tokens instantly using the constant product
                          formula (x * y = k)
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">💧</div>
                      <div>
                        <h4 className="font-semibold mb-1">
                          Liquidity Provision
                        </h4>
                        <p className="text-sm text-neutral-dark/60">
                          Provide equal value of both tokens to earn LP tokens
                          and trading fees
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">💰</div>
                      <div>
                        <h4 className="font-semibold mb-1">Earn Fees</h4>
                        <p className="text-sm text-neutral-dark/60">
                          Liquidity providers earn 0.3% of all trading volume
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Right column - Preview interface */}
              <div className="space-y-6">
                {activeView === 'swap' ? (
                  <SwapPreview />
                ) : (
                  <Card
                    title="Preview Interface"
                    subtitle="See what you can do after connecting"
                  >
                    <div className="space-y-4">
                      <Tabs
                        tabs={mainTabs}
                        activeTab={activeView}
                        onChange={(tab) =>
                          setActiveView(tab as 'swap' | 'liquidity' | 'mint')
                        }
                      />

                      <div className="bg-neutral-dark/5 rounded-lg p-6 text-center">
                        <div className="text-4xl mb-4">
                          {activeView === 'liquidity' && '💧'}
                          {activeView === 'mint' && '🪙'}
                        </div>
                        <h3 className="text-lg font-semibold mb-2">
                          {activeView === 'liquidity' && 'Manage Liquidity'}
                          {activeView === 'mint' && 'Mint & Approve Tokens'}
                        </h3>
                        <p className="text-sm text-neutral-dark/60 mb-4">
                          {activeView === 'liquidity' &&
                            'Add or remove liquidity to earn trading fees from every trade'}
                          {activeView === 'mint' &&
                            'Get test tokens and approve spending for the AMM contract'}
                        </p>
                        <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                          <p className="text-sm text-primary font-medium">
                            Connect your wallet to access this feature
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>
                )}

                <Card title="Network Information" subtitle="Contract details">
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-neutral-dark/60">Network:</span>
                      <span className="font-medium">Flare Coston2 Testnet</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-dark/60">Chain ID:</span>
                      <span className="font-mono">114</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-dark/60">Trading Fee:</span>
                      <span className="font-medium">0.3%</span>
                    </div>
                    <div className="border-t border-neutral-dark/10 pt-3">
                      <p className="text-xs text-neutral-dark/50 mb-2">
                        Need testnet tokens? Use the faucet after connecting
                        your wallet.
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </Container>
        )}
      </div>

      <div
        className={`transition-all duration-500 ease-in-out ${
          isConnected ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {isConnected && (
          // Post-connect main UI
          <Container className="py-8">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
              {/* Left column - Main interface */}
              <div className="space-y-6">
                <Tabs
                  tabs={mainTabs}
                  activeTab={activeView}
                  onChange={(tab) =>
                    setActiveView(tab as 'swap' | 'liquidity' | 'mint')
                  }
                />

                {activeView === 'swap' && <SwapInterface />}

                {activeView === 'liquidity' && (
                  <div className="space-y-4">
                    <Card>
                      <Tabs
                        tabs={liquidityTabs}
                        activeTab={liquidityView}
                        onChange={(tab) =>
                          setLiquidityView(tab as 'add' | 'remove')
                        }
                      />
                    </Card>

                    {liquidityView === 'add' && <AddLiquidity />}

                    {liquidityView === 'remove' && <RemoveLiquidity />}
                  </div>
                )}

                {activeView === 'mint' && (
                  <div className="space-y-6">
                    <MintToken />
                    <ApproveToken />
                  </div>
                )}
              </div>

              {/* Right column - Info & actions */}
              <div className="space-y-6">
                <BalanceDisplay />
                <PoolInfo />
              </div>
            </div>
          </Container>
        )}
      </div>
    </div>
  );
}
