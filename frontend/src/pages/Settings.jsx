import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Sliders, 
  ShieldAlert, 
  Cpu, 
  Save, 
  RefreshCw, 
  CheckCircle,
  Zap,
  Radio,
  Layers,
  Thermometer
} from 'lucide-react';
import { api } from '../api';

export default function Settings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Form thresholds
  const [thresholds, setThresholds] = useState({
    warning_temperature_c: 46.0,
    critical_temperature_c: 52.0,
    voltage_tolerance_pct: 18.0,
    critical_soh_pct: 75.0,
    warning_soh_pct: 85.0,
    anomaly_contamination: 0.08
  });

  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const data = await api.getSettings();
        setSettings(data);
        if (data.thresholds) setThresholds(data.thresholds);
        if (data.categories) setCategories(data.categories);
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.updateSettings({ thresholds });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      alert('Failed to save settings: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading && !settings) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', gap: '12px', color: '#00f2fe' }}>
        <RefreshCw size={24} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
        <span>Loading Platform Configuration...</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Header Info */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#f1f5f9' }}>
              Platform Parameters & Safety Thresholds
            </h3>
            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
              Tune telemetry anomaly sensitivity, vehicle specifications, and automatic BMS alert trigger levels.
            </p>
          </div>

          {savedSuccess && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: '#10b981',
              background: 'rgba(16, 185, 129, 0.12)',
              padding: '6px 14px',
              borderRadius: '8px',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              fontSize: '13px',
              fontWeight: 600
            }}>
              <CheckCircle size={16} /> Parameters Saved to Database
            </div>
          )}
        </div>
      </div>

      {/* 5 Supported EV Categories Showcase */}
      <div className="glass-card">
        <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#f1f5f9', marginBottom: '4px' }}>
          Configured EV Vehicle Categories (5 Segments)
        </h4>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Universal architecture mapped with nominal operational voltage and capacity parameters.
        </p>

        <div className="grid-cols-5" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
          {categories.map((cat, i) => (
            <div 
              key={i}
              style={{
                background: 'rgba(9, 17, 38, 0.6)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '10px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  background: 'rgba(0, 242, 254, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Zap size={16} color="#00f2fe" />
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#f1f5f9' }}>{cat.name}</div>
              </div>

              <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px' }}>
                <div>Voltage: <span className="font-mono" style={{ color: '#00f2fe' }}>{cat.voltage_range}</span></div>
                <div style={{ marginTop: '2px' }}>Capacity: <span className="font-mono" style={{ color: '#38bdf8' }}>{cat.typical_capacity}</span></div>
              </div>

              <span className="badge badge-cyan" style={{ fontSize: '10px', alignSelf: 'flex-start', marginTop: '4px' }}>
                Active in Fleet
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Threshold Policies Form */}
      <div className="glass-card">
        <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#f1f5f9', marginBottom: '16px' }}>
          BMS Threshold & Anomaly Sensitivity Policies
        </h4>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div className="grid-cols-3">
            <div>
              <label style={{ fontSize: '12.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Warning Temperature Threshold (°C)
              </label>
              <input
                type="number"
                step="0.5"
                value={thresholds.warning_temperature_c}
                onChange={(e) => setThresholds({ ...thresholds, warning_temperature_c: parseFloat(e.target.value) })}
                style={{ width: '100%' }}
              />
              <span style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px', display: 'block' }}>
                Generates preventive advisory alert
              </span>
            </div>

            <div>
              <label style={{ fontSize: '12.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Critical Thermal Runaway Ceiling (°C)
              </label>
              <input
                type="number"
                step="0.5"
                value={thresholds.critical_temperature_c}
                onChange={(e) => setThresholds({ ...thresholds, critical_temperature_c: parseFloat(e.target.value) })}
                style={{ width: '100%' }}
              />
              <span style={{ fontSize: '11px', color: '#f87171', marginTop: '4px', display: 'block' }}>
                Triggers immediate BMS emergency shutdown
              </span>
            </div>

            <div>
              <label style={{ fontSize: '12.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Voltage Tolerance Sag/Spike (±%)
              </label>
              <input
                type="number"
                step="0.5"
                value={thresholds.voltage_tolerance_pct}
                onChange={(e) => setThresholds({ ...thresholds, voltage_tolerance_pct: parseFloat(e.target.value) })}
                style={{ width: '100%' }}
              />
              <span style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px', display: 'block' }}>
                Maximum permissible nominal deviation
              </span>
            </div>
          </div>

          <div className="grid-cols-3">
            <div>
              <label style={{ fontSize: '12.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Warning SOH Degradation Level (%)
              </label>
              <input
                type="number"
                step="0.5"
                value={thresholds.warning_soh_pct}
                onChange={(e) => setThresholds({ ...thresholds, warning_soh_pct: parseFloat(e.target.value) })}
                style={{ width: '100%' }}
              />
              <span style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px', display: 'block' }}>
                Flags battery for scheduled cell balancing
              </span>
            </div>

            <div>
              <label style={{ fontSize: '12.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Critical EOL SOH Level (%)
              </label>
              <input
                type="number"
                step="0.5"
                value={thresholds.critical_soh_pct}
                onChange={(e) => setThresholds({ ...thresholds, critical_soh_pct: parseFloat(e.target.value) })}
                style={{ width: '100%' }}
              />
              <span style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px', display: 'block' }}>
                Standard EV pack retirement / 2nd life reuse
              </span>
            </div>

            <div>
              <label style={{ fontSize: '12.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Isolation Forest Contamination Rate
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max="0.25"
                value={thresholds.anomaly_contamination}
                onChange={(e) => setThresholds({ ...thresholds, anomaly_contamination: parseFloat(e.target.value) })}
                style={{ width: '100%' }}
              />
              <span style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px', display: 'block' }}>
                Unsupervised anomaly classifier sensitivity (0.01 - 0.20)
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
            <button type="submit" disabled={saving} className="btn-primary">
              <Save size={16} /> {saving ? 'Saving...' : 'Apply & Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
