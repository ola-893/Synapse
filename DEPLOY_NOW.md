# IMMEDIATE DEPLOYMENT INSTRUCTIONS

## Backend Deployment (Required First)

### Option 1: Render (Recommended - Blueprint Ready)

The repository now has `render.yaml` configured. Deploy in 3 steps:

1. **Go to Render Dashboard:**
   - Visit: https://dashboard.render.com/
   - Sign in with GitHub

2. **Create New Blueprint:**
   - Click "New +" → "Blueprint"
   - Connect repository: `ola-893/Synapse`
   - Render will auto-detect `render.yaml`

3. **Set Environment Variables:**
   Click on the created service → Environment, then add:
   
   ```
   SUI_PRIVATE_KEY=suiprivkey1qp5z0u5x72yvjmwulrltg2nzwk6xddk2cqxcy736ydytrmnyns4rsugn8zz
   AGENT_WALLET_ENCRYPTION_KEY=1f9c8d7e6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e
   MEMWAL_PRIVATE_KEY=6facdbdd003923bad46fa23f1d145e75d72aeafd166fc45121ccd80afebf42a6
   MEMWAL_ACCOUNT_ID=0xbab84ff981dcd0bdd66f530437d86ec33477bcfb445b4b6e1b925920fb83bd97
   SYNAPSE_PACKAGE_ID=0x0982401c235bbbf32b99e420f365eb7df0264c3f4ee7785978cd7d58a571e62b
   SEAL_PACKAGE_ID=0x984960ebddd75c15c6d38355ac462621db0ffc7d6647214c802cd3b685e1af3d
   SEAL_KEY_SERVER_1=0x73d05d62c18d9374e3ea529e8e0ed6161da1a141a94d3f76ae3fe4e99356db75
   SEAL_KEY_SERVER_2=0xf5d14a81a982144ae441cd7d64b09027f116a468bd36e7eca494f750591623c8
   GEMINI_API_KEY=AIzaSyD1Hv4ZbRSiy62DU8KeozE694Du9iF0Xqc
   GOOGLE_GENERATIVE_AI_API_KEY=AIzaSyD1Hv4ZbRSiy62DU8KeozE694Du9iF0Xqc
   ```

4. **Deploy** → Wait for build to complete → Note your service URL

**Your backend URL will be:** `https://synapse-backend-XXXX.onrender.com`

---

### Option 2: Railway (Alternative)

1. Visit: https://railway.app/
2. Click "New Project" → "Deploy from GitHub repo"
3. Select `ola-893/Synapse`
4. Configure:
   - Root Directory: `server`
   - Build Command: `npm install`
   - Start Command: `npm run dev`
   - Port: `3002`
5. Add all environment variables from above
6. Deploy

---

### Option 3: Fly.io (Alternative)

Install Fly CLI first:
```bash
brew install flyctl  # or: curl -L https://fly.io/install.sh | sh
```

Then deploy:
```bash
cd server
fly launch --name synapse-backend
# Follow prompts, set region
fly secrets set SUI_PRIVATE_KEY="..." AGENT_WALLET_ENCRYPTION_KEY="..." [etc]
fly deploy
```

---

## CRITICAL: Test Backend Isolation BEFORE Frontend

Once backend is deployed, run this test:

```bash
export BACKEND_URL="https://YOUR-DEPLOYED-BACKEND-URL"

# Test 1: Register two wallets
curl -X POST $BACKEND_URL/api/agent/register \
  -H "Content-Type: application/json" \
  -d '{"ownerAddress":"0xlive_test_alpha"}'

curl -X POST $BACKEND_URL/api/agent/register \
  -H "Content-Type: application/json" \
  -d '{"ownerAddress":"0xlive_test_beta"}'

# Test 2: Start both agents
curl -X POST $BACKEND_URL/api/agent/start \
  -H "Content-Type: application/json" \
  -d '{"ownerAddress":"0xlive_test_alpha"}'

curl -X POST $BACKEND_URL/api/agent/start \
  -H "Content-Type: application/json" \
  -d '{"ownerAddress":"0xlive_test_beta"}'

# Test 3: Wait 10 seconds, check both running
sleep 10
curl "$BACKEND_URL/api/agent/status?ownerAddress=0xlive_test_alpha"
curl "$BACKEND_URL/api/agent/status?ownerAddress=0xlive_test_beta"

# Test 4: Stop alpha, verify beta continues
curl -X POST $BACKEND_URL/api/agent/stop \
  -H "Content-Type: application/json" \
  -d '{"ownerAddress":"0xlive_test_alpha"}'

sleep 3
curl "$BACKEND_URL/api/agent/status?ownerAddress=0xlive_test_alpha"  # Should be stopped
curl "$BACKEND_URL/api/agent/status?ownerAddress=0xlive_test_beta"   # Should STILL be running
```

**Expected Results:**
- Two different agent addresses on registration ✅
- Both agents show `isRunning: true` and independent tick counts ✅
- After stopping alpha, alpha shows `isRunning: false` ✅
- Beta STILL shows `isRunning: true` with continuing tick count ✅

**If this test fails, DO NOT deploy frontend. Debug backend first.**

---

## Frontend Deployment (After Backend Verified)

### Update Netlify Environment

1. Go to: https://app.netlify.com/
2. Select your Synapse site
3. Site settings → Environment variables
4. Update `VITE_API_BASE_URL` to your live backend URL:
   ```
   VITE_API_BASE_URL=https://synapse-backend-XXXX.onrender.com
   ```
   (No trailing slash!)

5. Go to Deploys → Trigger deploy → Deploy site

---

## Post-Deployment Verification

### 1. Check Backend Health
```bash
curl https://YOUR-BACKEND-URL/api/health
# Should return: {"status":"ok","timestamp":...}
```

### 2. Full Flow Test on Live Site

**As User 1:**
1. Visit your Netlify URL
2. Connect Sui wallet
3. Go to Agent Wallet page
4. Register agent → note agent address
5. Fund with testnet SUI
6. Start agent → verify tick count increases

**As User 2 (incognito/different browser):**
1. Visit same Netlify URL
2. Connect DIFFERENT Sui wallet
3. Register agent → verify DIFFERENT agent address than User 1
4. Fund with testnet SUI
5. Start agent → verify YOUR tick count increases independently

**Confirm:**
- ✅ Different agent addresses
- ✅ Independent tick counts
- ✅ User 1 stopping doesn't affect User 2

---

## Known Issue: Free Tier Sleep Behavior

**Render Free Tier** spins down after 15 minutes of inactivity and cold-starts on next request.

**Impact on running agents:**
- When the process sleeps, the in-memory `Map<ownerAddress, RuntimeState>` is lost
- All running agents silently stop
- On wake-up, agents show `isRunning: false` until manually restarted

**This is NOT a bug in the isolation fix** - it's a hosting limitation. Solutions:
1. Upgrade to paid tier (keeps process alive)
2. Add database persistence for runtime state (future enhancement)
3. Add "resume agents on startup" logic (future enhancement)
4. Document that free tier requires manual restarts

**For demo/judging:** This is acceptable if disclosed. Judges will manually start agents.

---

## Deployment Complete Checklist

- [ ] Backend deployed to hosting platform
- [ ] All environment variables set
- [ ] Backend health endpoint returns 200
- [ ] Two-wallet isolation test passed on LIVE backend URL
- [ ] Verified what happens when host sleeps (if free tier)
- [ ] Frontend `VITE_API_BASE_URL` updated
- [ ] Frontend redeployed
- [ ] Full flow tested on public URL with real wallet
- [ ] Confirmed two different wallets show independent agents

---

**Current Status:** Code pushed to GitHub, ready for deployment  
**Next Step:** Deploy backend using Option 1, 2, or 3 above  
**Gate:** Must pass live isolation test before deploying frontend
