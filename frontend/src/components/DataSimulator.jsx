import React, { useState } from 'react';
import api from '../services/api';

const DataSimulator = ({ onDataSent }) => {
    const [useApiKey, setUseApiKey] = useState(false);
    const [responseLog, setResponseLog] = useState(null);
    const [isSending, setIsSending] = useState(false);

    const handleSimulateTarget = async () => {
        setIsSending(true);
        setResponseLog(null);

        const fakeData = {
            vehicleId: "V-DEMO-" + Math.floor(Math.random() * 1000),
            vehicleType: "EV",
            timestamp: new Date().toISOString(),
            speed: Math.floor(Math.random() * 100),
            engineTemperature: 70 + Math.floor(Math.random() * 20),
            batteryLevel: Math.floor(Math.random() * 100),
            energyConsumptionRate: 15 + Math.random() * 5
        };

        try {
            const headers = {
                'Content-Type': 'application/json'
            };

            if (useApiKey) {
                // For the hackathon demo, we hardcode the key here to prove the concept visually.
                // In production, the frontend wouldn't typically hold the ingestion key.
                headers['x-api-key'] = "hackathon_secret_key_123";
            }

            const response = await api.post('/telemetry', fakeData, { headers });

            setResponseLog({
                status: response.status,
                type: 'success',
                message: "Data Ingested Successfully! 🚀",
                data: response.data
            });

            // Tell parent to refresh the grid
            if (onDataSent) onDataSent();

        } catch (error) {
            setResponseLog({
                status: error.response?.status || 'Error',
                type: 'error',
                message: "Backend Rejected Request 🛑",
                data: error.response?.data || { error: error.message }
            });
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="section-card" style={{ marginTop: '1.5rem', border: '1px solid var(--accent-blue)' }}>
            <div className="section-header" style={{ borderBottom: '1px solid rgba(59, 130, 246, 0.2)', paddingBottom: '0.75rem' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-blue)' }}>
                    🛡️ Security Demo & Data Simulator
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
                    Test the backend API Key validation middleware directly from the dashboard.
                </p>
            </div>

            <div style={{ padding: '1.25rem' }}>
                <div style={{ padding: '1rem', backgroundColor: 'var(--bg-dark)', borderRadius: '0.5rem', marginBottom: '1rem', border: '1px solid var(--border-color)' }}>
                    <p style={{ margin: '0 0 1rem 0', color: 'var(--text-main)', fontSize: '0.95rem', lineHeight: '1.5' }}>
                        To prevent unauthorized access or fake data injections, the API requires a secret key.
                        <br />
                        Toggle the switch below to see how the backend responds:
                    </p>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', color: 'var(--text-main)', fontWeight: 'bold' }}>
                        <input
                            type="checkbox"
                            checked={useApiKey}
                            onChange={(e) => setUseApiKey(e.target.checked)}
                            style={{ width: '1.5rem', height: '1.5rem', accentColor: 'var(--accent-green)', cursor: 'pointer' }}
                        />
                        {useApiKey ? "🔓 Secret API Key Attached" : "🔒 No API Key Attached (Simulating Attack)"}
                    </label>
                </div>

                <button
                    onClick={handleSimulateTarget}
                    disabled={isSending}
                    style={{
                        padding: '0.75rem 1.5rem',
                        backgroundColor: useApiKey ? 'var(--accent-green)' : 'var(--accent-red)',
                        color: '#000',
                        border: 'none',
                        borderRadius: '0.5rem',
                        fontWeight: 'bold',
                        cursor: isSending ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s',
                        width: '100%',
                        fontSize: '1rem'
                    }}
                >
                    {isSending ? 'Sending Data...' : useApiKey ? 'Send Telemetry Data ✅' : 'Send Telemetry Data ❌'}
                </button>

                {responseLog && (
                    <div style={{
                        marginTop: '1.5rem',
                        padding: '1rem',
                        backgroundColor: responseLog.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                        border: `1px solid ${responseLog.type === 'error' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                        borderRadius: '0.5rem'
                    }}>
                        <h4 style={{ margin: '0 0 0.5rem 0', color: responseLog.type === 'error' ? 'var(--accent-red)' : 'var(--accent-green)' }}>
                            Status Code: {responseLog.status} - {responseLog.message}
                        </h4>
                        <pre style={{
                            margin: 0,
                            padding: '0.75rem',
                            backgroundColor: 'var(--bg-dark)',
                            borderRadius: '0.25rem',
                            fontSize: '0.8rem',
                            color: 'var(--text-muted)',
                            overflowX: 'auto'
                        }}>
                            {JSON.stringify(responseLog.data, null, 2)}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DataSimulator;
