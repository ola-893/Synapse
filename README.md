# Synapse

**Autonomous On-Chain Knowledge Economy**

![Sui Testnet](https://img.shields.io/badge/Sui-testnet-4DA2FF)
![Docker](https://img.shields.io/badge/Docker-ready-2496ED)

## Overview

Synapse is a decentralized data marketplace on Sui where sellers publish encrypted datasets and autonomous AI agents buy useful knowledge with funded command wallets. Sellers keep control of their wallet signing flow: data is encrypted in the browser, uploaded to Walrus, and listed on-chain through a transaction signed by the seller's Sui wallet.

The project explores a core primitive for the AI agent economy: agents need a trustworthy way to discover, value, purchase, decrypt, and remember data without a human approving every step. Synapse connects on-chain ownership, decentralized storage, threshold encryption, and persistent agent memory into one working marketplace loop.

## How It Works

### Journey A: The Data Seller

The seller connects a Sui wallet, uploads or pastes dataset content, encrypts it client-side with Seal, uploads the encrypted payload to Walrus, signs the marketplace listing transaction, and earns SUI when buyers purchase access.

### Journey B: The Agent Owner

The agent owner registers an agent, receives a dedicated command wallet, funds that wallet with SUI, starts the agent loop, and watches the agent scan listings and buy useful datasets autonomously.

### Journey C: The Autonomous Agent

The agent wakes every minute, scans marketplace listings, evaluates relevance with Gemini AI or the local keyword fallback, purchases datasets that fit its goals and budget, decrypts eligible data with Seal, and stores learned memory in MemWal.

## Tech Stack

| Layer | Technology |
|---|---|
| Blockchain | Sui Move, Sui testnet |
| Storage | Walrus |
| Encryption | `@mysten/seal` |
| Wallet UI | `@mysten/dapp-kit` |
| Backend | Node.js, Express, TypeScript |
| Database | SQLite |
| Frontend | React, Vite, Tailwind |
| Runtime | Docker |
| Agent intelligence | Gemini AI, keyword fallback |
| Agent memory | MemWal |

## Quick Start

```bash
git clone https://github.com/ola-893/Synapse && cd Synapse
cp server/.env.example server/.env
# Edit server/.env — add your GEMINI_API_KEY
docker-compose up --build
# Frontend: http://localhost:5173
# Backend:  http://localhost:3002
```

## API Reference

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/marketplace/listings` | Return active indexed and on-chain marketplace listings |
| `POST` | `/api/marketplace/list` | Index a browser-signed seller listing for fast reads |
| `POST` | `/api/agent/register` | Register or load an agent command wallet for an owner |
| `GET` | `/api/agent/wallet?ownerAddress=0x...` | Return the command wallet for an owner |
| `POST` | `/api/agent/start` | Start the autonomous agent loop |
| `POST` | `/api/agent/stop` | Stop the autonomous agent loop |
| `GET` | `/api/agent/status` | Return runtime status, active owner, wallet, and tick count |
| `GET` | `/api/agent/purchases?ownerAddress=0x...` | Return purchase history for an owner |

## Architecture

```text
Seller Browser          Sui Testnet             Agent (Server)
─────────────           ──────────              ──────────────
Connect Wallet
Encrypt w/ Seal  ──▶   Walrus Storage
Upload Blob      ──▶   (encrypted)
Sign Listing Tx  ──▶   Marketplace Contract  ◀── Agent scans
                       (DatasetListing)            │
                       (PurchaseReceipt)   ◀───── Agent buys
                                                   │
                                                Seal decrypts
                                                   │
                                                MemWal stores
```

## Hackathon Context

Synapse is built around Sui, Walrus, Seal, and MemWal integrations: Sui anchors marketplace ownership and purchase receipts, Walrus stores encrypted dataset blobs, Seal gates decryption through threshold access control, and MemWal gives autonomous agents persistent memory after they purchase and ingest knowledge.
