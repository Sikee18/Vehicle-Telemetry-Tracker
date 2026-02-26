const express = require('express');
const router = express.Router();
const nlpController = require('../controllers/nlp.controller');

// Route to process natural language querying and returning JSON data
router.post('/query', nlpController.generateAndExecuteQuery);

// Route to convert passed JSON result data to CSV for download
router.post('/export/csv', nlpController.exportToCsv);

module.exports = router;
