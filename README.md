# 🚀 Narpay IT Academy Backend API

Bu backend API sertifikatlarni boshqarish uchun.

## 📦 O'rnatish

```bash
npm install
```

## 🏃 Ishga tushirish

### Development:
```bash
npm run dev
```

### Production:
```bash
npm run start
```

## 🌐 Hosting Platformlar

### Railway (Tavsiya etiladi)

1. GitHub reponi Railway ga ulang
2. Root directory: `backend/`
3. Start command: `npm start`
4. Environment variables qo'shing (Railway dashboard dan)

### Render

1. New Web Service
2. Build command: `npm install`
3. Start command: `npm start`
4. Environment variables qo'shing

### Heroku

1. `heroku create your-app-name`
2. `git push heroku main`
3. Environment variables qo'shing

### Vercel (Serverless)

Vercel uchun `vercel.json` fayli mavjud. Lekin Vercel asosan frontend uchun. Backend uchun Railway yoki Render tavsiya etiladi.

## 📡 API Endpoints

- `GET /api/health` - Server holati
- `GET /api/certificates` - Barcha sertifikatlar
- `POST /api/certificates` - Yangi sertifikat qo'shish
- `DELETE /api/certificates/:id` - Sertifikatni o'chirish
- `PUT /api/certificates/:id` - Sertifikatni yangilash

## 🔧 Environment Variables

`.env` fayl yaratib, `.env.example` dagi o'zgaruvchilarni to'ldiring.

## 📝 Ma'lumotlar

Sertifikatlar `data/certificates.json` faylida saqlanadi.
