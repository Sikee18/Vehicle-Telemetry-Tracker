require('dotenv').config();
const { faker } = require('@faker-js/faker');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing SUPABASE_URL or SUPABASE_KEY in environment variables.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const generateTelemetry = async () => {
    try {
        console.log('Connecting to Supabase...');

        // Clear existing data (Note: If RLS is enabled, you might need raw SQL or Service Role key to do this)
        const { error: deleteError } = await supabase.from('telemetry').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (deleteError) {
            console.warn('Warning: Could not clear existing data. (RLS might prevent deletion via Anon Key). Proceeding to seed anyway...', deleteError.message);
        } else {
            console.log('Cleared existing telemetry data.');
        }

        const telemetryData = [];
        const vehicles = [];

        // Generate 10 vehicles (5 FUEL, 5 EV)
        for (let i = 0; i < 5; i++) {
            vehicles.push({ id: `V-FUEL-${faker.string.alphanumeric(4).toUpperCase()}`, type: 'FUEL' });
            vehicles.push({ id: `V-EV-${faker.string.alphanumeric(4).toUpperCase()}`, type: 'EV' });
        }

        // Generate 50 telemetry records per vehicle over the last 24 hours
        vehicles.forEach(vehicle => {
            let currentFuel = 100;
            let currentBattery = 100;

            for (let i = 0; i < 50; i++) {
                // Generate timestamp going backwards
                const timestamp = new Date(Date.now() - i * 30 * 60 * 1000).toISOString(); // Every 30 mins backwards

                const baseRecord = {
                    vehicle_id: vehicle.id,
                    vehicle_type: vehicle.type,
                    timestamp,
                    speed: faker.number.int({ min: 0, max: 120 }),
                    engine_temperature: faker.number.int({ min: 60, max: 110 })
                };

                if (vehicle.type === 'FUEL') {
                    currentFuel = Math.max(0, currentFuel - faker.number.float({ min: 0.5, max: 2 }));
                    telemetryData.push({
                        ...baseRecord,
                        fuel_level: parseFloat(currentFuel.toFixed(2)),
                        fuel_consumption_rate: faker.number.float({ min: 5, max: 15, multipleOf: 0.1 })
                    });
                } else {
                    currentBattery = Math.max(0, currentBattery - faker.number.float({ min: 1, max: 3 }));
                    telemetryData.push({
                        ...baseRecord,
                        battery_level: parseFloat(currentBattery.toFixed(2)),
                        energy_consumption_rate: faker.number.float({ min: 10, max: 25, multipleOf: 0.1 })
                    });
                }
            }
        });

        console.log(`Inserting ${telemetryData.length} records...`);

        // Supabase JS insert can handle arrays
        const { data, error } = await supabase.from('telemetry').insert(telemetryData);

        if (error) {
            throw error;
        }

        console.log('Database seeded successfully!');
    } catch (error) {
        console.error('Error seeding database:', error.message || error);
    }
};

generateTelemetry();
