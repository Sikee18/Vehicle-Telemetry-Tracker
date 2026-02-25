import React from 'react';
import { ActivitySquare, RefreshCw, Server } from 'lucide-react';

const Header = ({ isConnected, lastUpdated, totalVehicles, totalRecords, autoRefresh, setAutoRefresh, onManualRefresh, isRefreshing }) => {
    return (
        <header className="header">
            <div className="header-title">
                <h1><ActivitySquare className="text-blue-500" /> Vehicle Telemetry Monitoring</h1>
            </div>

            <div className="header-status">
                <div className={`status-badge ${isConnected ? '' : 'error'}`}>
                    <div className={`status-dot ${isConnected ? 'pulsing' : ''}`} />
                    {isConnected ? 'Backend Connected' : 'Disconnected'}
                </div>

                <div className="text-sm text-gray-400">
                    Vehicles: <strong className="text-white">{totalVehicles || 0}</strong>
                </div>

                <div className="text-sm text-gray-400">
                    Records: <strong className="text-white">{totalRecords || 0}</strong>
                </div>

                <div className="text-sm text-gray-400">
                    Updated: <strong className="text-white">{lastUpdated ? lastUpdated.toLocaleTimeString() : '--:--:--'}</strong>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--bg-dark)', padding: '0.25rem 0.5rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)' }}>
                    <label className="auto-refresh-toggle cursor-pointer" style={{ margin: 0 }}>
                        <input
                            type="checkbox"
                            checked={autoRefresh}
                            onChange={(e) => setAutoRefresh(e.target.checked)}
                            className="mr-2"
                        />
                        Auto-refresh
                    </label>

                    <button
                        onClick={onManualRefresh}
                        className={`refresh-btn ${isRefreshing ? 'spinning' : ''}`}
                        title="Manual Refresh"
                        style={{ padding: '0.25rem' }}
                    >
                        <RefreshCw size={16} />
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;
