import React from 'react';

const formatTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
};

const TelemetryTable = ({ data, vehicleType }) => {
    if (!data || data.length === 0) {
        return null;
    }

    // Show only last 10 records for the table
    const recentRecords = data.slice(0, 10);

    return (
        <div className="section-card" style={{ flex: 1 }}>
            <div className="section-header">
                <h2>Recent Telemetry (Last 10)</h2>
            </div>

            <div className="table-container">
                <table className="telemetry-table">
                    <thead>
                        <tr>
                            <th>Timestamp</th>
                            <th>Speed (km/h)</th>
                            <th>Engine Temp (°C)</th>
                            {vehicleType === 'FUEL' ? (
                                <>
                                    <th>Fuel Level (%)</th>
                                    <th>Consumption (L/100km)</th>
                                </>
                            ) : (
                                <>
                                    <th>Battery Level (%)</th>
                                    <th>Consumption (kWh/100km)</th>
                                </>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {recentRecords.map((record) => (
                            <tr key={record.id}>
                                <td style={{ color: 'var(--text-muted)' }}>{formatTime(record.timestamp)}</td>
                                <td>{record.speed}</td>
                                <td>{record.engineTemperature}</td>
                                {vehicleType === 'FUEL' ? (
                                    <>
                                        <td>{record.fuelLevel}</td>
                                        <td>{record.fuelConsumptionRate}</td>
                                    </>
                                ) : (
                                    <>
                                        <td>{record.batteryLevel}</td>
                                        <td>{record.energyConsumptionRate}</td>
                                    </>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TelemetryTable;
