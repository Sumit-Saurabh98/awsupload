// fileController.js - Express controllers for the flow described.

const File = require("../models/File");
const s3Service = require("../services/s3Service");

const PART_SIZE = parseInt(process.env.PART_SIZE_BYTES || (10 * 1024 * 1024), 10); // 10MB default
const BUCKET = s3Service.BUCKET;

/** presign single small file (<= threshold) */
async function presignSingle(req, res) {
  try {
    const { filename, contentType } = req.body;
    if (!filename) return res.status(400).json({ error: "filename required" });

    const key = s3Service.generateKey(filename);
    const url = await s3Service.generatePresignedPutUrl({ key, contentType });

    return res.json({ url, key, bucket: BUCKET });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}

/** register metadata after single PUT upload (client sends ETag) */
async function registerSingle(req, res) {
  try {
    const { filename, key, size, mimeType, etag } = req.body;
    if (!key || !filename) return res.status(400).json({ error: "key and filename required" });

    const extension = filename.includes(".") ? filename.split(".").pop() : "";

    const fileDoc = new File({
      filename,
      key,
      bucket: BUCKET,
      mimeType,
      size,
      extension,
      etag,
      status: "completed",
    });
    await fileDoc.save();
    return res.json(fileDoc);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}

/** initiate multipart - returns uploadId + presigned upload URLs for parts */
async function initiateMultipart(req, res) {
  try {
    const { filename, contentType, size } = req.body;
    if (!filename || !size) return res.status(400).json({ error: "filename and size required" });

    const key = s3Service.generateKey(filename);
    const uploadId = await s3Service.createMultipartUpload({ key, contentType });

    // determine number of parts based on configured PART_SIZE
    const partCount = Math.ceil(size / PART_SIZE);
    if (partCount > 10000) { // S3 limit
      return res.status(400).json({ error: "file would need more than 10000 parts - increase part size" });
    }

    // generate presigned URLs for each part
    const uploadUrls = await s3Service.generatePresignedUploadPartUrls({ key, uploadId, partCount });

    // create a DB record in "uploading" state so we can track/abort if needed
    const fileDoc = new (require("../models/File"))({
      filename,
      key,
      bucket: BUCKET,
      mimeType: contentType,
      size,
      extension: filename.includes(".") ? filename.split(".").pop() : "",
      uploadId,
      status: "uploading",
    });
    await fileDoc.save();

    return res.json({ uploadId, key, partSize: PART_SIZE, uploadUrls, fileId: fileDoc._id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}

/** complete multipart - client sends parts [{ETag, PartNumber, Size}] */
async function completeMultipart(req, res) {
  try {
    const { key, uploadId, parts, fileId } = req.body;
    if (!key || !uploadId || !parts || !Array.isArray(parts)) return res.status(400).json({ error: "key, uploadId and parts required" });

    // complete the multipart upload
    const resp = await s3Service.completeMultipartUpload({ key, uploadId, parts });

    // update DB file record
    const update = {
      etag: resp.ETag,
      parts,
      status: "completed",
    };
    const updated = await File.findByIdAndUpdate(fileId, update, { new: true });

    return res.json({ s3Resp: resp, file: updated });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}

/** abort multipart upload and mark DB record aborted */
async function abortMultipart(req, res) {
  try {
    const { key, uploadId, fileId } = req.body;
    if (!key || !uploadId) return res.status(400).json({ error: "key and uploadId required" });

    await s3Service.abortMultipartUpload({ key, uploadId });
    if (fileId) {
      await File.findByIdAndUpdate(fileId, { status: "aborted" });
    }
    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}

/** delete file - finds file by id and deletes S3 object */
async function deleteFile(req, res) {
  try {
    const { id } = req.params;
    const file = await File.findById(id);
    if (!file) return res.status(404).json({ error: "file not found" });

    // if it's still uploading with an uploadId, abort first
    if (file.uploadId && file.status === "uploading") {
      await s3Service.abortMultipartUpload({ key: file.key, uploadId: file.uploadId }).catch(e => console.warn("abort failed", e));
    }

    // delete object (safe even if multipart completed)
    await s3Service.deleteObject({ key: file.key });
    // remove or mark record
    await File.findByIdAndDelete(id);

    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}

async function getViewUrl(req, res) {
  try {
    const { key, expiresIn } = req.body;
    if (!key) return res.status(400).json({ error: "key required" });
    const url = await s3Service.generatePresignedGetUrl({ key, expires: expiresIn });
    return res.json({ url, key, bucket: BUCKET });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}

module.exports = {
  presignSingle,
  registerSingle,
  initiateMultipart,
  completeMultipart,
  abortMultipart,
  deleteFile,
  getViewUrl,
};
