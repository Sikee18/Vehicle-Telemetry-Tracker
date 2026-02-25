-- Vehicle Telemetry Setup Script
-- Run this in the Supabase SQL Editor

-- 1. Create the Telemetry table
CREATE TABLE IF NOT EXISTS telemetry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id TEXT NOT NULL,
    vehicle_type TEXT NOT NULL CHECK (vehicle_type IN ('FUEL', 'EV')),
    timestamp TIMESTAMPTZ NOT NULL,
    speed NUMERIC NOT NULL CHECK (speed >= 0 AND speed <= 200),
    engine_temperature NUMERIC NOT NULL CHECK (engine_temperature >= 0 AND engine_temperature <= 150),
    
    -- Conditional fields
    fuel_level NUMERIC CHECK (
        (vehicle_type = 'FUEL' AND fuel_level IS NOT NULL AND fuel_level >= 0 AND fuel_level <= 100) OR
        (vehicle_type = 'EV' AND fuel_level IS NULL)
    ),
    fuel_consumption_rate NUMERIC CHECK (
        (vehicle_type = 'FUEL' AND fuel_consumption_rate IS NOT NULL AND fuel_consumption_rate > 0) OR
        (vehicle_type = 'EV' AND fuel_consumption_rate IS NULL)
    ),
    battery_level NUMERIC CHECK (
        (vehicle_type = 'EV' AND battery_level IS NOT NULL AND battery_level >= 0 AND battery_level <= 100) OR
        (vehicle_type = 'FUEL' AND battery_level IS NULL)
    ),
    energy_consumption_rate NUMERIC CHECK (
        (vehicle_type = 'EV' AND energy_consumption_rate IS NOT NULL AND energy_consumption_rate > 0) OR
        (vehicle_type = 'FUEL' AND energy_consumption_rate IS NULL)
    ),
    
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create index for fast retrieval of latest telemetry per vehicle
CREATE INDEX IF NOT EXISTS idx_telemetry_vehicle_timestamp 
ON telemetry (vehicle_id, timestamp DESC);

-- 3. Disable Row Level Security (RLS) entirely so our Anon Key can read/write data
-- Note: In a real production environment with user authentication, you would enable RLS
-- and write policies determining exactly who can insert/select data.
ALTER TABLE telemetry DISABLE ROW LEVEL SECURITY;

-- Ensure anyone can access the table since RLS is disabled
GRANT ALL ON TABLE telemetry TO anon;
GRANT ALL ON TABLE telemetry TO authenticated;

-- 4. Create an RPC function for the Vehicle Summary aggregation
-- This replaces the MongoDB aggregate pipeline we used earlier
CREATE OR REPLACE FUNCTION get_vehicle_summary(p_vehicle_id TEXT)
RETURNS TABLE (
    vehicle_id TEXT,
    average_speed NUMERIC,
    max_engine_temperature NUMERIC,
    min_fuel_level NUMERIC,
    min_battery_level NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p_vehicle_id AS vehicle_id,
        AVG(speed) AS average_speed,
        MAX(engine_temperature) AS max_engine_temperature,
        MIN(fuel_level) AS min_fuel_level,
        MIN(battery_level) AS min_battery_level
    FROM 
        telemetry
    WHERE 
        telemetry.vehicle_id = p_vehicle_id;
END;
$$ LANGUAGE plpgsql;
