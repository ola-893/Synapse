/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */


import { Wallet, FileText, Cpu, Database, Handshake, Lock, MonitorDot } from "lucide-react";

export function Landing({ onEnterApp }: { onEnterApp: () => void }) {
  return (
    <div className="bg-[#fcf9f0] text-[#1c1c14] min-h-screen relative overflow-x-hidden selection:bg-[#ebe5a9] selection:text-[#1e1d00]">
      {/* Background gradients */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 50% 0%, rgba(100, 96, 48, 0.05) 0%, transparent 50%), radial-gradient(circle at 100% 100%, rgba(65, 102, 82, 0.03) 0%, transparent 50%)",
        }}
      ></div>

      {/* TopNav for Landing */}
      <nav className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-6 md:px-16 h-20 bg-[rgba(252,249,240,0.8)] backdrop-blur-[12px] border-b border-[rgba(0,0,0,0.05)]">
        <div className="font-bold text-2xl tracking-tighter text-[#646030]">Synapse</div>
        <div className="flex items-center gap-4">
          <button
            onClick={onEnterApp}
            className="bg-[#646030] text-white font-semibold text-sm px-6 py-2.5 rounded-xl hover:bg-[#646030]/90 transition-colors duration-200 flex items-center gap-2"
          >
            Launch App
          </button>
          <button className="text-[#646030] hover:text-[#616043] transition-colors duration-200 flex items-center justify-center w-10 h-10 rounded-full hover:bg-black/5">
            <Wallet className="w-5 h-5" />
          </button>
        </div>
      </nav>

      <main className="pt-32 pb-20 px-6 md:px-16 max-w-[1280px] mx-auto w-full relative z-10">
        {/* Hero */}
        <section className="min-h-[60vh] flex flex-col justify-center items-center text-center mb-32 relative">
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#646030] rounded-full blur-[150px] opacity-[0.08] pointer-events-none"
          ></div>
          <h1 className="text-5xl md:text-[72px] font-extrabold leading-[1.1] mb-6 max-w-4xl tracking-tight text-[#1c1c14]">
            Portable AI Memory. <br />
            <span className="text-[#646030]">On-Chain Encryption.</span>
          </h1>
          <p className="text-lg md:text-xl text-[#48473a] max-w-2xl mb-12 leading-relaxed">
            The decentralized privacy layer for autonomous agents. Store, encrypt, and verify agent memory across the
            verifiable computation stack.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <button
              onClick={onEnterApp}
              className="bg-[#646030] text-white font-semibold text-sm px-8 py-4 rounded-xl hover:bg-[#646030]/90 transition-colors duration-200 flex items-center gap-3 shadow-sm"
            >
              <Wallet className="w-5 h-5" />
              Launch App
            </button>
            <button className="bg-white/70 backdrop-blur-md border border-black/5 text-[#1c1c14] font-semibold text-sm px-8 py-4 rounded-xl hover:bg-white/90 transition-all duration-200 flex items-center gap-3 shadow-sm">
              <FileText className="w-5 h-5" />
              Read Docs
            </button>
          </div>
        </section>

        {/* Ticker */}
        <section className="mb-32">
          <div className="bg-white/70 backdrop-blur-md border border-black/5 shadow-sm rounded-2xl p-8 overflow-hidden relative border-l-4 border-l-[#616043]">
            <div className="flex flex-wrap md:flex-nowrap justify-between items-center gap-8 text-center md:text-left">
              <div className="flex-1">
                <div className="text-xs font-semibold text-[#48473a] mb-2 uppercase tracking-widest">Total Agents</div>
                <div className="font-mono text-3xl font-bold text-[#616043] flex items-center gap-3 justify-center md:justify-start">
                  <Cpu className="w-6 h-6 inline-block" />
                  <span>142,854</span>
                </div>
              </div>
              <div className="hidden md:block w-px h-12 bg-black/10"></div>
              <div className="flex-1">
                <div className="text-xs font-semibold text-[#48473a] mb-2 uppercase tracking-widest">Memory Blobs</div>
                <div className="font-mono text-3xl font-bold text-[#646030] flex items-center gap-3 justify-center md:justify-start">
                  <Database className="w-6 h-6 inline-block" />
                  <span>8.4M</span>
                </div>
              </div>
              <div className="hidden md:block w-px h-12 bg-black/10"></div>
              <div className="flex-1">
                <div className="text-xs font-semibold text-[#48473a] mb-2 uppercase tracking-widest">x402 Negotiations</div>
                <div className="font-mono text-3xl font-bold text-[#416652] flex items-center gap-3 justify-center md:justify-start">
                  <Handshake className="w-6 h-6 inline-block" />
                  <span>2.1B</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Bento */}
        <section className="mb-32">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/70 backdrop-blur-md border border-black/5 shadow-sm rounded-2xl p-8 hover:-translate-y-1 transition-all duration-300 group flex flex-col h-full relative overflow-hidden">
              <div
                className="absolute top-0 right-0 w-32 h-32 bg-[#646030] blur-[60px] opacity-[0.08] group-hover:opacity-[0.15] transition-opacity"
              ></div>
              <div className="w-14 h-14 rounded-xl bg-[#ebe5a9] border border-[#646030]/20 flex items-center justify-center mb-6 text-[#646030]">
                <Cpu className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold text-[#1c1c14] mb-3">MemWal</h3>
              <p className="text-[#48473a] flex-grow leading-relaxed">
                Persistent, verifiable memory for AI agents. State is anchored on-chain, ensuring agents maintain consistent
                context across sessions without centralized storage risks.
              </p>
              <div className="mt-8 inline-flex items-center gap-2 bg-[#fcf9f0] px-3 py-1.5 rounded-full border border-[#c9c7b6] w-fit">
                <div className="w-2 h-2 rounded-full bg-[#646030] animate-pulse"></div>
                <span className="text-[11px] font-semibold text-[#646030]">Active Sync</span>
              </div>
            </div>

            <div className="bg-white/70 backdrop-blur-md border border-black/5 shadow-sm rounded-2xl p-8 hover:-translate-y-1 transition-all duration-300 group flex flex-col h-full relative overflow-hidden">
              <div
                className="absolute top-0 right-0 w-32 h-32 bg-[#416652] blur-[60px] opacity-[0.08] group-hover:opacity-[0.15] transition-opacity"
              ></div>
              <div className="w-14 h-14 rounded-xl bg-[#c3ecd3] border border-[#416652]/20 flex items-center justify-center mb-6 text-[#416652]">
                <Lock className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold text-[#1c1c14] mb-3">Seal</h3>
              <p className="text-[#48473a] flex-grow leading-relaxed">
                Threshold encryption protocol for sensitive agent logic and private keys. Computations happen within
                secure enclaves, mathematically verified without exposing raw data.
              </p>
              <div className="mt-8 inline-flex items-center gap-2 bg-[#fcf9f0] px-4 py-1.5 rounded-full border border-[#c9c7b6] w-fit">
                <Lock className="w-3.5 h-3.5 text-[#416652]" />
                <span className="text-[11px] font-semibold text-[#416652]">Encrypted Environment</span>
              </div>
            </div>

            <div className="bg-white/70 backdrop-blur-md border border-black/5 shadow-sm rounded-2xl p-8 hover:-translate-y-1 transition-all duration-300 group flex flex-col h-full relative overflow-hidden">
              <div
                className="absolute top-0 right-0 w-32 h-32 bg-[#616043] blur-[60px] opacity-[0.08] group-hover:opacity-[0.15] transition-opacity"
              ></div>
              <div className="w-14 h-14 rounded-xl bg-[#e8e4c0] border border-[#616043]/20 flex items-center justify-center mb-6 text-[#616043]">
                <Database className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold text-[#1c1c14] mb-3">Walrus Data Objects</h3>
              <p className="text-[#48473a] flex-grow leading-relaxed">
                Programmable lifecycle management for unstructured agent data. Define expiry, access rules, and automated
                pruning via smart contracts on the Walrus Network.
              </p>
              <div className="mt-8 inline-flex items-center gap-2 bg-[#fcf9f0] px-4 py-1.5 rounded-full border border-[#c9c7b6] w-fit">
                <MonitorDot className="w-3.5 h-3.5 text-[#616043]" />
                <span className="text-[11px] font-semibold text-[#616043]">Lifecycle Rules Active</span>
              </div>
            </div>
          </div>
        </section>

        {/* Arch diagram */}
        <section className="mb-20">
          <h2 className="text-4xl font-bold text-center mb-16 text-[#1c1c14]">System Architecture</h2>
          <div className="bg-white/70 backdrop-blur-md border border-black/5 shadow-sm rounded-[32px] p-8 md:p-16 relative overflow-hidden">
            {/* bg grid */}
            <div
              className="absolute inset-0 opacity-[0.15]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)",
                backgroundSize: "40px 40px",
              }}
            ></div>

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 max-w-5xl mx-auto">
              <div className="flex flex-col items-center flex-1 w-full relative z-20">
                <div className="w-24 h-24 rounded-3xl bg-[#fcf9f0] flex items-center justify-center mb-6 border border-[#c9c7b6] shadow-sm">
                  <Cpu className="w-10 h-10 text-[#1c1c14]" />
                </div>
                <div className="text-xl font-bold text-center mb-1 text-[#1c1c14]">AI Agents</div>
                <div className="font-mono text-xs text-[#48473a] text-center">Execution Layer</div>
              </div>

              <div className="hidden md:flex items-center justify-center text-[#c9c7b6] relative z-10 flex-1">
                <div className="h-px w-24 bg-gradient-to-r from-[#c9c7b6] to-[#646030] relative">
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#646030] shadow-[0_0_10px_rgba(100,96,48,0.5)]"></div>
                </div>
              </div>

              <div className="flex flex-col items-center flex-1 w-full relative z-20">
                <div className="w-32 h-32 rounded-full bg-[#ebe8df] border-2 border-[#646030] shadow-[0_0_30px_rgba(100,96,48,0.15)] flex items-center justify-center mb-6 overflow-hidden relative">
                  <span className="text-2xl font-black text-[#646030] tracking-tight relative z-10">CORE</span>
                </div>
                <div className="text-xl font-bold text-center mb-1 text-[#1c1c14]">Synapse Core</div>
                <div className="font-mono text-xs text-[#48473a] text-center">Orchestration</div>
              </div>

              <div className="hidden md:flex items-center justify-center text-[#c9c7b6] relative z-10 flex-1">
                <div className="h-px w-24 bg-gradient-to-r from-[#646030] to-[#416652] relative">
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#416652] shadow-[0_0_10px_rgba(65,102,82,0.5)]"></div>
                </div>
              </div>

              <div className="flex flex-col gap-4 flex-1 w-full relative z-20">
                <div className="bg-[#fcf9f0] px-5 py-4 rounded-xl border border-[#c9c7b6] border-l-4 border-l-[#646030] flex items-center gap-3 shadow-sm">
                  <Cpu className="w-5 h-5 text-[#646030]" />
                  <span className="font-medium text-sm text-[#1c1c14]">MemWal</span>
                </div>
                <div className="bg-[#fcf9f0] px-5 py-4 rounded-xl border border-[#c9c7b6] border-l-4 border-l-[#416652] flex items-center gap-3 shadow-sm">
                  <Lock className="w-5 h-5 text-[#416652]" />
                  <span className="font-medium text-sm text-[#1c1c14]">Seal</span>
                </div>
                <div className="bg-[#fcf9f0] px-5 py-4 rounded-xl border border-[#c9c7b6] border-l-4 border-l-[#616043] flex items-center gap-3 shadow-sm">
                  <Database className="w-5 h-5 text-[#616043]" />
                  <span className="font-medium text-sm text-[#1c1c14]">Walrus Objects</span>
                </div>
              </div>

              <div className="hidden md:flex items-center justify-center text-[#c9c7b6] relative z-10 flex-1">
                <div className="h-px w-24 bg-gradient-to-r from-[#416652] to-[#616043] relative">
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#616043] shadow-[0_0_10px_rgba(97,96,67,0.5)]"></div>
                </div>
              </div>

              <div className="flex flex-col items-center flex-1 w-full relative z-20">
                <div className="w-24 h-24 rounded-3xl bg-[#e8e4c0] border border-[#616043]/30 flex items-center justify-center mb-6 shadow-sm">
                  <Database className="w-10 h-10 text-[#616043]" />
                </div>
                <div className="text-xl font-bold text-center mb-1 text-[#1c1c14]">Sui Move & Walrus</div>
                <div className="font-mono text-xs text-[#48473a] text-center">Settlement / Storage</div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

