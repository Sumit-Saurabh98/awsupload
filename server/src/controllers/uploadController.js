import Resource from "../models/Resource.js";
import dotenv from "dotenv";
dotenv.config();
import { v4 as uuidv4 } from "uuid";
import {
  createPreSignedPutUrl,
  completeMultiPartUpload,
  getPartPreSignedUrl,
  startMultipartUpload,
  abortMultiPartUpload,
  headObject,
} from "../services/s3Service.js";

// parse max single upload size (bytes) from env, fallback to 5MB
const MAX_SINGLE_UPLOAD =
  Number(process.env.MAX_SINGLE_UPLOAD_SIZE) || 5 * 1024 * 1024;

// helper to generate s3 key (in production you might prefer adding userOd to it)
function generateKey(fileName) {
  const id = uuidv4();
  return `${process.env.S3_UPLOAD_PREFIX || ""}${id}-${fileName}`;
}

/**
 * Start an upload session
 * if size is <= threshold -> issue single put pre signed url
 * Otherwise -> Start multipart, return uploadId + partSize + partsCount or let client request part url dynamically
 */

export async function startUpload(req, res) {
  try {
    const { resourceName, description, fileName, contentType, size } =
      req?.body;
    if (!resourceName || !fileName) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const key = generateKey(fileName);

    // create db entry
    const doc = new Resource({
      resourceName,
      description,
      s3: {
        bucket: process.env.S3_BUCKET,
        key,
        contentType,
        size,
        status: "pending",
      },
    });

    await doc.save();

    if (size <= MAX_SINGLE_UPLOAD) {
      // single put flow
      const uploadUrl = await createPreSignedPutUrl(key, 900); // 15 mins

      doc.s3.status = "uploading";
      await doc.save();

      return res
        .status(200)
        .json({ type: "single", uploadUrl, key, resourceId: doc?._id });
    } else {
      // multipart flow - pick part size (eg-10mb)
      const uploadId = await startMultipartUpload(key, contentType);
      doc.s3.uploadId = uploadId;
      doc.s3.status = "uploading";
      await doc.save();

      // tell client recommended part size and parts count (client can decide)

      const partSize = 10 * 1024 * 1024;
      const partsCount = Math.ceil(size / partSize);
      return res.status(200).json({
        type: "multipart",
        resourceId: doc?._id,
        key,
        uploadId,
        partSize,
        partsCount,
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: error.message });
  }
}

// provide presigned url for a specific part (client can call per part)
export async function getPartUrl(req, res) {
  try {
    const { resourceId, partNumber } = req.query;

    if (!resourceId || !partNumber) {
      return res
        .status(400)
        .json({ error: "missing resourceId or partNumber" });
    }

    const doc = await Resource.findById(resourceId);

    if (!doc) {
      return res.status(400).json({ error: "Resource not found" });
    }

    if (!doc.s3.uploadId) {
      return res.status(400).json({ error: "No multipart upload in progress" });
    }

    const url = await getPartPreSignedUrl(
      doc.s3.key,
      doc.s3.uploadId,
      Number(partNumber),
      3600
    );
    return res.status(200).json({ url });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: error.message });
  }
}

// complete upload (single or multipart)

export async function completeUpload(req, res) {
  try {
    const { resourceId, parts } = req.body; // parts: [{PartNumber, ETag}, ...] for multipart
    if (!resourceId) {
      return res.status(400).json({ error: "Missing resource id" });
    }

    const doc = await Resource.findById(resourceId);

    if (!doc) {
      return res.status(400).json({ error: "Resource not found" });
    }

    if (!doc.s3.uploadId) {
      // single file - verify object exists and record metadata
      const info = await headObject(doc.s3.key);
      // normalize ETag (may be quoted)
      doc.s3.etag = info.ETag ? info.ETag.replace(/\"/g, "") : info.ETag;
      doc.s3.status = "complete";
      await doc.save();
      return res.status(200).json({ ok: true, s3: doc.s3 });
    } else {
      // multipart - complete with parts
      if (!Array.isArray(parts) || parts.length <= 0) {
        return res
          .status(400)
          .json({ error: "Parts are required for multipart complete" });
      }
      // complete on s3
      // AWS requires parts sorted by PartNumber
      const normalizedParts = parts
        .map((p) => ({
          PartNumber: Number(p.PartNumber ?? p.partNumber),
          ETag: String(p.ETag ?? p.ETag ?? ""),
        }))
        .sort((a, b) => a.PartNumber - b.PartNumber)
        .map((p) => ({
          PartNumber: p.PartNumber,
          ETag: p.ETag.replace(/"/g, ""),
        }));

      // validate normalized parts
      const invalid = normalizedParts.find(
        (p) => !Number.isFinite(p.PartNumber) || !p.ETag || p.PartNumber <= 0
      );
      if (invalid) {
        return res
          .status(400)
          .json({ error: "Invalid parts provided for multipart complete" });
      }

      const result = await completeMultiPartUpload(
        doc.s3.key,
        doc.s3.uploadId,
        normalizedParts
      );

      // save parts and metadata in DB
      doc.s3.parts = normalizedParts;
      doc.s3.etag = result?.ETag
        ? String(result.ETag).replace(/\"/g, "")
        : result?.ETag;
      // headObject to get the final size
      const info = await headObject(doc.s3.key);
      doc.s3.size = info.ContentLength || doc.s3.size;
      doc.s3.status = "complete";
      // clear uploadId as it's finished
      doc.s3.uploadId = undefined;
      await doc.save();
      return res.status(200).json({ ok: true, s3: doc.s3 });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: error.message });
  }
}

// Abort multipart upload and mark db as aborted
export async function abortUpload(req, res) {
  try {
    const { resourceId } = req.body;
    if (!resourceId) {
      return res.status(400).json({ error: "Missing resource id" });
    }

    const doc = await Resource.findById(resourceId);

    if (!doc) {
      return res.status(400).json({ error: "Resource not found" });
    }

    if (doc.s3.uploadId) {
      await abortMultiPartUpload(doc.s3.key, doc.s3.uploadId);
      doc.s3.status = "aborted";
      await doc.save();
      return res
        .status(200)
        .json({ ok: true, message: "multipart upload marked aborted" });
    } else {
      // for single upload - optionally delete the object and mark aborted
      doc.s3.status = "aborted";
      await doc.save();
      return res.json({ ok: true, message: "single upload marked aborted" });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: error.message });
  }
}
