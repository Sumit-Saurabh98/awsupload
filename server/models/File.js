// File.js - Mongoose model for file metadata
const mongoose = require("mongoose");

const PartSchema = new mongoose.Schema({
  PartNumber: { type: Number, required: true },
  ETag: { type: String, required: true },
  Size: { type: Number },
});

const FileSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  key: { type: String, required: true, unique: true }, // S3 object key
  bucket: { type: String, required: true },
  mimeType: { type: String },
  size: { type: Number },
  extension: { type: String },
  etag: { type: String }, // final object ETag
  uploadId: { type: String }, // multipart upload id (if any)
  parts: [PartSchema], // parts info for multipart
  status: { type: String, enum: ["uploading","completed","aborted"], default: "uploading" },
}, { timestamps: true });

module.exports = mongoose.model("File", FileSchema);
