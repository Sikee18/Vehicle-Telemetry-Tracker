import React from 'react';

const VehicleSelector = ({ vehicles, selectedVehicleId, onSelectVehicle }) => {
    const selectedVehicle = vehicles.find(v => v.vehicleId === selectedVehicleId);

    return (
        <div className="section-card">
            <div className="section-header">
                <h2>Select Vehicle</h2>
            </div>
            <div className="control-panel">
                <select
                    className="vehicle-selector"
                    value={selectedVehicleId || ''}
                    onChange={(e) => onSelectVehicle(e.target.value)}
                >
                    <option value="" disabled>-- Select a Vehicle --</option>
                    {vehicles.map((v) => (
                        <option key={v.vehicleId} value={v.vehicleId}>
                            {v.vehicleId}
                        </option>
                    ))}
                </select>

                {selectedVehicle && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span className={`vehicle-badge ${selectedVehicle.vehicleType.toLowerCase()}`}>
                            {selectedVehicle.vehicleType}
                        </span>
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                            Showing telemetry for selected vehicle
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VehicleSelector;
