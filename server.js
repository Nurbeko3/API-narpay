import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// CORS sozlamalari - Production uchun
// Barcha originlarga ruxsat berish (Test uchun)
const corsOptions = {
  origin: true, // So'rov yuborgan har qanday manzilga ruxsat berish
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging (development uchun)
if (NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// Data directory yaratish (backend papkasida)
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log('✅ Data papkasi yaratildi:', dataDir);
}

// Certificates JSON fayl yo'li - backend/data/ papkasida
const certificatesPath = process.env.CERTIFICATES_PATH ||
  path.join(__dirname, 'data/certificates.json');

// Agar fayl yo'q bo'lsa, yaratish yoki public/certificates.json dan ko'chirish
if (!fs.existsSync(certificatesPath)) {
  // Avval public papkadan ko'chirishga harakat qilish
  const publicPath = path.join(__dirname, '../public/certificates.json');
  if (fs.existsSync(publicPath)) {
    // Public papkadagi faylni data/ ga ko'chirish
    const data = fs.readFileSync(publicPath, 'utf8');
    fs.writeFileSync(certificatesPath, data, 'utf8');
    console.log('✅ Certificates fayli data/ papkasiga ko\'chirildi');
  } else {
    // Bo'sh array bilan yangi fayl yaratish
    const initialData = [
      {
        id: 1,
        studentName: "Aliyev Akmal",
        courseName: "Frontend Development",
        date: "2025-05-20",
        qrLabel: "Sertifikat ID: 1001"
      },
      {
        id: 2,
        studentName: "Karimova Dilnoza",
        courseName: "Graphic Design",
        date: "2025-06-01",
        qrLabel: "Sertifikat ID: 1002"
      },
      {
        id: 3,
        studentName: "Rasulov Jahongir",
        courseName: "Python Backend",
        date: "2025-06-15",
        qrLabel: "Sertifikat ID: 1003"
      }
    ];
    fs.writeFileSync(certificatesPath, JSON.stringify(initialData, null, 2), 'utf8');
    console.log('✅ Yangi certificates.json fayli yaratildi');
  }
}

// Helper function: Certificates ni o'qish
const readCertificates = () => {
  try {
    if (!fs.existsSync(certificatesPath)) {
      console.warn('Certificates fayli topilmadi, bo\'sh array qaytarilmoqda');
      return [];
    }
    const data = fs.readFileSync(certificatesPath, 'utf8');
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Error reading certificates:', error);
    return [];
  }
};

// Helper function: Certificates ni yozish
const writeCertificates = (certificates) => {
  try {
    // Backup yaratish (agar kerak bo'lsa)
    if (fs.existsSync(certificatesPath) && NODE_ENV === 'production') {
      const backupPath = certificatesPath + '.backup';
      try {
        fs.copyFileSync(certificatesPath, backupPath);
      } catch (backupError) {
        console.warn('Backup yaratishda xatolik:', backupError);
      }
    }

    // Faylga yozish
    fs.writeFileSync(certificatesPath, JSON.stringify(certificates, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing certificates:', error);
    return false;
  }
};

// API Routes

// GET /api/certificates - Barcha sertifikatlarni olish
app.get('/api/certificates', (req, res) => {
  try {
    const certificates = readCertificates();
    res.json({
      success: true,
      data: certificates,
      count: certificates.length,
    });
  } catch (error) {
    console.error('GET /api/certificates error:', error);
    res.status(500).json({
      success: false,
      error: 'Server xatosi: Sertifikatlarni olishda muammo',
      message: NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// POST /api/certificates - Yangi sertifikat qo'shish
app.post('/api/certificates', (req, res) => {
  try {
    const { studentName, courseName, date, qrLabel } = req.body;

    // Validation
    if (!studentName || !courseName || !date) {
      return res.status(400).json({
        success: false,
        error: 'Iltimos, barcha majburiy maydonlarni to\'ldiring (studentName, courseName, date)'
      });
    }

    // Sanitize input
    const sanitizedStudentName = String(studentName).trim();
    const sanitizedCourseName = String(courseName).trim();
    const sanitizedDate = String(date).trim();
    const sanitizedQrLabel = qrLabel ? String(qrLabel).trim() : null;

    if (!sanitizedStudentName || !sanitizedCourseName || !sanitizedDate) {
      return res.status(400).json({
        success: false,
        error: 'Barcha maydonlar bo\'sh bo\'lmasligi kerak'
      });
    }

    const certificates = readCertificates();

    // Yangi sertifikat yaratish
    const newCertificate = {
      id: Date.now(), // Unique ID
      studentName: sanitizedStudentName,
      courseName: sanitizedCourseName,
      date: sanitizedDate,
      qrLabel: sanitizedQrLabel || `ID: ${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    certificates.unshift(newCertificate); // Boshiga qo'shish (eng yangisi birinchi)

    // Faylga yozish
    if (writeCertificates(certificates)) {
      console.log(`✅ Yangi sertifikat qo'shildi: ${newCertificate.studentName}`);
      res.status(201).json({
        success: true,
        data: newCertificate,
        message: 'Sertifikat muvaffaqiyatli qo\'shildi',
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Server xatosi: Sertifikatni saqlashda muammo'
      });
    }
  } catch (error) {
    console.error('POST /api/certificates error:', error);
    res.status(500).json({
      success: false,
      error: 'Server xatosi: ' + error.message,
      message: NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
});

// DELETE /api/certificates/:id - Sertifikatni o'chirish
app.delete('/api/certificates/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Noto\'g\'ri ID format'
      });
    }

    const certificates = readCertificates();
    const certificateToDelete = certificates.find(cert => cert.id === id);

    if (!certificateToDelete) {
      return res.status(404).json({
        success: false,
        error: 'Sertifikat topilmadi'
      });
    }

    const filteredCertificates = certificates.filter(cert => cert.id !== id);

    // Faylga yozish
    if (writeCertificates(filteredCertificates)) {
      console.log(`✅ Sertifikat o'chirildi: ${certificateToDelete.studentName} (ID: ${id})`);
      res.json({
        success: true,
        message: 'Sertifikat muvaffaqiyatli o\'chirildi',
        id,
        deleted: certificateToDelete,
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Server xatosi: Sertifikatni o\'chirishda muammo'
      });
    }
  } catch (error) {
    console.error('DELETE /api/certificates/:id error:', error);
    res.status(500).json({
      success: false,
      error: 'Server xatosi: ' + error.message,
      message: NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
});

// PUT /api/certificates/:id - Sertifikatni yangilash (ixtiyoriy)
app.put('/api/certificates/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { studentName, courseName, date, qrLabel } = req.body;

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Noto\'g\'ri ID format'
      });
    }

    const certificates = readCertificates();
    const index = certificates.findIndex(cert => cert.id === id);

    if (index === -1) {
      return res.status(404).json({
        success: false,
        error: 'Sertifikat topilmadi'
      });
    }

    // Yangilash (sanitize)
    certificates[index] = {
      ...certificates[index],
      ...(studentName && { studentName: String(studentName).trim() }),
      ...(courseName && { courseName: String(courseName).trim() }),
      ...(date && { date: String(date).trim() }),
      ...(qrLabel !== undefined && { qrLabel: String(qrLabel).trim() }),
      updatedAt: new Date().toISOString(),
    };

    // Faylga yozish
    if (writeCertificates(certificates)) {
      console.log(`✅ Sertifikat yangilandi: ID ${id}`);
      res.json({
        success: true,
        data: certificates[index],
        message: 'Sertifikat muvaffaqiyatli yangilandi',
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Server xatosi: Sertifikatni yangilashda muammo'
      });
    }
  } catch (error) {
    console.error('PUT /api/certificates/:id error:', error);
    res.status(500).json({
      success: false,
      error: 'Server xatosi: ' + error.message,
      message: NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  try {
    const certificates = readCertificates();
    res.json({
      status: 'OK',
      message: 'Server ishlamoqda',
      environment: NODE_ENV,
      certificatesCount: certificates.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: 'Server xatosi',
      error: error.message,
    });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Narpay IT Academy Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      certificates: '/api/certificates',
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint topilmadi',
    path: req.path,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Server xatosi',
    ...(NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Server ishga tushirish (faqat standalone rejimda)
// Vercel kabi serverless platformlarda bu qism ishlamaydi
if (process.env.VERCEL !== '1') {
  app.listen(PORT, '0.0.0.0', () => {
    console.log('='.repeat(50));
    console.log(`🚀 Backend server ishga tushdi`);
    console.log(`📡 Port: ${PORT}`);
    console.log(`🌍 Environment: ${NODE_ENV}`);
    console.log(`📋 Certificates fayl: ${certificatesPath}`);
    console.log(`🔗 API: http://localhost:${PORT}/api`);
    console.log(`💚 Health: http://localhost:${PORT}/api/health`);
    console.log(`📦 Certificates: http://localhost:${PORT}/api/certificates`);
    console.log('='.repeat(50));

    // Server holatini tekshirish
    const certificates = readCertificates();
    console.log(`✅ ${certificates.length} ta sertifikat yuklandi`);
  });
}

// Export for Vercel serverless functions
export default app;

