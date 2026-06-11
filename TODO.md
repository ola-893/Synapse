# TODO — Move new UI into client + integrate backend

## Phase 1: Entry + routing correctness
- [ ] Update `client/src/main.tsx` to mount `client/src/App.tsx` (remove `client/src/synapse-ui/*` from runtime)
- [ ] Replace placeholder `client/src/App.tsx` with legacy app from `client/synapse/src/App.tsx` (but with no imports from `client/synapse/*`)

## Phase 2: Move legacy UI components into `client/src/` (no `client/synapse` references)
- [ ] Create `client/src/pages/LandingViewLegacy.tsx` from `client/synapse/src/components/LandingView.tsx`
- [ ] Create `client/src/pages/MarketplaceFeedLegacy.tsx` from `client/synapse/src/components/MarketplaceFeed.tsx`
- [ ] Create `client/src/pages/SellDataLegacy.tsx` from `client/synapse/src/components/SellData.tsx`
- [ ] Create `client/src/pages/AgentWalletLegacy.tsx` from `client/synapse/src/components/AgentWallet.tsx`
- [ ] Wire imports in the new `client/src/App.tsx` to use the new moved files

## Phase 3: Backend wiring (one slice at a time)
- [ ] Replace legacy `synapse-ui/synapseApi` calls inside the moved pages with direct `client/src/lib/api.ts` calls
- [ ] Validate marketplace list + buy endpoints integration
- [ ] Validate agent status + start/stop integration
- [ ] Validate encryption/decrypt UX behavior (where backend doesn’t yet provide ciphertext/plaintext)

## Phase 4: Remove `client/src/synapse-ui/*`
- [ ] Delete `client/src/synapse-ui/App.tsx` and `client/src/synapse-ui/synapseApi.ts`
- [ ] Ensure no remaining references to `client/src/synapse-ui/*`

## Phase 5: Build/Run
- [ ] Run `pnpm/npm` or `vite build` / `vite dev` and fix TS/Vite errors

