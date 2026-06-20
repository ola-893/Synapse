# Deployment Checklist - Multi-Wallet Isolation Verified

## ✅ Pre-Deployment Verification (COMPLETE)

- [x] Two-wallet isolation tested locally
- [x] Independent agent addresses confirmed
- [x] Independent tick counts verified
- [x] Stop one / other continues verified
- [x] Isolated logs confirmed
- [x] Database shows distinct wallet entries
- [x] README updated with isolation guarantee
- [x] No TypeScript errors in core runtime files

## 🚀 Backend Deployment Steps

### 1. Choose Hosting Platform
Pick one: **Render** (recommended for Node.js), **Railway**, or **Fly.io**

### 2. Deploy Backend

**Option A: Render (Recommended)**
```bash
# Connect GitHub repo to Render
# Create new Web Service
# Build Command: npm install && cd server && npm install
# Start Command: cd server && npm run dev
```

**Option B: Railway**
```bash
railway login
railway init
railway up
```

**Option C: Manual Deploy**
```bash
# Push to your platform of choice via git or CLI
# Ensure Node.js 18+ runtime is selected
```

### 3. Set Environment Variables

Copy all variables from `server/.env` to your hosting platform's environment settings:

**Required:**
```
PORT=3002
DATABASE_URL=./data/agents.db
SUI_NETWORK=testnet
WALRUS_AGGREGATOR_URL=https://aggregator.testnet.walrus.space
GEMINI_API_KEY=your_key_here
```

**Optional (for full features):**
```
MEMWAL_PRIVATE_KEY=your_memwal_key
MEMWAL_ACCOUNT_ID=your_account_id
SEAL_VAULT_ID=your_vault_id
SEAL_PACKAGE_ID=your_package_id
```

### 4. Configure CORS

**For demo purposes (open access):**
```typescript
// server/src/index.ts
app.use(cors({ origin: '*' }));
```

**For production (restrict to your domain):**
```typescript
app.use(cors({ origin: 'https://your-netlify-site.netlify.app' }));
```

### 5. Verify Backend is Live

```bash
# Replace YOUR_BACKEND_URL with your deployed backend
curl https://YOUR_BACKEND_URL/api/health

# Expected: {"status":"ok","timestamp":...}
```

### 6. Re-Run Isolation Test Against Live Backend

**CRITICAL: Run this before deploying frontend**

```bash
# Replace YOUR_BACKEND_URL
export API_URL="https://YOUR_BACKEND_URL"

# Test 1: Register two wallets
curl -X POST $API_URL/api/agent/register \
  -H "Content-Type: application/json" \
  -d '{"ownerAddress":"0xtest_wallet_alpha"}'

curl -X POST $API_URL/api/agent/register \
  -H "Content-Type: application/json" \
  -d '{"ownerAddress":"0xtest_wallet_beta"}'

# Verify two different agent addresses returned

# Test 2: Start both
curl -X POST $API_URL/api/agent/start \
  -H "Content-Type: application/json" \
  -d '{"ownerAddress":"0xtest_wallet_alpha"}'

curl -X POST $API_URL/api/agent/start \
  -H "Content-Type: application/json" \
  -d '{"ownerAddress":"0xtest_wallet_beta"}'

# Test 3: Check both running
curl "$API_URL/api/agent/status?ownerAddress=0xtest_wallet_alpha"
curl "$API_URL/api/agent/status?ownerAddress=0xtest_wallet_beta"

# Both should show isRunning: true

# Test 4: Stop alpha, verify beta continues
curl -X POST $API_URL/api/agent/stop \
  -H "Content-Type: application/json" \
  -d '{"ownerAddress":"0xtest_wallet_alpha"}'

sleep 3

curl "$API_URL/api/agent/status?ownerAddress=0xtest_wallet_alpha"
# Should show isRunning: false

curl "$API_URL/api/agent/status?ownerAddress=0xtest_wallet_beta"
# Should STILL show isRunning: true ✅
```

**If this test fails, DO NOT PROCEED. Investigate hosting platform state management.**

---

## 🌐 Frontend Deployment Steps

### 1. Update Frontend Environment

**Netlify Environment Settings:**
```
VITE_API_BASE_URL=https://YOUR_BACKEND_URL
```

(No trailing slash)

### 2. Deploy Frontend

**Option A: Netlify CLI**
```bash
cd client
npm run build
netlify deploy --prod
```

**Option B: Git Push (if connected)**
```bash
git push origin main
# Auto-deploys via Netlify integration
```

### 3. Verify Frontend Build

Check build logs for:
- ✅ No TypeScript errors
- ✅ Environment variable loaded correctly
- ✅ Build completes successfully

### 4. Test Full Flow on Live Site

**As User 1 (your wallet):**
1. Visit live Netlify URL
2. Connect Sui wallet
3. Navigate to Agent Wallet page
4. Click "Register Agent" → note your agent address
5. Fund wallet with testnet SUI
6. Click "Start Agent"
7. Verify tick count increases

**As User 2 (different wallet or browser profile):**
1. Open incognito/private browser
2. Visit same Netlify URL
3. Connect DIFFERENT Sui wallet
4. Navigate to Agent Wallet page
5. Click "Register Agent" → verify DIFFERENT agent address
6. Fund wallet with testnet SUI
7. Click "Start Agent"
8. Verify YOUR tick count increases (not User 1's)

**Verification:**
- User 1 and User 2 see different agent addresses ✅
- User 1 and User 2 have independent tick counts ✅
- Stopping User 1's agent doesn't affect User 2 ✅

---

## 📋 Final Checklist

### Backend
- [ ] Backend deployed and accessible
- [ ] All environment variables set
- [ ] CORS configured
- [ ] `/api/health` returns 200
- [ ] Two-wallet isolation test passes on live backend

### Frontend
- [ ] `VITE_API_BASE_URL` points to live backend
- [ ] Frontend builds without errors
- [ ] Deployed to Netlify/hosting
- [ ] Public URL accessible

### End-to-End
- [ ] Can connect wallet on live site
- [ ] Can register agent
- [ ] Can fund agent wallet
- [ ] Can start agent loop
- [ ] Tick count increases
- [ ] Can see agent logs
- [ ] Two different wallets show independent agents

### Documentation
- [ ] README isolation guarantee present
- [ ] Devpost description includes multi-wallet support
- [ ] This checklist completed

---

## 🚨 Troubleshooting

**Issue: Backend deploys but agents don't start**
- Check logs for environment variable errors
- Verify `GEMINI_API_KEY` is set
- Confirm `SUI_NETWORK=testnet` is correct

**Issue: Two wallets share the same agent**
- Re-run isolation test locally first
- Check if hosting platform has global state caching
- Verify latest code is deployed (not cached old version)

**Issue: Frontend can't reach backend**
- Check CORS configuration
- Verify `VITE_API_BASE_URL` has correct URL
- Test `/api/health` endpoint manually with curl

**Issue: Database errors on backend**
- Hosting platform may not persist `./data/agents.db`
- Check if platform supports file system writes
- May need to migrate to managed PostgreSQL for production

---

## 📞 Deployment Support

If isolation test fails on live backend but works locally:
1. Check hosting logs for errors
2. Verify Node.js version matches local (18+)
3. Confirm all dependencies installed
4. Check if platform has stateful runtime restrictions

**DO NOT deploy frontend until backend isolation test passes.**

---

**Current Status:** Local verification complete ✅  
**Next Step:** Deploy backend and re-run isolation test  
**Blocker:** None - ready to deploy
