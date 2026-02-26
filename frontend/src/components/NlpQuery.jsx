import React, { useState } from 'react';
import { Send, Download, Database, AlertCircle, Loader, Code } from 'lucide-react';
import axios from 'axios';
import './NlpQuery.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const NlpQuery = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleQuerySubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await axios.post(`${API_BASE_URL}/nlp/query`, { query });
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'An error occurred while executing the query.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    if (!result || !result.data || result.data.length === 0) return;
    
    setExportLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/nlp/export/csv`, { data: result.data }, { responseType: 'blob' });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'nlp_export.csv');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      alert("Failed to export as CSV.");
    } finally {
      setExportLoading(false);
    }
  };

  const handleExportJSON = () => {
    if (!result || !result.data) return;
    const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'nlp_export.json');
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
  };

  // Helper to extract dynamic headers from JSONB data structure
  const getDynamicHeaders = (dataArray) => {
    if (!dataArray || dataArray.length === 0) return [];
    
    // We look at the first few rows to build a unified set of keys
    const headers = new Set();
    dataArray.slice(0, 10).forEach(row => {
      if (row.id) headers.add('id');
      if (row.created_at) headers.add('created_at');
      
      if (row.data && typeof row.data === 'object') {
        Object.keys(row.data).forEach(key => headers.add(`data.${key}`));
      }
    });
    
    return Array.from(headers);
  };

  const renderCellData = (row, header) => {
    if (header.startsWith('data.')) {
      const key = header.replace('data.', '');
      const val = row.data ? row.data[key] : undefined;
      return val !== undefined && val !== null ? String(val) : '-';
    }
    return row[header] !== undefined && row[header] !== null ? String(row[header]) : '-';
  };

  return (
    <div className="section-card nlp-card">
      <div className="section-header">
        <h2>AI Query Assistant</h2>
      </div>

      <div className="nlp-body">
        <form className="nlp-input-group" onSubmit={handleQuerySubmit}>
          <input
            type="text"
            className="nlp-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask questions about your data (e.g., 'Show me all vehicle records from Mumbai')"
            disabled={loading}
          />
          <button type="submit" className="primary-btn nlp-submit-btn" disabled={loading || !query.trim()}>
            {loading ? <Loader className="spinner icon-small" /> : <Send className="icon-small" />}
            {loading ? 'Running...' : 'Generate & Execute'}
          </button>
        </form>

        {error && (
          <div className="result-banner error">
            <AlertCircle className="icon-small" />
            <span>{error}</span>
          </div>
        )}

        {result && (
          <div className="nlp-results">
            <div className="sql-preview">
              <div className="sql-header">
                <Code className="icon-small" />
                <span>Generated Read-Only SQL</span>
              </div>
              <pre><code>{result.sql}</code></pre>
            </div>

            <div className="data-table-container">
              <div className="data-table-header">
                <div className="results-info">
                  <Database className="icon-small" />
                  <span>{result.rowCount} Rows Found</span>
                </div>
                
                <div className="export-controls">
                  <button className="secondary-btn" onClick={handleExportCSV} disabled={exportLoading}>
                    {exportLoading ? <Loader className="spinner" /> : <Download className="icon-small" />}
                    CSV
                  </button>
                  <button className="secondary-btn" onClick={handleExportJSON}>
                    <Download className="icon-small" />
                    JSON
                  </button>
                </div>
              </div>

              {result.data && result.data.length > 0 ? (
                <div className="table-wrapper">
                  <table className="dynamic-table">
                    <thead>
                      <tr>
                        {getDynamicHeaders(result.data).map(header => (
                          <th key={header}>{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.data.map((row, idx) => (
                        <tr key={row.id || idx}>
                          {getDynamicHeaders(result.data).map(header => (
                            <td key={header}>{renderCellData(row, header)}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state">
                  No records returned by the AI generated query.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NlpQuery;
