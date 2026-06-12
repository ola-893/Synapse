<p align="center">
  <img src="https://img.shields.io/badge/Sui-Move-blue?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0id2hpdGUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiLz48L3N2Zz4=" alt="Sui Move"/>
  <img src="https://img.shields.io/badge/Walrus-Storage-0D1117?style=for-the-badge" alt="Walrus"/>
  <img src="https://img.shields.io/badge/Seal-Encryption-EF4444?style=for-the-badge" alt="Seal"/>
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge" alt="License"/>
</p>

<h1 align="center">🧠 Synapse: Vanguard Cognitive Core</h1>

<p align="center">
  <strong>The Decentralized Data Marketplace for Autonomous AI Agents</strong>
</p>

---

## 📖 Overview

**Synapse** is a tactical, decentralized data marketplace designed for the AI era. Featuring a completely redesigned "Vanguard" cyber-aesthetic, Synapse bridges the gap between human data creators and autonomous AI agents. Human sellers can securely encrypt and list private datasets for sale. AI agent owners can fund dedicated "command wallets," enabling their agents to autonomously scan the marketplace, evaluate datasets, and purchase access to useful intelligence.

Built on the **Sui blockchain**, Synapse uses **Walrus** for decentralized data storage and **Seal** for threshold encryption. This ensures data is only accessible to buyers who cryptographically prove their purchase via on-chain smart contracts.

---

## 💻 Vanguard Core Modules

The UI has been restructured into three high-contrast tactical modules:

### `01 / DATA_MARKET` (Marketplace Feed)
A fully on-chain directory where all listed datasets are displayed. Each listing includes metadata, pricing, and an encrypted Walrus storage reference. Agents use this directory to evaluate and purchase data.

### `02 / PUBLISH_LOCK` (Sell Data)
The secure ingestion portal. Sellers upload files (CSV, JSON, TXT, PDF) or paste raw text. The application executes a secure 5-step publishing pipeline entirely in the browser: it generates a **Seal** policy ID, encrypts the payload locally (so plaintext never leaves the client), uploads the encrypted blob to **Walrus** storage, and finally publishes the metadata listing to the SUI ledger.

### `03 / COMMAND_WALLETS` (Agent Wallet)
A comprehensive command dashboard where Agent Owners can generate, fund, and monitor encrypted "buying wallets" for their AI agents (stored securely via SQLite on the backend). The interface features a **Runtime Trigger** to toggle the autonomous loop and a real-time **Cognitive Ingestion Engine Logs** terminal that streams the agent's decision-making process—such as memory checks, marketplace scans, candidate selection, and budget/topic evaluations.

---

## 👥 Core Personas

1. **Data Sellers**: Individuals or organizations with valuable private intelligence (research, trading signals, PDFs). They use `PUBLISH_LOCK` to set a price in SUI and earn cryptocurrency whenever an autonomous agent purchases their data.
2. **Agent Owners (Buyers)**: Users operating AI agents. They connect their Web3 Sui wallet and create a dedicated `COMMAND_WALLET` for their agent to operate autonomously.
3. **Autonomous Agents**: The automated consumers of the ecosystem. They scan the `DATA_MARKET`, evaluate listings, and execute secure on-chain transactions to acquire new knowledge.

---

## 🏗️ Tech Stack

- **Smart Contracts**: Sui Move
- **Decentralized Storage**: Walrus Protocol
- **Threshold Encryption**: `@mysten/seal`
- **Frontend**: React, Vite, TailwindCSS, Framer Motion, `@mysten/dapp-kit`
- **Backend**: Node.js, Express, SQLite, `@google/generative-ai`

---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js (v18+)
- Sui CLI

### 1. Clone the repository
```bash
git clone https://github.com/ola-893/Synapse.git
cd Synapse
```

### 2. Setup Environment Variables
Copy `.env.example` to `.env` and fill in the required values (e.g. `SUI_PRIVATE_KEY` for the backend master wallet, and Gemini API keys).

### 3. Start the Backend
```bash
cd server
npm install
npm run dev
```

### 4. Start the Frontend
In a new terminal window:
```bash
cd client
npm install
npm run dev
```

### 5. Access the Vanguard Interface
Open your browser and navigate to `http://localhost:5173`.
