# RentalHub Deployment Guide

## Option 1: Render (Recommended — Free Tier)

### Prerequisites
- GitHub account
- Render account (https://render.com)

### Steps

1. **Push code to GitHub:**
```bash
cd rentalhub
git init
git add .
git commit -m "RentalHub deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/rentalhub.git
git push -u origin main
```

2. **Create MongoDB:**
   - Go to https://cloud.mongodb.com
   - Create a free cluster
   - Get connection string: `mongodb+srv://user:pass@cluster.mongodb.net/rentalhub`

3. **Create Redis:**
   - Go to https://upstash.com (free tier)
   - Create a database
   - Get connection string: `rediss://default:pass@host:6379`

4. **Deploy to Render:**
   - Go to https://render.com/dashboard
   - Click "New" → "Blueprint"
   - Connect your GitHub repo
   - Render auto-detects `render.yaml`
   - Fill in environment variables:
     - `MONGODB_URI` — your MongoDB connection string
     - `REDIS_URL` — your Redis connection string
     - `CLIENT_URL` — your Render client URL (e.g., `https://rentalhub-client.onrender.com`)
   - Click "Deploy"

5. **Access your app:**
   - Client: `https://rentalhub-client.onrender.com`
   - API: `https://rentalhub-server.onrender.com/api/v1`
   - Docs: `https://rentalhub-server.onrender.com/api/docs`

---

## Option 2: Vercel (Frontend) + Railway (Backend)

### Frontend (Vercel)

1. **Install Vercel CLI:**
```bash
npm i -g vercel
```

2. **Deploy:**
```bash
cd rentalhub\client
vercel
```

3. **Set environment variable in Vercel dashboard:**
   - `VITE_API_URL` = your Railway backend URL

### Backend (Railway)

1. **Install Railway CLI:**
```bash
npm i -g @railway/cli
```

2. **Deploy:**
```bash
cd rentalhub\server
railway login
railway init
railway up
```

3. **Set environment variables in Railway dashboard:**
   - `MONGODB_URI` — your MongoDB connection string
   - `REDIS_URL` — your Redis connection string
   - `JWT_ACCESS_SECRET` — generate a random string
   - `JWT_REFRESH_SECRET` — generate a random string
   - `CLIENT_URL` — your Vercel frontend URL

---

## Option 3: Docker (Any Cloud Provider)

### Prerequisites
- Docker installed
- Any cloud provider (AWS EC2, GCP Compute Engine, Azure VM, DigitalOcean Droplet)

### Steps

1. **Build the Docker image:**
```bash
cd rentalhub
docker build -t rentalhub .
```

2. **Run the container:**
```bash
docker run -d \
  -p 4000:4000 \
  -e MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/rentalhub" \
  -e REDIS_URL="rediss://default:pass@host:6379" \
  -e JWT_ACCESS_SECRET="your-secret" \
  -e JWT_REFRESH_SECRET="your-secret" \
  -e CLIENT_URL="http://localhost:4000" \
  --name rentalhub \
  rentalhub
```

3. **Access:**
   - API: http://your-server-ip:4000/api/v1
   - Docs: http://your-server-ip:4000/api/docs

---

## Option 4: Netlify (Frontend Only)

1. **Push code to GitHub**

2. **Go to https://netlify.com**

3. **Click "Add new site" → "Import an existing project"**

4. **Select your GitHub repo**

5. **Configure:**
   - Build command: `cd client && npm install && npm run build`
   - Publish directory: `client/dist`

6. **Set environment variable:**
   - `VITE_API_URL` = your backend URL

7. **Update `netlify.toml` redirects** to point to your backend

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | Yes | MongoDB connection string |
| `REDIS_URL` | Yes | Redis connection string |
| `JWT_ACCESS_SECRET` | Yes | JWT access token secret (min 32 chars) |
| `JWT_REFRESH_SECRET` | Yes | JWT refresh token secret (min 32 chars) |
| `CLIENT_URL` | Yes | Frontend URL for CORS |
| `PORT` | No | Server port (default: 4000) |
| `NODE_ENV` | No | Environment (default: development) |
| `AI_PROVIDER` | No | AI provider: `rule-based`, `openai`, `anthropic` |
| `OPENAI_API_KEY` | No | OpenAI API key (if using OpenAI) |
| `ANTHROPIC_API_KEY` | No | Anthropic API key (if using Anthropic) |
| `CLOUDINARY_CLOUD_NAME` | No | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | No | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | No | Cloudinary API secret |
| `STRIPE_SECRET_KEY` | No | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | No | Stripe webhook secret |

---

## Free Tier Services

| Service | Free Tier | URL |
|---------|-----------|-----|
| MongoDB | 512 MB | https://cloud.mongodb.com |
| Redis | 30 MB | https://upstash.com |
| Render | 750 hrs/month | https://render.com |
| Vercel | 100 GB bandwidth | https://vercel.com |
| Railway | $5 credit/month | https://railway.app |
| Netlify | 100 GB bandwidth | https://netlify.com |

---

## Post-Deployment Checklist

- [ ] MongoDB connected
- [ ] Redis connected
- [ ] JWT secrets set
- [ ] CLIENT_URL set to frontend URL
- [ ] CORS working (frontend can call API)
- [ ] Swagger docs accessible at `/api/docs`
- [ ] Health check returns `{"status":"ok"}`
- [ ] Seed data loaded (run `npm run seed` on server)
- [ ] Login works
- [ ] Booking flow works
- [ ] Images upload (if Cloudinary configured)
