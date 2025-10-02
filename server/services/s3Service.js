// s3Service.js - small utility functions that wrap S3 actions.
// Keep each function single-responsibility and documented.

const s3 = require("../config/s3Client");
const { GetObjectCommand, PutObjectCommand, CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand, AbortMultipartUploadCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const crypto = require("crypto");

const BUCKET = process.env.S3_BUCKET_NAME;
const PRESIGN_EXPIRES = parseInt(process.env.PRESIGN_EXPIRES || "3600", 10);

/** generateKey - make a reasonably unique S3 key for the uploaded file */
function generateKey(filename) {
  const ext = filename.includes(".") ? filename.split(".").pop() : "";
  const random = crypto.randomBytes(8).toString("hex");
  const key = `${Date.now()}-${random}${ext ? "." + ext : ""}`;
  return key;
}

/** generatePresignedPutUrl - returns a presigned PUT URL for a single (non-multipart) upload */
async function generatePresignedPutUrl({ key, contentType, expires = PRESIGN_EXPIRES }) {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  });
  const url = await getSignedUrl(s3, command, { expiresIn: expires });
  return url;
}

/** generatePresignedGetUrl - returns a presigned GET URL to view/download an object */
async function generatePresignedGetUrl({ key, expires = PRESIGN_EXPIRES }) {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });
  const url = await getSignedUrl(s3, command, { expiresIn: expires });
  return url;
}

/** createMultipartUpload - starts a multipart upload and returns UploadId */
async function createMultipartUpload({ key, contentType }) {
  const command = new CreateMultipartUploadCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  });
  const resp = await s3.send(command);
  // resp.UploadId
  return resp.UploadId;
}

/** generatePresignedUploadPartUrls - generate presigned URLs for UploadPart (partNumbers start at 1) */
async function generatePresignedUploadPartUrls({ key, uploadId, partCount, expires = PRESIGN_EXPIRES }) {
  const urls = [];
  for (let i = 1; i <= partCount; i++) {
    const cmd = new UploadPartCommand({
      Bucket: BUCKET,
      Key: key,
      UploadId: uploadId,
      PartNumber: i,
    });
    const url = await getSignedUrl(s3, cmd, { expiresIn: expires });
    urls.push({ partNumber: i, url });
  }
  return urls;
}

/** completeMultipartUpload - finish multi-part with parts array [{ETag, PartNumber}] */
async function completeMultipartUpload({ key, uploadId, parts }) {
  // AWS expects parts sorted by PartNumber asc
  const sortedParts = parts.sort((a, b) => a.PartNumber - b.PartNumber);
  const command = new CompleteMultipartUploadCommand({
    Bucket: BUCKET,
    Key: key,
    UploadId: uploadId,
    MultipartUpload: {
      Parts: sortedParts,
    },
  });
  const resp = await s3.send(command);
  // resp.ETag contains the final ETag for the assembled object
  return resp;
}

/** abortMultipartUpload - abort a multipart upload */
async function abortMultipartUpload({ key, uploadId }) {
  const command = new AbortMultipartUploadCommand({
    Bucket: BUCKET,
    Key: key,
    UploadId: uploadId,
  });
  return s3.send(command);
}

/** deleteObject - delete an object from S3 */
async function deleteObject({ key }) {
  const cmd = new DeleteObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });
  return s3.send(cmd);
}

module.exports = {
  generateKey,
  generatePresignedPutUrl,
  generatePresignedGetUrl,
  createMultipartUpload,
  generatePresignedUploadPartUrls,
  completeMultipartUpload,
  abortMultipartUpload,
  deleteObject,
  BUCKET,
};
