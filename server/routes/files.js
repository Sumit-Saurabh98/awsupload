// files.js - Express routes for file uploads
const express = require("express");
const router = express.Router();
const controller = require("../controllers/fileController");

router.post("/presign", controller.presignSingle); // get presigned PUT URL for small files
router.post("/register", controller.registerSingle); // register metadata after single upload

router.post("/multipart/initiate", controller.initiateMultipart); // init multipart and get part URLs
router.post("/multipart/complete", controller.completeMultipart); // complete multipart upload
router.post("/multipart/abort", controller.abortMultipart); // abort multipart

router.post("/view", controller.getViewUrl); // get presigned GET url for rendering

router.delete("/:id", controller.deleteFile); // delete file by DB id

module.exports = router;
