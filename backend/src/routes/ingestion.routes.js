const express = require('express');
const router = express.Router();
const multer = require('multer');

// Configure multer for memory storage (useful for smaller files and passing stream buffers)
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 } // 50 MB limit
});

const ingestionController = require('../controllers/ingestion.controller');

// Route for pasting raw JSON
router.post('/json', ingestionController.ingestRawJson);

// Route for uploading a file (CSV, JSON, XLSX)
router.post('/upload', upload.single('file'), ingestionController.ingestFile);

module.exports = router;
