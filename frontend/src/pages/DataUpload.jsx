import React, { useState, useEffect } from 'react';
import { 
  UploadCloud, 
  FileText, 
  Download, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  Database,
  Layers,
  ArrowRight
} from 'lucide-react';
import { api } from '../api';

export default function DataUpload({ setActiveTab }) {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchDatasets = async () => {
    try {
      setLoading(true);
      const list = await api.getUploadedDatasets();
      setDatasets(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, []);

  const handleFileDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleUploadFile(e.target.files[0]);
    }
  };

  const handleUploadFile = async (file) => {
    if (!file.name.endsWith('.csv')) {
      setErrorMessage('Only standard CSV formatted datasets are supported.');
      return;
    }

    try {
      setUploading(true);
      setErrorMessage('');
      setUploadResult(null);
      const res = await api.uploadCsv(file);
      setUploadResult(res);
      fetchDatasets();
    } catch (err) {
      setErrorMessage(err.message || 'Dataset ingestion failed');
    } finally {
      setUploading(false);
    }
  };

  const downloadSampleCSV = () => {
    window.open('/api/sample-csv', '_blank');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Top Upload Zone & Schema Guide */}
      <div className="grid-cols-2">
        {/* Drag & Drop Upload Zone */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#f1f5f9', marginBottom: '4px' }}>
              Upload EV Battery CSV Dataset
            </h3>
            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '18px' }}>
              Ingest multi-pack BMS logs. Readings will be parsed, mapped to SQLite, and automatically evaluated by the AI inference engine.
            </p>

            <div
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleFileDrop}
              style={{
                border: dragActive ? '2px dashed #00f2fe' : '2px dashed var(--border-subtle)',
                background: dragActive ? 'rgba(0, 242, 254, 0.08)' : 'rgba(9, 17, 38, 0.5)',
                borderRadius: '12px',
                padding: '36px 20px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onClick={() => document.getElementById('csvFileInput').click()}
            >
              <input
                id="csvFileInput"
                type="file"
                accept=".csv"
                style={{ display: 'none' }}
                onChange={handleFileSelect}
              />

              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'rgba(0, 242, 254, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px auto'
              }}>
                <UploadCloud size={24} color="#00f2fe" />
              </div>

              <div style={{ fontSize: '14px', fontWeight: 600, color: '#f1f5f9' }}>
                {uploading ? 'Processing & Ingesting Dataset...' : 'Click to browse or drag & drop CSV file'}
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '4px' }}>
                Supports standard comma-separated EV telemetry files up to 50MB
              </p>
            </div>
          </div>

          {/* Feedback messages */}
          <div style={{ marginTop: '16px' }}>
            {errorMessage && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 14px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                color: '#f87171',
                fontSize: '13px'
              }}>
                <AlertCircle size={16} />
                <span>{errorMessage}</span>
              </div>
            )}

            {uploadResult && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '8px',
                color: '#34d399',
                fontSize: '13px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle size={16} />
                  <span>
                    Successfully ingested <strong>{uploadResult.rows_processed}</strong> sensor rows across <strong>{uploadResult.batteries_affected}</strong> battery pack(s)!
                  </span>
                </div>
                <button 
                  onClick={() => setActiveTab('monitoring')} 
                  style={{ background: 'transparent', border: 'none', color: '#00f2fe', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  View Monitoring <ArrowRight size={14} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Schema Guide & Sample Download */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#f1f5f9' }}>
                CSV Schema & Column Mapping
              </h3>
              <button 
                onClick={downloadSampleCSV}
                className="btn-secondary"
                style={{ fontSize: '12.5px', padding: '7px 12px', color: '#00f2fe', borderColor: 'rgba(0, 242, 254, 0.3)' }}
              >
                <Download size={14} /> Download Sample CSV
              </button>
            </div>

            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '14px' }}>
              Ensure your CSV file contains these telemetry headers (case-insensitive):
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div style={{ background: 'rgba(9, 17, 38, 0.6)', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                <div className="font-mono" style={{ fontSize: '12px', color: '#00f2fe', fontWeight: 700 }}>battery_code *</div>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Unique pack identifier (e.g. BM-SCOOT-101)</div>
              </div>

              <div style={{ background: 'rgba(9, 17, 38, 0.6)', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                <div className="font-mono" style={{ fontSize: '12px', color: '#00f2fe', fontWeight: 700 }}>voltage *</div>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Instantaneous pack terminal voltage (V)</div>
              </div>

              <div style={{ background: 'rgba(9, 17, 38, 0.6)', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                <div className="font-mono" style={{ fontSize: '12px', color: '#00f2fe', fontWeight: 700 }}>current *</div>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Current (A). Positive: discharge, Negative: charge</div>
              </div>

              <div style={{ background: 'rgba(9, 17, 38, 0.6)', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                <div className="font-mono" style={{ fontSize: '12px', color: '#00f2fe', fontWeight: 700 }}>temperature *</div>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Cell module core temperature (°C)</div>
              </div>

              <div style={{ background: 'rgba(9, 17, 38, 0.6)', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                <div className="font-mono" style={{ fontSize: '12px', color: '#38bdf8' }}>soc</div>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>State of Charge % (0 - 100)</div>
              </div>

              <div style={{ background: 'rgba(9, 17, 38, 0.6)', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                <div className="font-mono" style={{ fontSize: '12px', color: '#38bdf8' }}>vehicle_category</div>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Scooters, Bikes, Cars, Buses, Trucks</div>
              </div>
            </div>
          </div>

          <div style={{ 
            marginTop: '16px', 
            padding: '12px', 
            background: 'rgba(0, 242, 254, 0.05)', 
            borderRadius: '8px',
            border: '1px solid rgba(0, 242, 254, 0.15)',
            fontSize: '12px',
            color: 'var(--text-muted)'
          }}>
            💡 <strong>Quick Test Tip:</strong> Click <strong>Download Sample CSV</strong> above to receive a pre-formatted dataset containing samples across all 5 vehicle categories, then re-upload it to test ingestion.
          </div>
        </div>
      </div>

      {/* Dataset History Table */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f1f5f9' }}>Uploaded Dataset Ingestion History</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Persistent storage in SQLite database</p>
          </div>
          <button onClick={fetchDatasets} className="btn-secondary" style={{ padding: '6px 12px' }}>
            <RefreshCw size={14} className={loading ? 'spin' : ''} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        </div>

        <div className="custom-table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Dataset Filename</th>
                <th>Rows Ingested</th>
                <th>Status</th>
                <th>Ingested At</th>
                <th>Summary & Scope</th>
              </tr>
            </thead>
            <tbody>
              {datasets.map((ds) => (
                <tr key={ds.id}>
                  <td style={{ fontWeight: 700, color: '#00f2fe' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileText size={16} />
                      <span>{ds.filename}</span>
                    </div>
                  </td>
                  <td className="font-mono">{ds.row_count} rows</td>
                  <td>
                    <span className="badge badge-normal">{ds.status}</span>
                  </td>
                  <td style={{ color: 'var(--text-dim)' }}>
                    {new Date(ds.uploaded_at).toLocaleString()}
                  </td>
                  <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {ds.summary_notes}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
