const supabase = require('../config/supabase');

const mapToCamelCase = (data) => {
    if (!data) return null;
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

// GET /vehicles
exports.getAllVehicles = async (req, res, next) => {
    try {
        const { data: vehicles, error } = await supabase
            .from('telemetry')
            .select('vehicle_id, vehicle_type')
            .order('vehicle_id');

        if (error) {
            return next(error);
        }

        // Use a Set to get distinct vehicle records since Supabase JS doesn't have a distinct method yet
        const uniqueVehiclesMap = new Map();
        vehicles.forEach(v => {
            if (!uniqueVehiclesMap.has(v.vehicle_id)) {
                uniqueVehiclesMap.set(v.vehicle_id, {
                    vehicleId: v.vehicle_id,
                    vehicleType: v.vehicle_type
                });
            }
        });

        const uniqueVehicles = Array.from(uniqueVehiclesMap.values());

        res.status(200).json({
            success: true,
            data: uniqueVehicles
        });
    } catch (error) {
        next(error);
    }
};
// GET /vehicles/:vehicleId/latest
exports.getLatestTelemetry = async (req, res, next) => {
    try {
        const { vehicleId } = req.params;

        const { data: telemetry, error } = await supabase
            .from('telemetry')
            .select('*')
            .eq('vehicle_id', vehicleId)
            .order('timestamp', { ascending: false })
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "No rows returned"
            return next(error);
        }

        if (!telemetry) {
            return res.status(404).json({
                success: false,
                error: 'No telemetry found for this vehicle'
            });
        }

        res.status(200).json({
            success: true,
            data: mapToCamelCase(telemetry)
        });
    } catch (error) {
        next(error);
    }
};

// GET /vehicles/:vehicleId/recent
exports.getRecentTelemetry = async (req, res, next) => {
    try {
        const { vehicleId } = req.params;
        const limit = parseInt(req.query.limit, 10) || 10;

        const { data: telemetry, error } = await supabase
            .from('telemetry')
            .select('*')
            .eq('vehicle_id', vehicleId)
            .order('timestamp', { ascending: false })
            .limit(limit);

        if (error) {
            return next(error);
        }

        res.status(200).json({
            success: true,
            data: telemetry.map(mapToCamelCase)
        });
    } catch (error) {
        next(error);
    }
};

// GET /vehicles/:vehicleId
exports.getTelemetryRange = async (req, res, next) => {
    try {
        const { vehicleId } = req.params;
        const { start, end } = req.query;

        let query = supabase
            .from('telemetry')
            .select('*')
            .eq('vehicle_id', vehicleId)
            .order('timestamp', { ascending: false });

        // Add date range if provided
        if (start) query = query.gte('timestamp', new Date(start).toISOString());
        if (end) query = query.lte('timestamp', new Date(end).toISOString());

        const { data: telemetry, error } = await query;

        if (error) {
            return next(error);
        }

        res.status(200).json({
            success: true,
            data: telemetry.map(mapToCamelCase)
        });
    } catch (error) {
        next(error);
    }
};

// GET /vehicles/:vehicleId/summary
exports.getVehicleSummary = async (req, res, next) => {
    try {
        const { vehicleId } = req.params;

        // Call the PostgreSQL function (RPC) we created
        const { data: summary, error } = await supabase
            .rpc('get_vehicle_summary', { p_vehicle_id: vehicleId })
            .single();

        if (error && error.code !== 'PGRST116') {
            return next(error);
        }

        // Check if the aggregation actually returned valid data (e.g. average speed is not null)
        if (!summary || summary.average_speed === null) {
            return res.status(404).json({
                success: false,
                error: 'No telemetry found to summarize for this vehicle'
            });
        }

        // Format output
        res.status(200).json({
            success: true,
            data: {
                id: summary.vehicle_id,
                averageSpeed: parseFloat(summary.average_speed),
                maxEngineTemperature: parseFloat(summary.max_engine_temperature),
                minFuelLevel: summary.min_fuel_level ? parseFloat(summary.min_fuel_level) : null,
                minBatteryLevel: summary.min_battery_level ? parseFloat(summary.min_battery_level) : null
            }
        });
    } catch (error) {
        next(error);
    }
};
