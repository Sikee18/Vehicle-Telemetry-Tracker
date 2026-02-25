const Joi = require('joi');

const recentQuerySchema = Joi.object({
    limit: Joi.number().integer().min(1).max(100).default(10)
});

const rangeQuerySchema = Joi.object({
    start: Joi.date().iso().required(),
    end: Joi.date().iso().min(Joi.ref('start')).required()
});

module.exports = {
    recentQuerySchema,
    rangeQuerySchema
};
