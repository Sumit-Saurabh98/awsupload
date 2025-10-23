"use client";

import React, { useRef, useState, useEffect } from "react";
import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

/**
 * Modern FileUploader for App Router
 * ---------------------------------
 * - Handles small (single PUT) and large (multipart) uploads
 * - Supports pause, resume, abort
 * - Shows progress bar and status
 */
export default function FileUploader() {
  const [resourceName, setResourceName] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | starting | uploading | complete | error | aborted | error
  const [progress, setProgress] = useState(0);
  const [uploadInfo, setUploadInfo] = useState(null);
  const [resourceId, setResourceId] = useState(null);
  const [partsUploaded, setPartsUploaded] = useState([]);
  const [chunkSize, setChunkSize] = useState(10 * 1024 * 1024);
  const controllerRef = useRef(null);
  // keep controller for aborting ongoing fetches

  useEffect(() => {
    setProgress(0);
    setStatus("idle");
    setUploadInfo(null);
    setResourceId(null);
    setPartsUploaded([]);
  }, [file]);

  // ========================
  // Main upload entry point
  // ========================
  async function handleStartUpload(e) {
    e.preventDefault();
    if (!file || !resourceName) {
      alert("Please enter a Resource Name and choose a file.");
      return;
    }

    setStatus("starting");
    try {
      console.log("Starting upload...");
      console.log(resourceName, description, file);
      const startRes = await axios.post(`${API_BASE}/api/upload/start-upload`, {
        resourceName,
        description,
        fileName: file.name,
        contentType: file.type,
        size: file.size,
      });

      const data = startRes.data;
      setUploadInfo(data);
      setResourceId(data.resourceId);

      if (data.type === "single") {
        setStatus("uploading");
        await uploadSingleFile(data.uploadUrl);
        await axios.post(`${API_BASE}/api/upload/complete-upload`, {
          resourceId: data.resourceId,
        });
        setStatus("complete");
      } else {
        setStatus("uploading");
        if (data.partSize) setChunkSize(data.partSize);
        // uploadMultipart now returns the uploaded parts array to avoid stale state
        const completedParts = await uploadMultipart(data);
        // if nothing uploaded, treat as error/aborted by user flow; otherwise complete
        if (!Array.isArray(completedParts) || completedParts.length === 0) {
          setStatus("aborted");
        } else {
          setStatus("completing");
          await axios.post(`${API_BASE}/api/upload/complete-upload`, {
            resourceId: data.resourceId,
            parts: completedParts,
          });
          setStatus("complete");
        }
      }
    } catch (err) {
      console.error("Upload start error:", err);
      setStatus("error");
      alert(
        "Upload start error: " + (err.response?.data?.error || err.message)
      );
    }
  }

  // ========================
  // Single PUT upload
  // ========================
  async function uploadSingleFile(uploadUrl) {
    try {
      controllerRef.current = new AbortController();
      await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        signal: controllerRef.current.signal,
      });
      setProgress(100);
    } catch (err) {
      console.error("Single upload error:", err);
      throw err;
    } finally {
      controllerRef.current = null;
    }
  }

  // ========================
  // Multipart upload
  // ========================
  async function uploadMultipart(info) {
    const { resourceId, partsCount } = info;
    const totalParts = partsCount || Math.ceil(file.size / chunkSize);
    let uploadedParts = [...partsUploaded];
    const concurrency = 3;
    let inFlight = 0;
    let currentPart = 1;

    const uploadPart = async (partNumber) => {
      const start = (partNumber - 1) * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const blob = file.slice(start, end);

      const urlRes = await axios.get(`${API_BASE}/api/upload/part-url`, {
        params: { resourceId, partNumber },
      });
      const partUrl = urlRes.data.url;

      controllerRef.current = new AbortController();
      const resp = await fetch(partUrl, {
        method: "PUT",
        body: blob,
        signal: controllerRef.current.signal,
      });

      if (!resp.ok)
        throw new Error(`Part ${partNumber} failed (${resp.status})`);
      const eTag = resp.headers.get("etag") || resp.headers.get("ETag");
      uploadedParts.push({ PartNumber: partNumber, ETag: eTag });
      setPartsUploaded([...uploadedParts]);
      setProgress(Math.round((uploadedParts.length / totalParts) * 100));
    };

    const queue = [];
    while (currentPart <= totalParts) {
      // removed client-side pause/resume; continue uploading parts until done or aborted

      if (inFlight >= concurrency) {
        await new Promise((r) => setTimeout(r, 200));
        continue;
      }

      inFlight++;
      const part = currentPart++;

      const promise = uploadPart(part)
        .catch((err) => {
          if (err.name !== "AbortError") {
            console.error("Part upload error:", err);
            setStatus("error");
          }
        })
        .finally(() => inFlight--);

      queue.push(promise);
      await new Promise((r) => setTimeout(r, 100));
    }

    // Wait for all parts
    await Promise.all(queue);
    setPartsUploaded([...uploadedParts]);
    // return the uploaded parts for immediate use by caller (avoids stale state)
    return uploadedParts;
  }

  // ========================
  // Control Handlers
  // ========================
  // pause/resume functions removed

  async function handleAbort() {
    try {
      // stop any inflight requests and notify server
      if (controllerRef.current) controllerRef.current.abort();
      if (resourceId) {
        await axios.post(`${API_BASE}/api/upload/abort-upload`, { resourceId });
      }
      setStatus("aborted");
      setProgress(0);
      setPartsUploaded([]);
    } catch (err) {
      console.error("Abort failed:", err);
    }
  }

  // ========================
  // UI Rendering
  // ========================
  return (
    <div className="space-y-6">
      <form onSubmit={handleStartUpload} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Resource Name
          </label>
          <input
            value={resourceName}
            onChange={(e) => setResourceName(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border px-3 py-2"
            placeholder="Enter resource name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 block w-full rounded-md border px-3 py-2"
            placeholder="Optional description"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            File
          </label>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files[0])}
            className="mt-1 block w-full"
          />
          {file && (
            <p className="text-sm text-gray-500 mt-1">
              {file.name} ({Math.round(file.size / 1024 / 1024)} MB)
            </p>
          )}
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={!file || status === "uploading"}
            className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:bg-gray-400"
          >
            Start Upload
          </button>
          {/* Pause/Resume removed from UI */}
          <button
            type="button"
            onClick={handleAbort}
            disabled={status === "idle"}
            className="px-4 py-2 bg-red-600 text-white rounded-md disabled:bg-gray-400"
          >
            Abort
          </button>
        </div>
      </form>

      {/* Progress Section */}
      <div>
        <div className="flex justify-between text-sm mb-1">
          <span>Status: {status}</span>
          <span>{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
          <div
            className="bg-blue-600 h-3 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Debug Info */}
      <details className="mt-4 bg-gray-50 rounded-md p-3">
        <summary className="cursor-pointer font-semibold">Debug Info</summary>
        <div className="mt-2 text-xs text-gray-700 space-y-2">
          <div>
            <strong>Resource ID:</strong> {resourceId}
          </div>
          <div>
            <strong>Uploaded Parts:</strong> {partsUploaded.length}
          </div>
          <pre className="bg-gray-100 p-2 rounded-md overflow-auto max-h-40">
            {JSON.stringify(uploadInfo, null, 2)}
          </pre>
        </div>
      </details>
    </div>
  );
}
