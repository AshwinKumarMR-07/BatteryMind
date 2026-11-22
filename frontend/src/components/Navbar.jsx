import React, { useState } from 'react';
import { Activity, Bell, Play, RefreshCw, Radio } from 'lucide-react';
import { api } from '../api';

export default function Navbar({ activeTab, onSimulateSuccess, selectedBatteryId }) {
  const [simulating, setSimulating] = useState(false);
  const [pulseMessage, setPulseMessage] = useState('');

  const titles = {
    'dashboard': { title: 'Executive Fleet Overview', subtitle: 'Universal State of Health & Predictive Health Intelligence' },
    'monitoring': { title: 'Battery Telemetry Monitoring', subtitle: 'Live Multi-Sensor Streams (Voltage, Current, Thermal, Cycles)' },
    'details': { title: 'Battery Detailed Diagnostics', subtitle: 'Granular Cell Chemistry, Historical Curves & Telemetry Stream' },
    'ai-analysis': { title: 'AI & Machine Learning Intelligence', subtitle: 'SOH Estimation, Isolation Forest Anomalies & Degradation Forecasting' },
    'alerts': { title: 'Alerts & Safety Management', subtitle: 'Early Warning Thresholds & Critical Thermal Runaway Protection' },
    'data-upload': { title: 'Dataset Ingestion & Management', subtitle: 'Upload Battery CSV Logs, Parse Fields & Sync to Storage' },
    'settings': { title: 'Platform & Threshold Settings', subtitle: 'Vehicle Chemistry Bounds, Threshold Policies & Simulator Tuning' }
  };

  const handleSimulate = async () => {
    try {
      setSimulating(true);
      const targetId = selectedBatteryId || 1;
      const res = await api.simulateTelemetry(targetId);
      setPulseMessage(`Simulated reading recorded for pack #${targetId}!`);
      setTimeout(() => setPulseMessage(''), 3500);
      if (onSimulateSuccess) onSimulateSuccess();
    } catch (err) {
      console.error(err);
      setPulseMessage('Simulation error: ' + err.message);
      setTimeout(() => setPulseMessage(''), 3500);
    } finally {
      setSimulating(false);
    }
  };

  const current = titles[activeTab] || { title: 'BatteryMind Platform', subtitle: 'Universal EV Battery Health Intelligence' };

  return (
    <header className="top-navbar">
      <div>
        <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', letterSpacing: '-0.2px' }}>
          {current.title}
        </h1>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          {current.subtitle}
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {pulseMessage && (
          <div style={{
            fontSize: '12px',
            color: '#00f2fe',
            background: 'rgba(0, 242, 254, 0.1)',
            padding: '5px 12px',
            borderRadius: '6px',
            border: '1px solid rgba(0, 242, 254, 0.3)',
            animation: 'fadeIn 0.3s ease'
          }}>
            {pulseMessage}
          </div>
        )}

        {/* Live Simulator Trigger Button */}
        <button 
          onClick={handleSimulate}
          disabled={simulating}
          className="btn-secondary"
          style={{
            borderColor: 'rgba(0, 242, 254, 0.3)',
            background: simulating ? 'rgba(0, 242, 254, 0.15)' : 'rgba(15, 26, 56, 0.8)',
            color: '#00f2fe'
          }}
          title="Push a new simulated sensor reading packet into SQLite database"
        >
          {simulating ? (
            <RefreshCw size={15} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
          ) : (
            <Radio size={15} color="#00f2fe" />
          )}
          <span>{simulating ? 'Injecting...' : 'Stream Telemetry'}</span>
        </button>

        {/* Fleet Online Indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(15, 26, 56, 0.7)',
          padding: '6px 14px',
          borderRadius: '8px',
          border: '1px solid var(--border-subtle)',
          fontSize: '12.5px',
          color: 'var(--text-muted)'
        }}>
          <span style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            background: '#00f2fe',
            boxShadow: '0 0 8px #00f2fe'
          }}></span>
          <span>5 EV Segments Active</span>
        </div>
      </div>
    </header>
  );
}
