# 🚀 Tier 2 Setup Guide - Getting API Keys

## Quick Start (5 minutes)

To enable real job search in JobFlow, you need API keys from two providers:

---

## Step 1: JSearch API (Primary - Recommended First)

### Get Your Key:
1. Visit: https://rapidapi.com/letscrape-6bds/api/jsearch
2. Click **"Sign Up Free"** (takes 2 minutes)
3. In Dashboard, go to **"My Apps"** → **"Your API Keys"**
4. Copy the **x-rapidapi-key** value

### Add to Environment:
```bash
# In .env or Vercel Secrets
JSEARCH_API_KEY=your_key_here
```

### Free Tier Limits:
- 100 requests/month (plenty for testing)
- Upgrade to Pro if you hit limits

---

## Step 2: Adzuna API (Fallback)

### Get Your Keys:
1. Visit: https://developer.adzuna.com/
2. Click **"Register"**
3. Create new application
4. You'll get:
   - **App ID** and **API Key**

### Add to Environment:
```bash
# In .env or Vercel Secrets
ADZUNA_APP_ID=your_app_id
ADZUNA_API_KEY=your_api_key
```

### Free Tier Limits:
- Unlimited requests
- Covers UK, US, Canada, Australia jobs
- Great for backup

---

## Local Development

### .env File Example:
```
# Database
MONGO_URL=your_mongo_url
DB_NAME=jobapp0

# APIs - Real Jobs (Tier 2)
JSEARCH_API_KEY=your_jsearch_api_key
ADZUNA_APP_ID=your_adzuna_app_id
ADZUNA_API_KEY=your_adzuna_api_key

# AI
GEMINI_API_KEY=your_gemini_api_key

# Auth
ADMIN_PASSWORD=YourSecurePassword123
JWT_SECRET=your_jwt_secret
```

### Test Locally:
```bash
npm run dev

# Then in another terminal:
curl -X POST http://localhost:3000/api/jobs/search \
  -H "Content-Type: application/json" \
  -d '{"keywords": "React Engineer", "location": "Remote"}'
```

---

## Vercel Deployment

### Add Secrets:
1. Go to **Project Settings** → **Environment Variables**
2. Add these secrets:

| Name | Value |
|------|-------|
| `JSEARCH_API_KEY` | Your JSearch API Key |
| `ADZUNA_APP_ID` | Your Adzuna App ID |
| `ADZUNA_API_KEY` | Your Adzuna API Key |
| `MONGO_URL` | Your MongoDB connection |
| `GEMINI_API_KEY` | Your Gemini API Key |
| `ADMIN_PASSWORD` | Your secure password |
| `JWT_SECRET` | Your JWT secret |

3. Click **Save**
4. **Redeploy** the project (or it auto-redeploys)

### Check Health:
```
GET /api/health
```

Should return:
```json
{
  "status": "ok",
  "dbConnected": true,
  "env": {
    "hasMongoUrl": true,
    "hasDbName": true,
    "hasAdminPassword": true,
    "hasGeminiKey": true,
    "hasJSearchKey": true,      // ← New!
    "hasAdzunaId": true,         // ← New!
    "hasAdzunaKey": true         // ← New!
  }
}
```

---

## Testing Real Jobs Feature

### Step 1: Start the app
```bash
npm run dev
# App runs at http://localhost:3000
```

### Step 2: Navigate to "Real Jobs"
- Click **"Real Jobs"** in top navigation
- You should see the search form

### Step 3: Try a search
```
Job Title: React Engineer
Location: Remote
```

Click **"Search Jobs"** → Should see results from JSearch or Adzuna!

### Step 4: Try saving a job
- Click **"+"** button on a job card (must be logged in as admin)
- Job should appear in your Wishlist tracker

---

## Troubleshooting

### "No jobs found" immediately
**Solution**: API keys might not be set
1. Check `.env` file has correct keys
2. Restart dev server: `npm run dev`
3. Verify `/api/health` shows keys configured

### Getting 429 Rate Limit
**Solution**: JSearch free tier = 100/month
- Use Adzuna (unlimited fallback)
- Or wait until next month
- Or upgrade to Pro

### Blank "Real Jobs" page
**Solution**: Check browser console for errors
1. Open DevTools (F12)
2. Go to **Console** tab
3. Look for error messages
4. Report to support with error details

### API Key rejected
**Solution**: 
- Copy key again (don't include spaces)
- Make sure it's in correct env var name
- Test with curl command above
- Verify API account is active

---

## What Happens Without API Keys

If you don't configure the API keys:
- "Real Jobs" button still appears
- Search returns friendly message
- App continues working (AI Search works)
- No blocking errors

You can use JobFlow fully with just AI Search until ready to add real jobs!

---

## Next Steps After Setup

1. ✅ Get JSearch API key (5 min)
2. ✅ Get Adzuna API key (10 min)
3. ✅ Add to `.env` or Vercel
4. ✅ Restart/redeploy
5. ✅ Test "Real Jobs" search
6. 🎉 Start discovering real job opportunities!

---

**Questions?** Check the [TIER_2_REAL_JOBS.md](./TIER_2_REAL_JOBS.md) for detailed documentation.

