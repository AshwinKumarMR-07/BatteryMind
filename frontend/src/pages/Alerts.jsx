import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle, 
  Clock, 
  Filter, 
  RefreshCw, 
  Plus,
  Check,
  CheckCheck,
  Info
} from 'lucide-react';
import { api } from '../api';

export default function Alerts({ setActiveTab, setSelectedBatteryId }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [batteries, setBatteries] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New alert form state
  const [newAlert, setNewAlert] = useState({
    battery_id: null,
    alert_type: 'High Temperature Advisory',
    severity: 'Warning',
    message: '',
    status: 'Active'
  });

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const [alertList, batList] = await Promise.all([
        api.getAlerts(severityFilter, statusFilter),
        api.getBatteries()
      ]);
      setAlerts(alertList);
      setBatteries(batList);
      if (batList.length > 0 && (newAlert.battery_id === 1 || newAlert.battery_id === null)) {
        setNewAlert(prev => ({ ...prev, battery_id: batList[0].id }));
      }
    } catch (err) {
      console.error('Failed to load alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [severityFilter, statusFilter]);

  const handleUpdateStatus = async (alertId, status) => {
    try {
      await api.updateAlertStatus(alertId, status);
      fetchAlerts();
    } catch (err) {
      alert('Failed to update alert: ' + err.message);
    }
  };

  const handleCreateAlert = async (e) => {
    e.preventDefault();
    try {
      await api.createAlert({
        ...newAlert,
        battery_id: parseInt(newAlert.battery_id)
      });
      setShowCreateModal(false);
      setNewAlert({
        battery_id: batteries[0]?.id || null,
        alert_type: 'High Temperature Advisory',
        severity: 'Warning',
        message: '',
        status: 'Active'
      });
      fetchAlerts();
    } catch (err) {
      alert('Failed to create alert: ' + err.message);
    }
  };

  const criticalCount = alerts.filter(a => a.severity === 'Critical').length;
  const warningCount = alerts.filter(a => a.severity === 'Warning').length;
  const activeCount = alerts.filter(a => a.status === 'Active').length;
  const resolvedCount = alerts.filter(a => a.status === 'Resolved').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Alert Stats Top Bar */}
      <div className="grid-cols-4">
        <div className="glass-card" style={{ borderLeft: '4px solid #ef4444' }}>
          <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>Critical Incidents</div>
          <div className="font-mono" style={{ fontSize: '30px', fontWeight: 800, color: '#ef4444', marginTop: '4px' }}>
            {criticalCount}
          </div>
          <div style={{ fontSize: '12px', color: '#f87171', marginTop: '4px' }}>Immediate Throttling Needed</div>
        </div>

        <div className="glass-card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>Warning Advisories</div>
          <div className="font-mono" style={{ fontSize: '30px', fontWeight: 800, color: '#f59e0b', marginTop: '4px' }}>
            {warningCount}
          </div>
          <div style={{ fontSize: '12px', color: '#fbbf24', marginTop: '4px' }}>Preventive Depot Checks</div>
        </div>

        <div className="glass-card" style={{ borderLeft: '4px solid #00f2fe' }}>
          <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>Active Alerts</div>
          <div className="font-mono" style={{ fontSize: '30px', fontWeight: 800, color: '#00f2fe', marginTop: '4px' }}>
            {activeCount}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '4px' }}>Pending engineering action</div>
        </div>

        <div className="glass-card" style={{ borderLeft: '4px solid #10b981' }}>
          <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>Resolved Incidents</div>
          <div className="font-mono" style={{ fontSize: '30px', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>
            {resolvedCount}
          </div>
          <div style={{ fontSize: '12px', color: '#10b981', marginTop: '4px' }}>Safely cleared & archived</div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="glass-card" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12.5px', color: 'var(--text-dim)' }}>Severity:</span>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                style={{ padding: '7px 12px', fontSize: '13px' }}
              >
                <option value="All">All Severities</option>
                <option value="Critical">Critical Only</option>
                <option value="Warning">Warning Only</option>
                <option value="Info">Info Only</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12.5px', color: 'var(--text-dim)' }}>Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ padding: '7px 12px', fontSize: '13px' }}
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Acknowledged">Acknowledged</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>

            <button onClick={fetchAlerts} className="btn-secondary" style={{ padding: '7px 12px' }}>
              <RefreshCw size={14} className={loading ? 'spin' : ''} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            </button>
          </div>

          <button onClick={() => setShowCreateModal(true)} className="btn-primary" disabled={batteries.length === 0}>
            <Plus size={16} /> Create Custom Safety Alert
          </button>
        </div>
      </div>

      {/* Alerts Table */}
      <div className="glass-card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '30vh', gap: '12px', color: '#00f2fe' }}>
            <RefreshCw size={22} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
            <span>Fetching Incident Records...</span>
          </div>
        ) : alerts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '45px 20px', color: 'var(--text-muted)' }}>
            <CheckCircle size={38} color="#10b981" style={{ margin: '0 auto 10px auto' }} />
            <p style={{ fontSize: '15px', fontWeight: 600 }}>No safety alerts match the current filter.</p>
            <p style={{ fontSize: '12px', marginTop: '4px' }}>Fleet operating within standard safety boundaries.</p>
          </div>
        ) : (
          <div className="custom-table-container" style={{ border: 'none' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Severity</th>
                  <th>Pack & Category</th>
                  <th>Alert Type</th>
                  <th>Message / Root Cause</th>
                  <th>Timestamp</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((alert) => (
                  <tr key={alert.id}>
                    <td>
                      <span className={`badge ${alert.severity === 'Critical' ? 'badge-critical' : (alert.severity === 'Warning' ? 'badge-warning' : 'badge-cyan')}`}>
                        {alert.severity}
                      </span>
                    </td>
                    <td>
                      <div 
                        onClick={() => {
                          setSelectedBatteryId(alert.battery_id);
                          setActiveTab('details');
                        }}
                        style={{ fontWeight: 700, color: '#00f2fe', cursor: 'pointer', textDecoration: 'underline' }}
                        title="Click to inspect this battery"
                      >
                        {alert.battery_code}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{alert.vehicle_category}</div>
                    </td>
                    <td style={{ fontWeight: 600, color: '#f1f5f9' }}>{alert.alert_type}</td>
                    <td style={{ fontSize: '12.5px', color: 'var(--text-muted)', maxWidth: '350px' }}>
                      {alert.message}
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                      {new Date(alert.timestamp).toLocaleString()}
                    </td>
                    <td>
                      <span style={{
                        fontSize: '11.5px',
                        fontWeight: 600,
                        color: alert.status === 'Active' ? '#f87171' : (alert.status === 'Acknowledged' ? '#fbbf24' : '#10b981')
                      }}>
                        {alert.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {alert.status === 'Active' && (
                          <button
                            onClick={() => handleUpdateStatus(alert.id, 'Acknowledged')}
                            className="btn-secondary"
                            style={{ padding: '5px 8px', fontSize: '11.5px' }}
                            title="Acknowledge incident"
                          >
                            <Check size={13} /> Ack
                          </button>
                        )}
                        {alert.status !== 'Resolved' && (
                          <button
                            onClick={() => handleUpdateStatus(alert.id, 'Resolved')}
                            className="btn-success"
                            style={{ padding: '5px 8px', fontSize: '11.5px' }}
                            title="Mark incident as resolved"
                          >
                            <CheckCheck size={13} /> Resolve
                          </button>
                        )}
                        {alert.status === 'Resolved' && (
                          <span style={{ fontSize: '11px', color: '#10b981' }}>✓ Completed</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Custom Alert Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(4, 9, 21, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '500px', background: '#0a142e', border: '1px solid rgba(0, 242, 254, 0.3)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '6px', color: '#fff' }}>Create Custom Fleet Safety Alert</h2>
            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '18px' }}>
              Broadcast a targeted maintenance ticket or threshold violation advisory to operators.
            </p>

            <form onSubmit={handleCreateAlert} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>Target Battery Pack *</label>
                <select
                  value={newAlert.battery_id}
                  onChange={(e) => setNewAlert({ ...newAlert, battery_id: parseInt(e.target.value) })}
                  style={{ width: '100%' }}
                >
                  {batteries.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.battery_code} ({b.model_name} - {b.vehicle_category})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>Severity *</label>
                  <select
                    value={newAlert.severity}
                    onChange={(e) => setNewAlert({ ...newAlert, severity: e.target.value })}
                    style={{ width: '100%' }}
                  >
                    <option value="Warning">Warning</option>
                    <option value="Critical">Critical</option>
                    <option value="Info">Info</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>Alert Type *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Thermal Drift Spike"
                    value={newAlert.alert_type}
                    onChange={(e) => setNewAlert({ ...newAlert, alert_type: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>Incident Description *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe the detected condition, temperature violation, or required depot service..."
                  value={newAlert.message}
                  onChange={(e) => setNewAlert({ ...newAlert, message: e.target.value })}
                  style={{ width: '100%', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Broadcast Alert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
