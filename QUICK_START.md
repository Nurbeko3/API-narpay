# ⚡ Tezkor Boshlash

## Backend ni hostingga joylashtirish

### ✅ Eng oson usul: Railway

1. **GitHub ga push qiling:**
   ```bash
   git add .
   git commit -m "Backend tayyor"
   git push origin main
   ```

2. **Railway ga kirish:**
   - [railway.app](https://railway.app) ga kirish
   - "New Project" > "Deploy from GitHub repo"
   - Reponi tanlash

3. **Settings:**
   - Root Directory: `backend`
   - Start Command: `npm start`

4. **Environment Variables:**
   - `NODE_ENV=production`
   - `ALLOWED_ORIGINS=https://your-frontend-domain.com`

5. **Deploy!** 🚀

### 📝 Frontend ni ulash

Frontend build qilishdan oldin `.env.production` yaratib:

```env
VITE_API_URL=https://your-backend.railway.app
```

Keyin build:
```bash
npm run build
```

## ⚠️ Vercel haqida

Vercel asosan frontend uchun. Backend uchun:
- ❌ Vercel - Express.js ni to'g'ri qo'llab-quvvatlamaydi
- ✅ Railway - Eng yaxshi variant
- ✅ Render - Yaxshi alternativ
- ✅ Heroku - Paid, lekin ishonchli

## 🎯 Backend papkasi tayyor!

Backend papkasida barcha kerakli fayllar bor:
- ✅ `package.json` - Dependencies
- ✅ `server.js` - Main server
- ✅ `.env.example` - Environment template
- ✅ `Procfile` - Heroku uchun
- ✅ `README.md` - Qo'llanma

**Faqat `backend/` papkasini hostingga yuklang va ishlatish mumkin!**
