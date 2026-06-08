import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Coins,
  Database,
  Lock,
  Search,
  Store,
  UploadCloud,
} from 'lucide-react';

export function Landing({ onEnterApp }: { onEnterApp: () => void }) {
  return (
    <div className="min-h-screen bg-[#fcf9f0] text-[#1c1c14] selection:bg-[#ebe5a9] selection:text-[#1e1d00]">
      <nav className="sticky top-0 z-50 flex h-20 items-center justify-between border-b border-black/5 bg-[#fcf9f0]/90 px-6 backdrop-blur md:px-16">
        <div className="flex items-center gap-3">
          {/* <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#c9c7b6] bg-[#ebe5a9]">
            <Store className="h-5 w-5 text-[#646030]" />
          </div> */}
          <div>
            <div className="text-lg font-bold tracking-tight text-[#1c1c14]">Synapse</div>
            <div className="text-xs font-semibold text-[#646030]"></div>
          </div>
        </div>
        <button
          onClick={onEnterApp}
          className="inline-flex items-center gap-2 rounded-lg bg-[#646030] px-5 py-3 text-sm font-semibold text-white hover:bg-[#545127]"
        >
          Open marketplace
          <ArrowRight className="h-4 w-4" />
        </button>
      </nav>

      <main>
        <section className="mx-auto grid min-h-[calc(100vh-80px)] max-w-6xl grid-cols-1 items-center gap-10 px-6 py-12 md:px-16 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="mb-4 inline-flex rounded-full border border-[#c9c7b6] bg-white px-3 py-1 text-sm font-semibold text-[#646030]">
              Buy and sell useful data for AI agents
            </p>
            <h1 className="max-w-4xl text-4xl font-extrabold leading-tight tracking-tight text-[#1c1c14] sm:text-5xl lg:text-6xl">
              A simple data marketplace where agents can learn on their own.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[#48473a]">
              Sellers upload private datasets, set a price, and publish them. Agent owners create a wallet, fund it with
              SUI, and let their agent discover and buy useful data automatically.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={onEnterApp}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#646030] px-6 py-4 text-sm font-bold text-white shadow-sm hover:bg-[#545127]"
              >
                Browse data
                <Search className="h-5 w-5" />
              </button>
              <a
                href="/sell"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#c9c7b6] bg-white px-6 py-4 text-sm font-bold text-[#1c1c14] shadow-sm hover:bg-[#f3efe0]"
              >
                Sell data
                <UploadCloud className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div className="rounded-lg border border-[#c9c7b6] bg-white p-4 shadow-sm">
            <div className="rounded-lg bg-[#f3efe0] p-4">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-mono uppercase tracking-widest text-[#797869]">Agent activity</p>
                  <h2 className="mt-1 text-xl font-bold">Looking for useful data</h2>
                </div>
                <div className="rounded-full bg-[#c3ecd3] px-3 py-1 text-xs font-bold text-[#416652]">Live</div>
              </div>
              <div className="space-y-3">
                {[
                  ['Scan', 'Checking the marketplace for fresh datasets', Search],
                  ['Evaluate', 'Comparing price, topic, and usefulness', Bot],
                  ['Buy', 'Paying the seller when data looks valuable', Coins],
                  ['Learn', 'Adding purchased data to agent memory', Database],
                ].map(([label, detail, Icon]) => (
                  <div key={label as string} className="flex items-center gap-3 rounded-lg border border-[#c9c7b6] bg-white p-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#ebe5a9] text-[#646030]">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">{label as string}</p>
                      <p className="text-sm text-[#48473a]">{detail as string}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-[#c9c7b6] bg-white">
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-6 py-12 md:grid-cols-3 md:px-16">
            <div>
              <p className="text-3xl font-extrabold text-[#646030]">1</p>
              <h2 className="mt-3 text-xl font-bold">Sellers list data</h2>
              <p className="mt-2 leading-relaxed text-[#48473a]">
                Upload research, CSVs, PDFs, signals, or knowledge packs. The app encrypts the data before storage.
              </p>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-[#646030]">2</p>
              <h2 className="mt-3 text-xl font-bold">Agents browse and buy</h2>
              <p className="mt-2 leading-relaxed text-[#48473a]">
                Fund an agent wallet once. Your agent can then find relevant datasets and pay sellers automatically.
              </p>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-[#646030]">3</p>
              <h2 className="mt-3 text-xl font-bold">Everyone stays in control</h2>
              <p className="mt-2 leading-relaxed text-[#48473a]">
                Sellers set the price. Buyers control the wallet. Private data remains protected until access is purchased.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-14 md:px-16">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-[#c9c7b6] bg-[#f3efe0] p-6">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-white text-[#416652]">
                <UploadCloud className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-bold">For data sellers</h2>
              <ul className="mt-5 space-y-3 text-[#48473a]">
                {['Upload datasets from your browser', 'Set a price in SUI', 'Earn when agents purchase access'].map((item) => (
                  <li key={item} className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#416652]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-[#c9c7b6] bg-[#f3efe0] p-6">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-white text-[#646030]">
                <Bot className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-bold">For agent owners</h2>
              <ul className="mt-5 space-y-3 text-[#48473a]">
                {['Create a dedicated agent wallet', 'Fund the wallet with SUI', 'Let the agent buy and learn from data'].map((item) => (
                  <li key={item} className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#416652]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-10 rounded-lg border border-[#c9c7b6] bg-white p-6 text-center">
            <Lock className="mx-auto mb-3 h-7 w-7 text-[#416652]" />
            <h2 className="text-2xl font-bold">Private by default</h2>
            <p className="mx-auto mt-2 max-w-2xl leading-relaxed text-[#48473a]">
              The technical parts still run underneath, but the app keeps them out of the way: encryption, storage, wallet
              signing, and marketplace payments are presented as simple steps.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
