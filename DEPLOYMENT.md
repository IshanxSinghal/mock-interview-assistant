# 🚀 Deployment Guide - Mock Interview Assistant

## Overview
This guide will help you deploy both the Flask backend and React frontend of the Mock Interview Assistant.

---

## 📋 Prerequisites

Before deploying, ensure you have:
- A Groq API key ([Sign up at groq.com](https://groq.com))
- GitHub account (for code repository)
- Render account ([render.com](https://render.com)) - Free tier available
- Alternatively: Vercel ([vercel.com](https://vercel.com)) for frontend, Railway ([railway.app](https://railway.app)) for backend

---

## Part 1: Backend Deployment (Flask API)

### Option A: Deploy to Render (Recommended)

#### Step 1: Prepare Your Code
✅ Files already created/updated:
- `Procfile` - Tells Render how to run your app
- `runtime.txt` - Specifies Python version
- `requirements.txt` - Updated with gunicorn and groq
- `server.py` - Updated to use PORT environment variable

#### Step 2: Push to GitHub
```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit changes
git commit -m "Prepare for deployment"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/mock-interview-assistant.git
git branch -M main
git push -u origin main
```

#### Step 3: Deploy on Render

1. **Go to [render.com](https://render.com) and sign up/login**

2. **Click "New +" → "Web Service"**

3. **Connect your GitHub repository**
   - Select "mock-interview-assistant" repository

4. **Configure the service:**
   - **Name:** `mock-interview-backend` (or any name)
   - **Region:** Choose closest to your users
   - **Branch:** `main`
   - **Root Directory:** Leave blank (or specify if backend is in subdirectory)
   - **Runtime:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn server:app`
   - **Instance Type:** Free

5. **Add Environment Variables:**
   - Click "Advanced" → "Add Environment Variable"
   - Add: `GROQ_API_KEY` = `your_actual_groq_api_key_here`

6. **Click "Create Web Service"**

7. **Wait for deployment** (2-5 minutes)
   - Once deployed, you'll get a URL like: `https://mock-interview-backend.onrender.com`
   - **SAVE THIS URL** - you'll need it for frontend deployment

#### Step 4: Test Backend
Open your browser or use curl:
```bash
curl https://your-backend-url.onrender.com/next-question?sessionId=test&role=Engineer&domain=general&mode=technical
```

---

### Option B: Deploy to Railway (Alternative)

1. **Go to [railway.app](https://railway.app)**
2. **Click "New Project" → "Deploy from GitHub repo"**
3. **Select your repository**
4. **Add environment variable:** `GROQ_API_KEY`
5. **Railway auto-detects Python and deploys**
6. **Get your deployment URL from the settings**

---

## Part 2: Frontend Deployment (React App)

### Option A: Deploy to Vercel (Recommended for React)

#### Step 1: Update Environment Variable
Edit the file: `mock-interview-assistant/.env.production`

Replace `https://your-backend-url.onrender.com` with your actual backend URL from Part 1:
```
REACT_APP_API_URL=https://mock-interview-backend.onrender.com
```

#### Step 2: Commit Changes
```bash
git add .
git commit -m "Add production backend URL"
git push origin main
```

#### Step 3: Deploy to Vercel

1. **Go to [vercel.com](https://vercel.com) and sign up/login**

2. **Click "Add New" → "Project"**

3. **Import your GitHub repository**

4. **Configure project:**
   - **Framework Preset:** Create React App
   - **Root Directory:** `mock-interview-assistant` (your React app folder)
   - **Build Command:** `npm run build`
   - **Output Directory:** `build`

5. **Add Environment Variables:**
   - Go to "Environment Variables" section
   - Add: `REACT_APP_API_URL` = `https://your-backend-url.onrender.com`

6. **Click "Deploy"**

7. **Wait for deployment** (1-3 minutes)
   - You'll get a URL like: `https://mock-interview-assistant.vercel.app`

#### Step 4: Update CORS (Important!)
After frontend deployment, update your backend's CORS settings:

Go to your backend code (`server.py`) and update if needed:
```python
from flask import Flask
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins=["https://your-frontend-url.vercel.app"])
```

Then redeploy the backend on Render (it will auto-redeploy if connected to GitHub).

---

### Option B: Deploy Frontend to Render

1. **Create a new Web Service on Render**
2. **Select your repository**
3. **Configure:**
   - **Root Directory:** `mock-interview-assistant`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npx serve -s build -p $PORT`
4. **Add Environment Variable:** `REACT_APP_API_URL`
5. **Deploy**

---

### Option C: Deploy Frontend to Netlify

1. **Go to [netlify.com](https://netlify.com)**
2. **Click "Add new site" → "Import an existing project"**
3. **Connect GitHub and select repository**
4. **Configure:**
   - **Base directory:** `mock-interview-assistant`
   - **Build command:** `npm run build`
   - **Publish directory:** `build`
5. **Add Environment Variable:** `REACT_APP_API_URL`
6. **Deploy**

---

## 🔧 Post-Deployment Configuration

### 1. Test Your Application
1. Visit your frontend URL
2. Start an interview
3. Check if questions are loading
4. Submit answers and check feedback

### 2. Monitor Logs
- **Render:** Dashboard → Your Service → Logs
- **Vercel:** Dashboard → Your Project → Deployments → View Function Logs

### 3. Common Issues & Fixes

#### Issue: CORS Error
**Solution:** Update `server.py`:
```python
CORS(app, origins=["https://your-frontend-domain.com", "http://localhost:3000"])
```

#### Issue: Backend Taking Long to Respond
**Reason:** Free tier services sleep after inactivity
**Solution:** 
- Upgrade to paid tier, or
- Use a service like UptimeRobot to ping your backend every 5 minutes

#### Issue: Environment Variables Not Working
**Solution:** 
- Rebuild/redeploy after adding env variables
- Check variable names match exactly (case-sensitive)

---

## 💰 Cost Breakdown

### Free Tier Limits:
- **Render:** 750 hours/month, sleeps after 15 min inactivity
- **Vercel:** 100 GB bandwidth/month, unlimited sites
- **Railway:** $5 free credit/month
- **Netlify:** 100 GB bandwidth/month

### Recommended Free Setup:
- Backend: Render (Free)
- Frontend: Vercel (Free)
- Total Cost: $0/month

---

## 🔄 Continuous Deployment

Both Render and Vercel support automatic deployments:
- Every time you push to `main` branch, they automatically redeploy
- No manual action needed!

To enable:
1. **Render:** Already enabled by default when connected to GitHub
2. **Vercel:** Already enabled by default

---

## 🌍 Custom Domain (Optional)

### Add Custom Domain to Vercel:
1. Go to Project Settings → Domains
2. Add your domain
3. Update DNS records as instructed

### Add Custom Domain to Render:
1. Go to Service Settings → Custom Domain
2. Add your domain
3. Update DNS records as instructed

---

## 📊 Monitoring & Analytics

### Add Basic Analytics:
1. **Google Analytics** - Add to your React app
2. **Sentry** - For error tracking
3. **LogRocket** - For session replay

---

## 🔒 Security Best Practices

1. **Never commit `.env` files** - Already in `.gitignore`
2. **Use environment variables** for all secrets - ✅ Done
3. **Enable HTTPS** - Automatic on Render/Vercel
4. **Rotate API keys** regularly
5. **Set rate limiting** on backend (future enhancement)

---

## 🚀 Quick Deploy Checklist

- [ ] Backend deployed to Render
- [ ] GROQ_API_KEY added as environment variable
- [ ] Backend URL saved
- [ ] Frontend `.env.production` updated with backend URL
- [ ] Frontend deployed to Vercel
- [ ] REACT_APP_API_URL added as environment variable
- [ ] CORS configured on backend
- [ ] Test the complete flow
- [ ] Monitor logs for errors

---

## 📞 Need Help?

If you encounter issues:
1. Check the logs on Render/Vercel dashboards
2. Verify environment variables are set correctly
3. Test backend API endpoints directly
4. Check browser console for frontend errors

---

## 🎉 Success!

Once deployed, your app will be accessible worldwide at:
- **Frontend:** https://your-app.vercel.app
- **Backend:** https://your-backend.onrender.com

Share the frontend URL with users to start conducting mock interviews!

---

*Last Updated: February 2026*
