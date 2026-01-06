import mongoose from "mongoose";

const certificateSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      required: true,
      unique: true,
    },
    studentName: {
      type: String,
      required: true,
      trim: true,
    },
    courseName: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: String,
      required: true,
    },
    qrLabel: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Auto-increment ID implementation (simple version)
// Note: In high-concurrency apps, use a separate counter collection
certificateSchema.pre("save", async function (next) {
  if (this.isNew && !this.id) {
    // ID generatsiyasi server.js da qilinmoqda (Date.now())
    // Yoki bu yerda eng katta ID ni topib +1 qilish mumkin
    // Hozirchalik server.js dagi mantiqni saqlab qolamiz va ID required qilamiz
  }
  next();
});

const Certificate = mongoose.model("Certificate", certificateSchema);

export default Certificate;
