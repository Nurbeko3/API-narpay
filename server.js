import dotenv from "dotenv";
dotenv.config(); // Load environment variables

import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import Certificate from "./models/Certificate.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || "development";

// MongoDB Connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // mongoose 6+ da bu options shart emas, lekin yozib qo'yish zarar qilmaydi
    });
    console.log(`✅ MongoDB Ulandi: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Xatosi: ${error.message}`);
    // Agar DB ulanmasa, serverni to'xtatmaslik uchun (file system fallback ishlashi uchun)
    // process.exit(1);
  }
};

// Agar MONGO_URI bor bo'lsa ulanamiz
if (process.env.MONGO_URI) {
  connectDB();
} else {
  console.warn(
    "⚠️ MONGO_URI topilmadi. Ma'lumotlar fayl тизимида (vaqtincha) saqlanadi yoki xatolik beradi."
  );
}

// CORS sozlamalari - Production uchun
// Barcha originlarga ruxsat berish (Test uchun)
const corsOptions = {
  origin: true, // So'rov yuborgan har qanday manzilga ruxsat berish
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Request logging (development uchun)
if (NODE_ENV === "development") {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// --- FILE SYSTEM FALLBACK (Vaqtincha) ---
// Agar MongoDB ishlamasa, eski usulda ishlash uchun
const dataDir = path.join(__dirname, "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
const certificatesPath = path.join(__dirname, "data/certificates.json");

const readCertificatesFile = () => {
  try {
    if (!fs.existsSync(certificatesPath)) return [];
    const data = fs.readFileSync(certificatesPath, "utf8");
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("Error reading certificates from file:", e);
    return [];
  }
};
// ----------------------------------------

// API Routes

// GET /api/certificates - Barcha sertifikatlarni olish
app.get("/api/certificates", async (req, res) => {
  try {
    let certificates;

    // 1. Agar MongoDB ulangan bo'lsa
    if (mongoose.connection.readyState === 1) {
      certificates = await Certificate.find().sort({ createdAt: -1 });
    } else {
      // 2. Fallback to file
      certificates = readCertificatesFile();
    }

    res.json({
      success: true,
      data: certificates,
      count: certificates.length,
    });
  } catch (error) {
    console.error("GET /api/certificates error:", error);
    res.status(500).json({
      success: false,
      error: "Server xatosi: Sertifikatlarni olishda muammo",
      message: NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// POST /api/certificates - Yangi sertifikat qo'shish
app.post("/api/certificates", async (req, res) => {
  try {
    const { studentName, courseName, date, qrLabel } = req.body;

    // Validation
    if (!studentName || !courseName || !date) {
      return res.status(400).json({
        success: false,
        error:
          "Iltimos, barcha majburiy maydonlarni to'ldiring (studentName, courseName, date)",
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
        error: "Barcha maydonlar bo'sh bo'lmasligi kerak",
      });
    }

    const newCertData = {
      id: Date.now(), // Simple unique ID
      studentName: sanitizedStudentName,
      courseName: sanitizedCourseName,
      date: sanitizedDate,
      qrLabel: sanitizedQrLabel || `ID: ${Date.now()}`,
    };

    if (mongoose.connection.readyState === 1) {
      const newCertificate = await Certificate.create(newCertData);
      console.log(
        `✅ DB: Yangi sertifikat qo'shildi: ${newCertificate.studentName}`
      );
      return res.status(201).json({
        success: true,
        data: newCertificate,
        message: "Sertifikat muvaffaqiyatli qo'shildi (DB)",
      });
    } else {
      // Fallback
      const certs = readCertificatesFile();
      const newCert = { ...newCertData, createdAt: new Date().toISOString() };
      certs.unshift(newCert);
      fs.writeFileSync(
        certificatesPath,
        JSON.stringify(certs, null, 2),
        "utf8"
      );
      console.log(
        `✅ File: Yangi sertifikat qo'shildi: ${newCert.studentName}`
      );
      return res.status(201).json({
        success: true,
        data: newCert,
        message:
          "Sertifikat muvaffaqiyatli qo'shildi (File - Not Permanent on Render!)",
      });
    }
  } catch (error) {
    console.error("POST /api/certificates error:", error);
    res.status(500).json({
      success: false,
      error: "Server xatosi: " + error.message,
      message: NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

// DELETE /api/certificates/:id - Sertifikatni o'chirish
app.delete("/api/certificates/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id); // Modelda ID Number type

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: "Noto'g'ri ID format",
      });
    }

    if (mongoose.connection.readyState === 1) {
      const deleted = await Certificate.findOneAndDelete({ id: id });
      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: "Sertifikat topilmadi",
        });
      }

      console.log(`✅ DB: Sertifikat o'chirildi ID: ${id}`);
      return res.json({
        success: true,
        message: "Sertifikat muvaffaqiyatli o'chirildi (DB)",
        id,
        deleted: deleted,
      });
    } else {
      // Fallback
      let certs = readCertificatesFile();
      const initialLength = certs.length;
      const certificateToDelete = certs.find((cert) => cert.id === id);
      certs = certs.filter((c) => c.id !== id);
      if (certs.length === initialLength) {
        return res.status(404).json({
          success: false,
          error: "Sertifikat topilmadi",
        });
      }

      fs.writeFileSync(
        certificatesPath,
        JSON.stringify(certs, null, 2),
        "utf8"
      );
      console.log(
        `✅ File: Sertifikat o'chirildi: ${certificateToDelete.studentName} (ID: ${id})`
      );
      return res.json({
        success: true,
        message: "Sertifikat muvaffaqiyatli o'chirildi (File)",
        id,
        deleted: certificateToDelete,
      });
    }
  } catch (error) {
    console.error("DELETE /api/certificates/:id error:", error);
    res.status(500).json({
      success: false,
      error: "Server xatosi: " + error.message,
      message: NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

// PUT /api/certificates/:id - Sertifikatni yangilash (ixtiyoriy)
app.put("/api/certificates/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updateData = req.body;

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: "Noto'g'ri ID format",
      });
    }

    if (mongoose.connection.readyState === 1) {
      // Sanitize update data
      const sanitizedUpdateData = {};
      if (updateData.studentName)
        sanitizedUpdateData.studentName = String(updateData.studentName).trim();
      if (updateData.courseName)
        sanitizedUpdateData.courseName = String(updateData.courseName).trim();
      if (updateData.date)
        sanitizedUpdateData.date = String(updateData.date).trim();
      if (updateData.qrLabel !== undefined)
        sanitizedUpdateData.qrLabel = String(updateData.qrLabel).trim();
      sanitizedUpdateData.updatedAt = new Date().toISOString();

      const updated = await Certificate.findOneAndUpdate(
        { id: id },
        sanitizedUpdateData,
        { new: true } // Qaytarilgan data yangilangan bo'lsin
      );
      if (!updated) {
        return res.status(404).json({
          success: false,
          error: "Sertifikat topilmadi",
        });
      }
      console.log(`✅ DB: Sertifikat yangilandi: ID ${id}`);
      return res.json({
        success: true,
        data: updated,
        message: "Sertifikat muvaffaqiyatli yangilandi (DB)",
      });
    } else {
      res.status(501).json({
        success: false,
        error: "File rejimida tahrirlash hozircha o'chirilgan",
      });
    }
  } catch (error) {
    console.error("PUT /api/certificates/:id error:", error);
    res.status(500).json({
      success: false,
      error: "Server xatosi: " + error.message,
      message: NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  try {
    const certificates = readCertificates();
    res.json({
      status: "OK",
      message: "Server ishlamoqda",
      environment: NODE_ENV,
      certificatesCount: certificates.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: "ERROR",
      message: "Server xatosi",
      error: error.message,
    });
  }
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Narpay IT Academy Backend API",
    version: "1.0.0",
    endpoints: {
      health: "/api/health",
      certificates: "/api/certificates",
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Endpoint topilmadi",
    path: req.path,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Global error handler:", err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || "Server xatosi",
    ...(NODE_ENV === "development" && { stack: err.stack }),
  });
});

// Keep-Alive Mechanism (Render Free Tier uyquga ketishini oldini olish uchun)
// 14 daqiqada bir marta o'ziga so'rov yuboradi (Render 15 daqiqada uxlaydi)
const performKeepAlive = () => {
  // Render o'zi RENDER_EXTERNAL_URL ni taqdim etadi
  const targetUrl =
    process.env.RENDER_EXTERNAL_URL || process.env.KEEP_ALIVE_URL;

  if (targetUrl) {
    console.log(`⏰ Keep-Alive tizimi ishga tushdi. Target: ${targetUrl}`);

    const interval = 14 * 60 * 1000; // 14 daqiqa

    setInterval(async () => {
      try {
        console.log(`ping... ${new Date().toISOString()}`);
        const response = await fetch(`${targetUrl}/api/health`);
        console.log(`pong! Status: ${response.status}`);
      } catch (error) {
        console.error("Keep-Alive error:", error.message);
      }
    }, interval);
  } else {
    if (NODE_ENV === "production") {
      console.log(
        "⚠️ Keep-Alive uchun URL topilmadi. RENDER_EXTERNAL_URL yoki KEEP_ALIVE_URL sozlanmagan."
      );
    }
  }
};

// Server ishga tushganda keep-alive ni boshlash
performKeepAlive();

// Server ishga tushirish (faqat standalone rejimda)
// Vercel kabi serverless platformlarda bu qism ishlamaydi
if (process.env.VERCEL !== "1") {
  app.listen(PORT, "0.0.0.0", () => {
    console.log("=".repeat(50));
    console.log(`🚀 Backend server ishga tushdi`);
    console.log(`📡 Port: ${PORT}`);
    console.log(`🌍 Environment: ${NODE_ENV}`);
    console.log(`📋 Certificates fayl: ${certificatesPath}`);
    console.log(`🔗 API: http://localhost:${PORT}/api`);
    console.log(`💚 Health: http://localhost:${PORT}/api/health`);
    console.log(`📦 Certificates: http://localhost:${PORT}/api/certificates`);
    console.log("=".repeat(50));

    // Server holatini tekshirish
    // Server holatini tekshirish
    const certificates = readCertificatesFile();
    console.log(
      `✅ ${certificates.length} ta sertifikat yuklandi (File Fallback)`
    );
  });
}

// Export for Vercel serverless functions
export default app;
