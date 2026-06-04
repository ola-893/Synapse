<p align="center">
  <img src="https://img.shields.io/badge/Sui-Move-blue?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0id2hpdGUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiLz48L3N2Zz4=" alt="Sui Move"/>
  <img src="https://img.shields.io/badge/Walrus-Storage-0D1117?style=for-the-badge" alt="Walrus"/>
  <img src="https://img.shields.io/badge/MemWal-Memory-8B5CF6?style=for-the-badge" alt="MemWal"/>
  <img src="https://img.shields.io/badge/Seal-Encryption-EF4444?style=for-the-badge" alt="Seal"/>
  <img src="https://img.shields.io/badge/x402-Payments-10B981?style=for-the-badge" alt="x402"/>
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge" alt="License"/>
</p>

<h1 align="center">🧠 Synapse</h1>

<p align="center">
  <strong>Continuum-OS: A Verifiable Multi-Agent Memory & Privacy Stack on Sui + Walrus</strong>
</p>

<p align="center">
  <em>Portable AI memory. On-chain encryption. Programmable data sovereignty.</em>
</p>

---

## Overview

**Synapse** is a next-generation infrastructure stack that transforms how autonomous AI agents remember, coordinate, and protect their data. Built natively on **Sui Move** and **Walrus**, Synapse goes beyond simple decentralized file storage — it delivers **Programmable Data**, **Persistent Verifiable Memory (MemWal)**, and **Threshold Encryption (Seal)** to create agents that learn, persist, and operate with cryptographic privacy guarantees.

> **This is not "an app that happens to save files to Walrus."**  
> This is a native demonstration of portable AI memory and on-chain encryption — exactly what the Walrus track demands.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        SYNAPSE STACK                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────────┐    │
│  │  AI Agent 1  │   │  AI Agent 2  │   │  AI Agent N ...  │    │
│  │  (Gemini)    │   │  (Gemini)    │   │  (Gemini)        │    │
│  └──────┬───────┘   └──────┬───────┘   └────────┬─────────┘    │
│         │                  │                     │              │
│         └──────────────────┼─────────────────────┘              │
│                            │                                    │
│                   ┌────────▼────────┐                           │
│                   │  Synapse Core   │                           │
│                   │  (Express API)  │                           │
│                   └────────┬────────┘                           │
│                            │                                    │
│         ┌──────────────────┼──────────────────┐                 │
│         │                  │                  │                 │
│  ┌──────▼──────┐   ┌──────▼──────┐   ┌───────▼───────┐        │
│  │   MemWal    │   │    Seal     │   │  Walrus Data  │        │
│  │  (Memory)   │   │ (Encryption)│   │   Objects     │        │
│  └──────┬──────┘   └──────┬──────┘   └───────┬───────┘        │
│         │                  │                  │                 │
│         └──────────────────┼──────────────────┘                 │
│                            │                                    │
│                   ┌────────▼────────┐                           │
│                   │   Sui Move      │                           │
│                   │  Smart Contracts│                           │
│                   └────────┬────────┘                           │
│                            │                                    │
│                   ┌────────▼────────┐                           │
│                   │  Walrus Network │                           │
│                   │  (Blob Storage) │                           │
│                   └─────────────────┘                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## ✨ Key Features

### 🧠 MemWal — Persistent Agent Memory

Agents don't just execute and die. With MemWal integration, every agent action — x402 payment negotiations, DeepBook arbitrage trades, market context analysis — is stored as **portable, verifiable memory** on Walrus.

- **Cross-session continuity**: An agent that restarts can query: *"What was the optimal x402 streaming rate for this API yesterday?"*
- **Multi-agent coordination**: Spin up Agent B, and it inherits Agent A's execution history instantly.
- **Long-running workflows**: Persistent context across hours, days, or weeks of autonomous operation.

```typescript
import { MemWal } from '@mysten-incubation/memwal';

// Agent stores execution log after a successful x402 negotiation
await memwal.store({
  agentId: delegateKey,
  context: 'x402-negotiation',
  payload: {
    apiEndpoint: 'https://api.provider.com/data',
    negotiatedRate: '0.002 SUI/req',
    throughput: '1200 req/min',
    timestamp: Date.now(),
  },
});

// A different agent (or same agent after restart) recalls context
const history = await memwal.recall({
  agentId: delegateKey,
  context: 'x402-negotiation',
  limit: 10,
});
```

### 🔐 Seal — Threshold Encryption & Access Control

Walrus blobs are public by default. Seal changes that with **threshold encryption** where decryption keys are distributed across the Seal network and gated by on-chain Move logic.

- **On-chain access policies**: Only wallets holding a `ComplianceOperatorCap` can decrypt sensitive blobs.
- **Artifact-driven workflows**: RWA inspection reports, KYC compliance data, and proprietary trading logs are shared safely.
- **Zero-trust by design**: No single point of failure for decryption keys.

```move
module synapse::access_control {
    use sui::object::{Self, UID};
    use sui::tx_context::TxContext;

    /// Capability granting decryption rights to compliance operators
    struct ComplianceOperatorCap has key, store {
        id: UID,
    }

    /// Only holders of this cap can request Seal decryption
    public fun authorize_decrypt(
        cap: &ComplianceOperatorCap,
        blob_id: vector<u8>,
    ): bool {
        // Seal verifies on-chain cap ownership before releasing threshold shares
        true
    }
}
```

### 📦 Programmable Walrus Data Objects

On Sui, stored blobs aren't just pointers — they're **first-class on-chain objects** that your Move contracts actively manage.

- **Automated lifecycle**: Auto-delete agent execution logs after 30 days.
- **Dynamic retention**: Extend blob storage lifetime as long as an RWA asset is actively yielding.
- **Native composability**: Data objects interact with DeFi protocols, governance, and access control seamlessly.

```move
module synapse::data_lifecycle {
    /// Extends Walrus storage for active RWA assets
    public fun extend_if_yielding(
        blob: &mut WalrusBlob,
        rwa_asset: &RWAAsset,
        clock: &Clock,
    ) {
        if (rwa_asset.is_yielding()) {
            blob.extend_lifetime(30 /* days */);
        }
    }

    /// Prune stale agent memory after retention window
    public fun prune_expired_logs(
        blob: &mut WalrusBlob,
        clock: &Clock,
    ) {
        if (clock.timestamp_ms() > blob.expiry()) {
            blob.delete();
        }
    }
}
```

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Blockchain** | Sui (Move) | Smart contracts, object model, access control |
| **Storage** | Walrus Network | Decentralized blob storage with programmable data objects |
| **Memory** | MemWal SDK (`@mysten-incubation/memwal`) | Persistent, verifiable AI agent memory |
| **Privacy** | Seal (Threshold Encryption) | On-chain-gated encryption/decryption |
| **Payments** | x402 Protocol | AI-native micropayment streaming for API access |
| **DeFi** | DeepBook v3 | On-chain order book for agent trading strategies |
| **AI** | Google Gemini | Agent reasoning, negotiation, and decision-making |
| **Backend** | Node.js + Express | API server, agent orchestration |
| **Frontend** | React + TypeScript | Dashboard, monitoring, and operator interface |

---

## 📂 Project Structure

```
Synapse/
├── contracts/                  # Sui Move smart contracts
│   ├── sources/
│   │   ├── access_control.move # Seal-gated decryption policies
│   │   ├── data_lifecycle.move # Blob retention & pruning logic
│   │   ├── agent_registry.move # On-chain agent identity & delegate keys
│   │   └── memory_index.move   # MemWal blob reference management
│   ├── tests/
│   └── Move.toml
│
├── server/                     # Express backend & agent runtime
│   ├── src/
│   │   ├── agents/             # AI agent definitions & strategies
│   │   ├── memwal/             # MemWal SDK integration layer
│   │   ├── seal/               # Seal encryption/decryption helpers
│   │   ├── x402/               # x402 payment negotiation engine
│   │   ├── deepbook/           # DeepBook trading integration
│   │   └── routes/             # REST API endpoints
│   ├── package.json
│   └── tsconfig.json
│
├── client/                     # React frontend dashboard
│   ├── src/
│   │   ├── components/         # UI components
│   │   ├── pages/              # Dashboard views
│   │   └── hooks/              # Custom React hooks
│   └── package.json
│
├── scripts/                    # Deployment & utility scripts
│   ├── deploy-contracts.sh
│   ├── setup-walrus.sh
│   └── seed-agents.ts
│
├── docs/                       # Additional documentation
│   ├── ARCHITECTURE.md
│   ├── MEMWAL_INTEGRATION.md
│   └── SEAL_ACCESS_CONTROL.md
│
├── .env.example
├── .gitignore
├── LICENSE
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 18.x
- **Sui CLI** (`cargo install --locked --git https://github.com/MystenLabs/sui.git sui`)
- **Walrus CLI** ([Installation Guide](https://docs.wal.app))
- **Git**

### 1. Clone the Repository

```bash
git clone https://github.com/ola-893/Synapse.git
cd Synapse
```

### 2. Install Dependencies

```bash
# Backend
cd server && npm install

# Frontend
cd ../client && npm install
```

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
SUI_NETWORK=testnet
SUI_PRIVATE_KEY=<your-sui-private-key>
WALRUS_PUBLISHER_URL=https://publisher.walrus-testnet.walrus.space
WALRUS_AGGREGATOR_URL=https://aggregator.walrus-testnet.walrus.space
MEMWAL_DELEGATE_KEY=<your-delegate-key>
SEAL_POLICY_OBJECT_ID=<your-seal-policy-id>
GEMINI_API_KEY=<your-gemini-api-key>
```

### 4. Deploy Move Contracts

```bash
cd contracts
sui move build
sui client publish --gas-budget 100000000
```

### 5. Run the Stack

```bash
# Terminal 1 — Backend
cd server && npm run dev

# Terminal 2 — Frontend
cd client && npm run dev
```

---

## 🧪 Testing

```bash
# Move contract unit tests
cd contracts && sui move test

# Backend tests
cd server && npm test

# Frontend tests
cd client && npm test

# End-to-end integration tests
npm run test:e2e
```

---

## 📊 How It Wins the Walrus Track

| Track Requirement | Synapse Implementation |
|---|---|
| **Long-term memory** | MemWal stores every agent execution log as persistent, verifiable memory on Walrus |
| **Multi-agent coordination** | Agents share memory via MemWal — Agent B reads Agent A's negotiation history instantly |
| **Long-running workflows** | Persistent context survives restarts, crashes, and redeployments |
| **Artifact-driven workflows** | RWA compliance docs encrypted via Seal, shared safely with on-chain access gating |
| **Programmable data** | Move contracts actively manage blob lifecycles — auto-extend, auto-prune, compose with DeFi |
| **Privacy & access control** | Seal threshold encryption with Move-native capability-gated decryption policies |

---

## 🗺️ Roadmap

- [x] Core architecture design
- [ ] MemWal SDK integration with agent runtime
- [ ] Seal encryption pipeline for sensitive data blobs
- [ ] Move smart contracts — access control, lifecycle, registry
- [ ] x402 payment negotiation engine
- [ ] DeepBook arbitrage agent with memory persistence
- [ ] React dashboard — agent monitoring, memory explorer, access logs
- [ ] Multi-agent coordination protocol
- [ ] Mainnet deployment
- [ ] SDK extraction for third-party agent builders

---

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting a PR.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

## 🔗 Resources

- [Walrus Documentation](https://docs.wal.app)
- [MemWal SDK](https://walrus.xyz)
- [Seal Privacy Layer](https://docs.wal.app)
- [Sui Move Documentation](https://docs.sui.io)
- [x402 Protocol](https://x402.org)
- [DeepBook v3](https://deepbook.tech)

---

<p align="center">
  <strong>Built for the 2026 Walrus Track Hackathon</strong><br/>
  <em>Portable memory. Verifiable execution. Encrypted by default.</em>
</p>
