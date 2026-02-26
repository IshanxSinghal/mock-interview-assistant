# 🎯 Quick Deployment Reference Card

## 📱 One-Minute Summary

### Backend (Flask) → Render
1. Push code to GitHub
2. Create Web Service on Render
3. Add `GROQ_API_KEY` environment variable
4. Deploy → Get backend URL

### Frontend (React) → Vercel  
1. Update `.env.production` with backend URL
2. Push to GitHub
3. Import project on Vercel
4. Set Root Directory: `mock-interview-assistant`
5. Add `REACT_APP_API_URL` environment variable
6. Deploy → Get frontend URL

---

## 🔗 Deployment Platforms

| Platform | Best For | Free Tier | URL |
|----------|----------|-----------|-----|
| **Render** | Backend (Flask) | 750 hrs/mo | [render.com](https://render.com) |
| **Vercel** | Frontend (React) | Unlimited | [vercel.com](https://vercel.com) |
| **Railway** | Backend Alternative | $5 credit | [railway.app](https://railway.app) |
| **Netlify** | Frontend Alternative | 100GB/mo | [netlify.com](https://netlify.com) |

---

## ⚡ Quick Commands

```bash
# Check if ready to deploy
./check-deployment.sh

# Push to GitHub
git add .
git commit -m "Ready for deployment"
git push origin main

# Test locally before deploying
./start.sh
```

---

## 🔑 Environment Variables

### Backend (.env - local only, not committed)
```
GROQ_API_KEY=your_actual_key_here
```

### Backend (Render Dashboard)
```
GROQ_API_KEY=your_actual_key_here
```

### Frontend (mock-interview-assistant/.env.production)
```
REACT_APP_API_URL=https://your-backend.onrender.com
```

### Frontend (Vercel Dashboard)
```
REACT_APP_API_URL=https://your-backend.onrender.com
```

---

## 🐛 Common Errors & Fixes

| Error | Fix |
|-------|-----|
| CORS Error | Update CORS origins in `server.py` |
| 500 Server Error | Check Render logs, verify `GROQ_API_KEY` |
| Build Failed | Verify `package.json` and `requirements.txt` |
| API Not Found | Check `REACT_APP_API_URL` is set correctly |
| Backend Sleeping | Free tier sleeps after 15 min inactivity |

---

## 📂 Files Created for Deployment

- ✅ `Procfile` - Render startup command
- ✅ `runtime.txt` - Python version
- ✅ `requirements.txt` - Updated with gunicorn
- ✅ `server.py` - Updated for production
- ✅ `.env.production` - Frontend production config
- ✅ `App.js` - Updated to use API_BASE_URL
- ✅ `DEPLOYMENT.md` - Full deployment guide
- ✅ `start.sh` - Local development script
- ✅ `check-deployment.sh` - Pre-deployment checks

---

## 📞 Support URLs

- Render Docs: https://render.com/docs
- Vercel Docs: https://vercel.com/docs
- Groq API: https://console.groq.com

---

## ✅ Deployment Checklist

### Pre-Deployment
- [ ] Run `./check-deployment.sh`
- [ ] Get GROQ API key
- [ ] Create GitHub repository
- [ ] Push code to GitHub

### Backend Deployment
- [ ] Create Render account
- [ ] Connect GitHub repo
- [ ] Add GROQ_API_KEY
- [ ] Deploy
- [ ] Copy backend URL

### Frontend Deployment  
- [ ] Update `.env.production` with backend URL
- [ ] Push changes to GitHub
- [ ] Create Vercel account
- [ ] Import project (set root: `mock-interview-assistant`)
- [ ] Add REACT_APP_API_URL
- [ ] Deploy
- [ ] Test complete flow

### Post-Deployment
- [ ] Test interview flow
- [ ] Check browser console for errors
- [ ] Monitor Render/Vercel logs
- [ ] Share app URL

---

**Estimated Time:** 15-20 minutes total
**Cost:** $0 (using free tiers)

Need detailed instructions? → See [DEPLOYMENT.md](DEPLOYMENT.md)
