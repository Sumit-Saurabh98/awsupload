import express from "express";

import {
  startUpload,
  abortUpload,
  completeUpload,
  getPartUrl,
  getResource,
} from "../controllers/uploadController.js";

const router = express.Router();

router.post("/start-upload", startUpload); // start - create resource
router.get("/part-url", getPartUrl); /** ?resourceId=&partNumber= */
router.post("/complete-upload", completeUpload); // finalize upload
router.post("/abort-upload", abortUpload); // abort upload

export default router;
