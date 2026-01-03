# 🚀 Backend Deployment Guide

## ⚠️ MUHIM: Vercel haqida

**Vercel asosan frontend uchun yaratilgan.** Express.js backend ni Vercel ga joylashtirish murakkab va ba'zi cheklovlar bor:
- Serverless functions sifatida ishlaydi
- Doimiy server emas
- Ba'zi hosting platformlar yaxshiroq

## ✅ Tavsiya etilgan platformlar:

### 1. **Railway** (Eng oson va yaxshi) ⭐
- ✅ Bepul boshlash
- ✅ Oson setup
- ✅ GitHub integration
- ✅ Automatic deployments

**Qanday qilish:**
1. [Railway.app](https://railway.app) ga kirish
2. "New Project" > "Deploy from GitHub repo"
3. Reponi tanlash
4. Root Directory: `backend`
5. Start Command: `npm start`
6. Environment Variables qo'shish:
   - `NODE_ENV=production`
   - `ALLOWED_ORIGINS=https://your-frontend-domain.com`

### 2. **Render** (Yaxshi alternativ)
- ✅ Bepul tier mavjud
- ✅ Oson setup

**Qanday qilish:**
1. [Render.com](https://render.com) ga kirish
2. "New Web Service"
3. GitHub reponi ulash
4. Settings:
   - Build Command: `cd backend && npm install`
   - Start Command: `cd backend && npm start`
5. Environment Variables qo'shish

### 3. **Heroku** (Eski, lekin ishonchli)
- ✅ Ko'p yillik tajriba
- ⚠️ Bepul tier yo'q (paid)

**Qanday qilish:**
```bash
cd backend
heroku create your-app-name
git push heroku main
heroku config:set NODE_ENV=production
heroku config:set ALLOWED_ORIGINS=https://yourdomain.com
```

## 📦 Backend papkasini tayyorlash

Backend papkasi allaqachon tayyor:
- ✅ `package.json` - Dependencies
- ✅ `server.js` - Main server file
- ✅ `.env.example` - Environment variables template
- ✅ `Procfile` - Heroku uchun
- ✅ `README.md` - Qo'llanma

## 🔧 Environment Variables

Hosting platformda quyidagi environment variables qo'shing:

```env
NODE_ENV=production
ALLOWED_ORIGINS=https://your-frontend-domain.com,https://www.your-frontend-domain.com
PORT=3001  # (Platform avtomatik belgilaydi)
```

## 📝 Deployment Steps

### Railway uchun:
1. Backend papkasini GitHub ga push qiling
2. Railway ga kirib, reponi ulang
3. Root Directory: `backend`
4. Start Command: `npm start`
5. Environment variables qo'shing
6. Deploy!

### Render uchun:
1. Backend papkasini GitHub ga push qiling
2. Render da "New Web Service"
3. Reponi tanlash
4. Build: `cd backend && npm install`
5. Start: `cd backend && npm start`
6. Environment variables qo'shing

## ✅ Test qilish

Deploy qilgandan keyin:

1. Health check:
   ```
   https://your-backend.railway.app/api/health
   ```

2. Certificates olish:
   ```
   https://your-backend.railway.app/api/certificates
   ```

## 🔗 Frontend ni ulash

Frontend `.env.production` yoki build vaqtida:

```env
VITE_API_URL=https://your-backend.railway.app
```

Yoki build command:
```bash
VITE_API_URL=https://your-backend.railway.app npm run build
```

## 🎉 Tugadi!

Backend endi production da ishlamoqda va frontend dan ishlatish mumkin!
