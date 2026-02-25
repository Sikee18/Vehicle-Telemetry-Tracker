import React from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const formatTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="custom-tooltip">
                <p className="font-semibold">{formatTime(label)}</p>
                {payload.map((entry, index) => (
                    <p key={index} style={{ color: entry.color }}>
                        {entry.name}: {entry.value}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

const ChartsPanel = ({ data, vehicleType }) => {
    // If data is genuinely empty, show empty state.
    // However, if length is 1 (like in "Latest" mode), Recharts will still draw a single point safely.
    if (!data || data.length === 0) {
        return (
            <div className="section-card">
                <div className="empty-state">
                    <p>No telemetry data available for charts.</p>
                </div>
            </div>
        );
    }

    // Reverse data so charts read left to right chronologically
    const chartData = [...data].reverse();

    return (
        <div className="charts-grid">

            {/* Speed Chart */}
            <div className="section-card">
                <div className="chart-wrapper">
                    <h3>Speed (km/h) vs Time</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                            <XAxis dataKey="timestamp" tickFormatter={formatTime} stroke="#9ca3af" fontSize={12} tickMargin={10} />
                            <YAxis stroke="#9ca3af" fontSize={12} width={40} />
                            <Tooltip content={<CustomTooltip />} />
                            <Line type="monotone" dataKey="speed" name="Speed" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Engine Temperature Chart */}
            <div className="section-card">
                <div className="chart-wrapper">
                    <h3>Engine Temperature (°C) vs Time</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                            <XAxis dataKey="timestamp" tickFormatter={formatTime} stroke="#9ca3af" fontSize={12} tickMargin={10} />
                            <YAxis stroke="#9ca3af" fontSize={12} width={40} />
                            <Tooltip content={<CustomTooltip />} />
                            <Line type="monotone" dataKey="engineTemperature" name="Temp" stroke="#f59e0b" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Energy Chart (Conditional) */}
            {vehicleType && (
                <div className="section-card">
                    <div className="chart-wrapper">
                        <h3>{vehicleType === 'FUEL' ? 'Fuel Level (%)' : 'Battery Level (%)'} vs Time</h3>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                                <XAxis dataKey="timestamp" tickFormatter={formatTime} stroke="#9ca3af" fontSize={12} tickMargin={10} />
                                <YAxis stroke="#9ca3af" fontSize={12} width={40} domain={[0, 100]} />
                                <Tooltip content={<CustomTooltip />} />
                                <Line
                                    type="monotone"
                                    dataKey={vehicleType === 'FUEL' ? 'fuelLevel' : 'batteryLevel'}
                                    name={vehicleType === 'FUEL' ? 'Fuel' : 'Battery'}
                                    stroke={vehicleType === 'FUEL' ? '#f59e0b' : '#10b981'}
                                    strokeWidth={2}
                                    dot={false}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChartsPanel;
