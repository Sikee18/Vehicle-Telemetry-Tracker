const mongoose = require('mongoose');

const telemetrySchema = new mongoose.Schema({
  vehicleId: {
    type: String,
    required: true,
    index: true
  },
  vehicleType: {
    type: String,
    required: true,
    enum: ['FUEL', 'EV']
  },
  timestamp: {
    type: Date,
    required: true
  },
  speed: {
    type: Number,
    required: true,
    min: 0,
    max: 200
  },
  engineTemperature: {
    type: Number,
    required: true,
    min: 0,
    max: 150
  },
  // Fuel specific fields
  fuelLevel: {
    type: Number,
    min: 0,
    max: 100,
    required: function() {
      return this.vehicleType === 'FUEL';
    }
  },
  fuelConsumptionRate: {
    type: Number,
    required: function() {
      return this.vehicleType === 'FUEL';
    }
  },
  // EV specific fields
  batteryLevel: {
    type: Number,
    min: 0,
    max: 100,
    required: function() {
      return this.vehicleType === 'EV';
    }
  },
  energyConsumptionRate: {
    type: Number,
    required: function() {
      return this.vehicleType === 'EV';
    }
  }
}, {
  timestamps: false // Disabled automatic timestamps as requested
});

// Indexing for fast retrieval of recent telemetry
telemetrySchema.index({ vehicleId: 1, timestamp: -1 });

module.exports = mongoose.model('Telemetry', telemetrySchema);
