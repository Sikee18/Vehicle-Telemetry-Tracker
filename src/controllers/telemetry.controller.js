const supabase = require('../config/supabase');

const mapToSnakeCase = (data) => {
    return {
        vehicle_id: data.vehicleId,
        vehicle_type: data.vehicleType,
        timestamp: data.timestamp,
        speed: data.speed,
        engine_temperature: data.engineTemperature,
        fuel_level: data.fuelLevel,
        fuel_consumption_rate: data.fuelConsumptionRate,
        battery_level: data.batteryLevel,
        energy_consumption_rate: data.energyConsumptionRate
    };
};

const mapToCamelCase = (data) => {
    return {
        id: data.id,
        vehicleId: data.vehicle_id,
        vehicleType: data.vehicle_type,
        timestamp: data.timestamp,
        speed: data.speed,
        engineTemperature: data.engine_temperature,
        fuelLevel: data.fuel_level,
        fuelConsumptionRate: data.fuel_consumption_rate,
        batteryLevel: data.battery_level,
        energyConsumptionRate: data.energy_consumption_rate
    };
};

exports.createTelemetry = async (req, res, next) => {
    try {
        const dbPayload = mapToSnakeCase(req.body);

        const { data: telemetry, error } = await supabase
            .from('telemetry')
            .insert([dbPayload])
            .select()
            .single();

        if (error) {
            // Pass the PostgreSQL/Supabase error to central handler
            return next(error);
        }

        res.status(201).json({
            success: true,
            data: mapToCamelCase(telemetry)
        });
    } catch (error) {
        next(error);
    }
};
