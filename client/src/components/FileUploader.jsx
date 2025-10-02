import React, { useState, useEffect } from "react";
import { getPresignUrl, registerSingle, initiateMultipart, completeMultipart, abortMultipart, getViewUrl } from "../api/files";
import { chunkFile } from "../utils/chunkFile";

export default function FileUploader() {
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [viewUrl, setViewUrl] = useState("");
  const [uploadedMeta, setUploadedMeta] = useState(null);

  // Load last uploaded file from localStorage on mount and fetch a fresh presigned GET url
  useEffect(() => {
    try {
      const saved = localStorage.getItem("lastUploadedFile");
      if (saved) {
        const meta = JSON.parse(saved);
        if (meta && meta.key) {
          setUploadedMeta(meta);
          getViewUrl({ key: meta.key })
            .then(res => setViewUrl(res.data.url))
            .catch(err => console.warn("Failed to restore preview url", err));
        }
      }
    } catch (e) {
      console.warn("Failed to parse saved preview", e);
    }
  }, []);

  // Persist uploaded meta whenever it changes
  useEffect(() => {
    if (uploadedMeta && uploadedMeta.key) {
      try {
        const minimal = {
          key: uploadedMeta.key,
          filename: uploadedMeta.filename,
          mimeType: uploadedMeta.mimeType,
          _id: uploadedMeta._id,
        };
        localStorage.setItem("lastUploadedFile", JSON.stringify(minimal));
      } catch (e) {
        console.warn("Failed to persist preview", e);
      }
    }
  }, [uploadedMeta]);

  const THRESHOLD = 10 * 1024 * 1024; // 10MB threshold; keep in sync with backend PART_SIZE

  const onFileChange = (e) => {
    setFile(e.target.files[0]);
    setProgress(0);
    setStatus("");
    setViewUrl("");
    setUploadedMeta(null);
  };

  // small file upload
  async function uploadSmall(file) {
    setStatus("Requesting presigned URL...");
    const { data } = await getPresignUrl({ filename: file.name, contentType: file.type, size: file.size });
    const { url, key } = data;

    setStatus("Uploading...");
    const putResp = await fetch(url, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
    if (!putResp.ok) throw new Error("Upload failed");

    // S3 returns an ETag header for single PUT
    const etag = putResp.headers.get("etag");

    setStatus("Registering with server...");
    const reg = await registerSingle({ filename: file.name, key, size: file.size, mimeType: file.type, etag });
    setStatus("Done");
    setProgress(100);

    // save meta to render
    setUploadedMeta(reg.data);
    // request a presigned GET to render
    try {
      const view = await getViewUrl({ key });
      setViewUrl(view.data.url);
    } catch (e) {
      console.warn("Failed to get view url", e);
    }

    return reg.data;
  }

  // multipart upload
  async function uploadLarge(file) {
    setStatus("Initiating multipart...");
    // ask server to create upload and get presigned URLs
    const initResp = await initiateMultipart({ filename: file.name, contentType: file.type, size: file.size });
    const { uploadId, key, uploadUrls, partSize, fileId } = initResp.data;

    // create chunks locally to match server's partSize
    const chunks = chunkFile(file, partSize);

    // map partNumber => url for safety (server returned ordered array)
    const urlMap = {};
    uploadUrls.forEach(u => { urlMap[u.partNumber] = u.url; });

    setStatus("Uploading parts...");
    const parts = []; // will collect {ETag, PartNumber, Size}

    // concurrency-limited uploader (max 3 parallel)
    const MAX_CONCURRENCY = 3;
    let active = 0;
    let index = 0;

    return new Promise((resolve, reject) => {
      const next = () => {
        if (index >= chunks.length && active === 0) {
          // all done
          finalize();
          return;
        }
        while (active < MAX_CONCURRENCY && index < chunks.length) {
          const chunkInfo = chunks[index++];
          active++;
          uploadPart(chunkInfo).then(() => {
            active--;
            next();
          }).catch(async (err) => {
            console.error("Part upload error", err);
            // abort multipart on error
            setStatus("Error uploading parts — aborting...");
            try { await abortMultipart({ key, uploadId, fileId }); } catch(e) { console.warn(e); }
            reject(err);
          });
        }
      };

      async function uploadPart({ partNumber, chunk, size }) {
        const url = urlMap[partNumber];
        if (!url) throw new Error(`Missing presigned URL for part ${partNumber}`);

        // Upload using PUT
        const resp = await fetch(url, { method: "PUT", body: chunk });
        if (!resp.ok) throw new Error(`Upload failed for part ${partNumber}`);

        const etag = resp.headers.get("etag");
        parts.push({ ETag: etag, PartNumber: partNumber, Size: size });

        // update overall progress
        const uploaded = parts.reduce((s, p) => s + (p.Size || 0), 0);
        setProgress(Math.min(100, Math.round((uploaded / file.size) * 100)));
      }

      async function finalize() {
        setStatus("Completing multipart on server...");
        // server expects parts as array with ETag and PartNumber (sorted will be handled by server)
        const completeResp = await completeMultipart({ key, uploadId, parts, fileId });
        setProgress(100);
        setStatus("Done");

        // save meta to render
        setUploadedMeta(completeResp.data.file);
        // request presigned GET to render
        try {
          const view = await getViewUrl({ key });
          setViewUrl(view.data.url);
        } catch (e) {
          console.warn("Failed to get view url", e);
        }

        resolve(completeResp.data);
      }

      // start worker loop
      next();
    });
  }

  const onUpload = async () => {
    if (!file) return;
    try {
      if (file.size <= THRESHOLD) {
        setStatus("Small file flow");
        await uploadSmall(file);
      } else {
        setStatus("Multipart flow");
        await uploadLarge(file);
      }
    } catch (err) {
      console.error(err);
      setStatus("Error: " + (err.message || "upload failed"));
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: 20 }}>
      <h3>Upload file to S3 (presigned + multipart)</h3>
      <input type="file" onChange={onFileChange} />
      <div style={{ marginTop: 10 }}>
        <button onClick={onUpload} disabled={!file}>Upload</button>
      </div>
      <div style={{ marginTop: 10 }}>
        <div>Status: {status}</div>
        <div>Progress: {progress}%</div>
      </div>

      {viewUrl && uploadedMeta && (
        <div style={{ marginTop: 20 }}>
          <div>Preview:</div>
          {uploadedMeta.mimeType && uploadedMeta.mimeType.startsWith("image/") ? (
            <img src={viewUrl} alt={uploadedMeta.filename} style={{ maxWidth: "100%", maxHeight: 300 }} />
          ) : uploadedMeta.mimeType && uploadedMeta.mimeType.startsWith("video/") ? (
            <video src={viewUrl} controls style={{ width: "100%", maxHeight: 360 }} />
          ) : (
            <a href={viewUrl} target="_blank" rel="noreferrer">Open file</a>
          )}
        </div>
      )}
    </div>
  );
}
