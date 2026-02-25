const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const telemetryRoutes = require('./routes/telemetry.routes');
const vehicleRoutes = require('./routes/vehicle.routes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Main Routes
app.use('/telemetry', telemetryRoutes);
app.use('/vehicles', vehicleRoutes);

// Centralized Error Handling Middleware
app.use(errorHandler);

module.exports = app;
