const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicle.controller');
const validate = require('../middleware/validate');
const { recentQuerySchema, rangeQuerySchema } = require('../validators/query.validator');

// GET /vehicles
router.get('/', vehicleController.getAllVehicles);

// GET /vehicles/:vehicleId/latest
router.get('/:vehicleId/latest', vehicleController.getLatestTelemetry);

// GET /vehicles/:vehicleId/recent
router.get('/:vehicleId/recent', validate(recentQuerySchema, 'query'), vehicleController.getRecentTelemetry);

// GET /vehicles/:vehicleId/summary
router.get('/:vehicleId/summary', vehicleController.getVehicleSummary);

// GET /vehicles/:vehicleId
router.get('/:vehicleId', validate(rangeQuerySchema, 'query'), vehicleController.getTelemetryRange);

module.exports = router;
