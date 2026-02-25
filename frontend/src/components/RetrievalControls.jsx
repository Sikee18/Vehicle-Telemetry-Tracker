import React, { useState } from 'react';
import { Clock, History, BarChart2, CalendarRange, Play } from 'lucide-react';

const RetrievalControls = ({
    selectedVehicle,
    onModeChange,
    onDataFetch,
    currentMode,
    isRefreshing
}) => {
    const [limit, setLimit] = useState(10);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [rangeError, setRangeError] = useState('');

    const handleModeClick = (mode) => {
        onModeChange(mode);
        setRangeError('');
        // For Latest and Summary, auto-fetch immediately upon click
        if (mode === 'latest' || mode === 'summary') {
            onDataFetch(mode);
        }
    };

    const handleFetchClick = () => {
        if (currentMode === 'recent') {
            onDataFetch('recent', { limit });
        } else if (currentMode === 'range') {
            if (!startDate || !endDate) {
                setRangeError('Both start and end dates are required. Use quick filters for ease.');
                return;
            }
            if (new Date(startDate) >= new Date(endDate)) {
                setRangeError('Start date must be before end date.');
                return;
            }
            setRangeError('');
            onDataFetch('range', { start: new Date(startDate).toISOString(), end: new Date(endDate).toISOString() });
        }
    };

    const setQuickRange = (hours) => {
        const end = new Date();
        const start = new Date(end.getTime() - (hours * 60 * 60 * 1000));

        // Format to YYYY-MM-DDThh:mm for datetime-local
        const formatForInput = (date) => {
            const offset = date.getTimezoneOffset() * 60000;
            const localISOTime = (new Date(date - offset)).toISOString().slice(0, 16);
            return localISOTime;
        };

        setStartDate(formatForInput(start));
        setEndDate(formatForInput(end));
        setRangeError('');
    };

    if (!selectedVehicle) {
        return null;
    }

    return (
        <div className="section-card">
            <div className="section-header">
                <h2>Data Retrieval Controls</h2>
            </div>

            <div className="retrieval-controls">
                <div className="mode-selector">
                    <button
                        className={`mode-btn ${currentMode === 'latest' ? 'active' : ''}`}
                        onClick={() => handleModeClick('latest')}
                    >
                        <Clock size={16} /> Latest
                    </button>
                    <button
                        className={`mode-btn ${currentMode === 'recent' ? 'active' : ''}`}
                        onClick={() => handleModeClick('recent')}
                    >
                        <History size={16} /> Recent
                    </button>
                    <button
                        className={`mode-btn ${currentMode === 'summary' ? 'active' : ''}`}
                        onClick={() => handleModeClick('summary')}
                    >
                        <BarChart2 size={16} /> Summary
                    </button>
                    <button
                        className={`mode-btn ${currentMode === 'range' ? 'active' : ''}`}
                        onClick={() => handleModeClick('range')}
                    >
                        <CalendarRange size={16} /> Custom Range
                    </button>
                </div>

                {/* Dynamic Context Panel */}
                <div className="mode-context-panel">

                    {currentMode === 'recent' && (
                        <div className="context-group">
                            <label>Number of records:</label>
                            <input
                                type="number"
                                min="1"
                                max="100"
                                value={limit}
                                onChange={(e) => setLimit(e.target.value)}
                                className="control-input"
                            />
                            <button
                                className="fetch-btn"
                                onClick={handleFetchClick}
                                disabled={isRefreshing}
                            >
                                <Play size={16} /> Fetch Recent
                            </button>
                        </div>
                    )}

                    {currentMode === 'range' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div className="context-group range-group">
                                <div className="date-inputs">
                                    <input
                                        type="datetime-local"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="control-input"
                                        title="Start Date"
                                    />
                                    <span className="text-muted">to</span>
                                    <input
                                        type="datetime-local"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="control-input"
                                        title="End Date"
                                    />
                                </div>
                                <button
                                    className="fetch-btn"
                                    onClick={handleFetchClick}
                                    disabled={isRefreshing}
                                >
                                    <Play size={16} /> Fetch Range
                                </button>
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <span className="text-muted" style={{ display: 'flex', alignItems: 'center', marginRight: '0.5rem' }}>Quick format:</span>
                                <button className="mode-btn" style={{ minWidth: 'auto', padding: '0.25rem 0.75rem' }} onClick={() => setQuickRange(1)}>1 Hour</button>
                                <button className="mode-btn" style={{ minWidth: 'auto', padding: '0.25rem 0.75rem' }} onClick={() => setQuickRange(24)}>24 Hours</button>
                                <button className="mode-btn" style={{ minWidth: 'auto', padding: '0.25rem 0.75rem' }} onClick={() => setQuickRange(24 * 7)}>7 Days</button>
                            </div>
                        </div>
                    )}

                    {rangeError && <div className="error-text text-sm mt-2">{rangeError}</div>}

                    {(currentMode === 'latest' || currentMode === 'summary') && (
                        <div className="context-message">
                            <span>Retrieving {currentMode} telemetry payload automatically.</span>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default RetrievalControls;
