import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import VehicleSelector from './components/VehicleSelector';
import KpiCard from './components/KpiCard';
import ChartsPanel from './components/ChartsPanel';
import TelemetryTable from './components/TelemetryTable';
import {
  fetchVehicles,
  fetchRecentTelemetry,
  fetchLatestTelemetry,
  fetchVehicleSummary,
  fetchTelemetryRange
} from './services/api';
import './App.css';
import RetrievalControls from './components/RetrievalControls';
import DataSimulator from './components/DataSimulator';

function App() {
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [telemetryData, setTelemetryData] = useState([]);
  const [summaryData, setSummaryData] = useState(null);

  const [isConnected, setIsConnected] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);

  // New retrieval state
  const [retrievalMode, setRetrievalMode] = useState('recent'); // 'latest', 'recent', 'summary', 'range'
  const [activeFetchParams, setActiveFetchParams] = useState({ limit: 10 });

  // Initial load: Fetch vehicles
  useEffect(() => {
    const initVehicles = async () => {
      try {
        const res = await fetchVehicles();
        if (res.success && res.data.length > 0) {
          setVehicles(res.data);
          setIsConnected(true);
          // Auto-select first vehicle
          setSelectedVehicle(res.data[0].vehicleId);
        }
      } catch (err) {
        setIsConnected(false);
        setError("Failed to connect to backend. Is the server running?");
        console.error("Fetch vehicles error:", err);
      }
    };
    initVehicles();
  }, []);

  // Fetch telemetry for selected vehicle based on mode
  const loadVehicleData = useCallback(async (vehicleId, mode = retrievalMode, params = activeFetchParams) => {
    if (!vehicleId) return;

    setIsRefreshing(true);
    setError(null);
    try {

      if (mode === 'latest') {
        const res = await fetchLatestTelemetry(vehicleId);
        if (res.success) {
          // Latest returns a single object, wrap in array for charts/tables to consume
          setTelemetryData(res.data ? [res.data] : []);
        }
      }
      else if (mode === 'recent') {
        const res = await fetchRecentTelemetry(vehicleId, params.limit || 10);
        if (res.success) {
          setTelemetryData(res.data);
        }
      }
      else if (mode === 'range') {
        const res = await fetchTelemetryRange(vehicleId, params.start, params.end);
        if (res.success) {
          setTelemetryData(res.data);
        }
      }
      else if (mode === 'summary') {
        // Deliberately empty telemetry to hide charts/tables in summary mode
        setTelemetryData([]);
      }

      // Always update summary for KPI cards (unless we're explicitly in a historical range view where live summary might seem confusing, but keeping it for now)
      if (mode !== 'range') {
        const summaryRes = await fetchVehicleSummary(vehicleId);
        if (summaryRes.success) {
          setSummaryData(summaryRes.data);
        }
      } else {
        // Wipe summary on historical range to prevent mismatch
        setSummaryData(null);
      }

      setLastUpdated(new Date());
      setIsConnected(true);
    } catch (err) {
      console.error("Data fetch error:", err);
      setIsConnected(false);
      setError(err.response?.data?.error || "Failed to fetch telemetry data.");
    } finally {
      setIsRefreshing(false);
    }
  }, [retrievalMode, activeFetchParams]);

  // Handle manual explicit fetch via control panel
  const handleDataFetch = (mode, params = {}) => {
    setRetrievalMode(mode);
    setActiveFetchParams(params);

    // Auto-disable auto-refresh when diving into historical data
    if (mode === 'range' || mode === 'summary') {
      setAutoRefresh(false);
    }

    loadVehicleData(selectedVehicle, mode, params);
  }

  // Handle vehicle change
  useEffect(() => {
    if (selectedVehicle) {
      setTelemetryData([]);
      setSummaryData(null);
      loadVehicleData(selectedVehicle);
    }
  }, [selectedVehicle]); // Removed loadVehicleData from deps to isolate triggered fetches

  // Handle auto-refresh interval
  useEffect(() => {
    let interval;
    // Only auto-refresh if enabled AND we are explicitly in 'recent' or 'latest' live tracking modes
    if (autoRefresh && selectedVehicle && (retrievalMode === 'recent' || retrievalMode === 'latest')) {
      interval = setInterval(() => {
        loadVehicleData(selectedVehicle);
      }, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, selectedVehicle, retrievalMode, loadVehicleData]);

  // Get current vehicle details
  const activeVehicleData = vehicles.find(v => v.vehicleId === selectedVehicle);
  const vType = activeVehicleData?.vehicleType;

  return (
    <div className="app-container">
      <Header
        isConnected={isConnected}
        lastUpdated={lastUpdated}
        totalVehicles={vehicles.length}
        totalRecords={telemetryData.length}
        autoRefresh={autoRefresh}
        setAutoRefresh={setAutoRefresh}
        onManualRefresh={() => loadVehicleData(selectedVehicle)}
        isRefreshing={isRefreshing}
      />

      {error && (
        <div style={{ padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--accent-red)', borderRadius: '0.5rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          {error}
        </div>
      )}

      <div className="dashboard-main">
        {/* Left Column (Charts & Table) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          <div className="stats-grid">
            <KpiCard
              type="vehicles"
              title="Total Vehicles Tracking"
              value={vehicles.length}
            />
            <KpiCard
              type="count"
              title="Recent Records"
              value={telemetryData.length}
            />
            <KpiCard
              type="speed"
              title="Average Speed"
              value={summaryData?.averageSpeed?.toFixed(1)}
              suffix=" km/h"
            />
            <KpiCard
              type="temp"
              title="Max Engine Temp"
              value={summaryData?.maxEngineTemperature?.toFixed(1)}
              suffix=" °C"
            />
            {vType === 'FUEL' && (
              <KpiCard
                type="fuel"
                title="Min Fuel Level"
                value={summaryData?.minFuelLevel?.toFixed(1)}
                suffix=" %"
              />
            )}
            {vType === 'EV' && (
              <KpiCard
                type="battery"
                title="Min Battery Level"
                value={summaryData?.minBatteryLevel?.toFixed(1)}
                suffix=" %"
              />
            )}
          </div>

          {retrievalMode !== 'summary' ? (
            <ChartsPanel
              data={telemetryData}
              vehicleType={vType}
            />
          ) : (
            <div className="section-card">
              <div className="section-header">
                <h2>Lifetime Vehicle Summary</h2>
              </div>
              {summaryData ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div style={{ padding: '1rem', backgroundColor: 'var(--bg-dark)', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Lifetime Avg Speed</p>
                    <h3 style={{ fontSize: '1.5rem', margin: '0.5rem 0', color: 'var(--accent-blue)' }}>{summaryData.averageSpeed?.toFixed(1)} km/h</h3>
                  </div>
                  <div style={{ padding: '1rem', backgroundColor: 'var(--bg-dark)', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Peak Engine Temp</p>
                    <h3 style={{ fontSize: '1.5rem', margin: '0.5rem 0', color: 'var(--accent-orange)' }}>{summaryData.maxEngineTemperature?.toFixed(1)} °C</h3>
                  </div>
                  <div style={{ padding: '1rem', backgroundColor: 'var(--bg-dark)', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Lowest {vType === 'FUEL' ? 'Fuel' : 'Battery'} Recorded</p>
                    <h3 style={{ fontSize: '1.5rem', margin: '0.5rem 0', color: 'var(--accent-red)' }}>
                      {vType === 'FUEL' ? summaryData.minFuelLevel?.toFixed(1) : summaryData.minBatteryLevel?.toFixed(1)} %
                    </h3>
                  </div>
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)' }}>Loading summary data...</p>
              )}

              <div style={{ marginTop: '1.5rem', padding: '1.25rem', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: '0.5rem', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                <h4 style={{ color: 'var(--text-main)', fontSize: '1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  ⚡ Backend Architecture Note
                </h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0, lineHeight: 1.5 }}>
                  This summary is <strong>not</strong> calculated by downloading all records to the frontend. It is generated by calling the <code>GET /vehicles/:id/summary</code> API endpoint, which triggers a PostgreSQL Remote Procedure Call (RPC) to calculate these metrics natively across all historical rows at the database engine level. This guarantees <span style={{ color: 'var(--accent-green)' }}>O(1) network transfer time</span> regardless of database size.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column (Controls & Table) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <VehicleSelector
            vehicles={vehicles}
            selectedVehicleId={selectedVehicle}
            onSelectVehicle={setSelectedVehicle}
          />

          <RetrievalControls
            selectedVehicle={selectedVehicle}
            currentMode={retrievalMode}
            onModeChange={setRetrievalMode}
            onDataFetch={handleDataFetch}
            isRefreshing={isRefreshing}
          />

          <DataSimulator onDataSent={() => loadVehicleData(selectedVehicle)} />

          {retrievalMode !== 'summary' && (
            <TelemetryTable
              data={telemetryData}
              vehicleType={vType}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
