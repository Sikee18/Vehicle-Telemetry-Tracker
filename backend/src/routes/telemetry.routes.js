const express = require('express');
const router = express.Router();
const telemetryController = require('../controllers/telemetry.controller');
const validate = require('../middleware/validate');
const requireApiKey = require('../middleware/auth');
const { createTelemetrySchema } = require('../validators/telemetry.validator');

// POST /telemetry
router.post('/', requireApiKey, validate(createTelemetrySchema, 'body'), telemetryController.createTelemetry);

module.exports = router;
