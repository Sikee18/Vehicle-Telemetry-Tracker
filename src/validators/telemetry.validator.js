const Joi = require('joi');

const createTelemetrySchema = Joi.object({
    vehicleId: Joi.string().required(),
    vehicleType: Joi.string().valid('FUEL', 'EV').required(),
    timestamp: Joi.date().iso().required(),
    speed: Joi.number().min(0).max(200).required(),
    engineTemperature: Joi.number().min(0).max(150).required(),

    // Fuel specifics
    fuelLevel: Joi.number().min(0).max(100).when('vehicleType', {
        is: 'FUEL',
        then: Joi.required(),
        otherwise: Joi.forbidden()
    }),
    fuelConsumptionRate: Joi.number().positive().when('vehicleType', {
        is: 'FUEL',
        then: Joi.required(),
        otherwise: Joi.forbidden()
    }),

    // EV specifics
    batteryLevel: Joi.number().min(0).max(100).when('vehicleType', {
        is: 'EV',
        then: Joi.required(),
        otherwise: Joi.forbidden()
    }),
    energyConsumptionRate: Joi.number().positive().when('vehicleType', {
        is: 'EV',
        then: Joi.required(),
        otherwise: Joi.forbidden()
    })
});

module.exports = {
    createTelemetrySchema
};
