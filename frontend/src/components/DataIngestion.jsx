import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileText, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import api from '../services/api';
import './DataIngestion.css';

const DataIngestion = () => {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' or 'paste'
  const [jsonInput, setJsonInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleUpload = async (file) => {
    setLoading(true);
    setResult(null);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/ingestion/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult({ type: 'success', message: `Success! Ingested ${response.data.records_processed} records.` });
    } catch (err) {
      setResult({ type: 'error', message: err.response?.data?.error || 'Failed to upload file.' });
    } finally {
      setLoading(false);
    }
  };

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      handleUpload(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/json': ['.json'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    multiple: false
  });

  const handlePasteSubmit = async () => {
    if (!jsonInput.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      let parsedPayload;
      try {
        parsedPayload = JSON.parse(jsonInput);
      } catch (e) {
        throw new Error("Invalid JSON format.");
      }

      const response = await api.post('/ingestion/json', parsedPayload);
      setResult({ type: 'success', message: `Success! Ingested ${response.data.records_processed} records.` });
      setJsonInput('');
    } catch (err) {
      setResult({ type: 'error', message: err.message || err.response?.data?.error || 'Failed to post JSON.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="section-card data-ingestion-card">
      <div className="section-header" style={{ marginBottom: '1rem' }}>
        <h2>Universal Data Ingestion</h2>
        <div className="header-tabs">
          <button
            className={`tab-btn ${activeTab === 'upload' ? 'active' : ''}`}
            onClick={() => setActiveTab('upload')}
          >
            File Upload
          </button>
          <button
            className={`tab-btn ${activeTab === 'paste' ? 'active' : ''}`}
            onClick={() => setActiveTab('paste')}
          >
            Paste JSON
          </button>
        </div>
      </div>

      <div className="ingestion-body">
        {activeTab === 'upload' ? (
          <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''} ${loading ? 'disabled' : ''}`}>
            <input {...getInputProps()} disabled={loading} />
            {loading ? (
              <div className="state-content">
                <Loader className="spinner icon-large text-accent-blue" />
                <p>Processing payload in chunks...</p>
              </div>
            ) : isDragActive ? (
              <div className="state-content">
                <UploadCloud className="icon-large text-accent-blue bounce" />
                <p>Drop the file here...</p>
              </div>
            ) : (
              <div className="state-content">
                <FileText className="icon-large text-muted" />
                <p>Drag & drop a CSV, JSON, or XLSX file here, or click to select</p>
                <em className="text-muted text-sm">(Support for massive files via Node.js Streams)</em>
              </div>
            )}
          </div>
        ) : (
          <div className="json-paste-area">
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder='[ { "sensor_id": "ABC", "value": 123 }, ... ]'
              disabled={loading}
              className="json-textarea"
            />
            <button
              onClick={handlePasteSubmit}
              disabled={loading || !jsonInput.trim()}
              className="primary-btn submit-btn"
            >
              {loading ? <Loader className="spinner icon-small" /> : 'Ingest JSON Data'}
            </button>
          </div>
        )}

        {result && (
          <div className={`result-banner ${result.type}`}>
            {result.type === 'success' ? <CheckCircle className="icon-small" /> : <AlertCircle className="icon-small" />}
            <span>{result.message}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataIngestion;
