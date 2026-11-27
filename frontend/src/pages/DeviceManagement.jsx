import React, { useEffect, useState } from 'react';
import { Link2, Radio, RefreshCw, ShieldAlert } from 'lucide-react';
import { api } from '../api';

const isPairable = (device) => device.is_active && !device.is_revoked;

export default function DeviceManagement() {
  const [devices, setDevices] = useState([]);
  const [batteries, setBatteries] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [selectedBatteryId, setSelectedBatteryId] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [deviceIdentifier, setDeviceIdentifier] = useState('');
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [pairing, setPairing] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [registeredDevices, registeredBatteries] = await Promise.all([
        api.getDevices(),
        api.getBatteries()
      ]);
      const pairableDevices = registeredDevices.filter(isPairable);
      setDevices(registeredDevices);
      setBatteries(registeredBatteries);
      setSelectedDeviceId((current) =>
        pairableDevices.some((device) => String(device.id) === current)
          ? current
          : String(pairableDevices[0]?.id ?? '')
      );
      setSelectedBatteryId((current) =>
        registeredBatteries.some((battery) => String(battery.id) === current)
          ? current
          : String(registeredBatteries[0]?.id ?? '')
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRegister = async (event) => {
    event.preventDefault();
    setRegistering(true);
    setError('');
    setMessage('');
    try {
      const device = await api.createDevice({
        name: deviceName.trim(),
        device_identifier: deviceIdentifier.trim()
      });
      setDevices((current) => [device, ...current]);
      setSelectedDeviceId(String(device.id));
      setDeviceName('');
      setDeviceIdentifier('');
      setMessage('Device registered and ready for pairing.');
    } catch (err) {
      setError(err.message);
    } finally {
      setRegistering(false);
    }
  };

  const handlePair = async (event) => {
    event.preventDefault();
    if (!selectedDeviceId || !selectedBatteryId) return;
    setPairing(true);
    setError('');
    setMessage('');
    try {
      const pairedDevice = await api.pairDevice(
        Number(selectedDeviceId),
        Number(selectedBatteryId)
      );
      setDevices((current) =>
        current.map((device) => device.id === pairedDevice.id ? pairedDevice : device)
      );
      setMessage(`${pairedDevice.name} paired successfully.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setPairing(false);
    }
  };

  const handleRevoke = async (device) => {
    setError('');
    setMessage('');
    try {
      const revokedDevice = await api.revokeDevice(device.id);
      setDevices((current) =>
        current.map((item) => item.id === revokedDevice.id ? revokedDevice : item)
      );
      setSelectedDeviceId((current) =>
        String(revokedDevice.id) === current
          ? String(devices.find((item) => item.id !== revokedDevice.id && isPairable(item))?.id ?? '')
          : current
      );
      setMessage(`${device.name} was revoked and can no longer be paired.`);
    } catch (err) {
      setError(err.message);
    }
  };

  const pairableDevices = devices.filter(isPairable);
  const selectedDevice = pairableDevices.find(
    (device) => String(device.id) === selectedDeviceId
  );
  const currentUser = (() => {
    try { return JSON.parse(localStorage.getItem('batterymind_user')); } catch { return null; }
  })();
  const canManageDevices = currentUser?.role !== 'Viewer';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {message && <div role="status" style={{ color: '#34d399', fontSize: '13px' }}>{message}</div>}
      {error && <div role="alert" style={{ color: '#f87171', fontSize: '13px' }}>{error}</div>}

      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div>
            <h3 style={{ fontSize: '18px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Radio size={20} color="#00f2fe" /> Select Device
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
              Pair an active registered device with one of your battery packs.
            </p>
          </div>
          <button className="btn-secondary" onClick={loadData} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
          </button>
        </div>

        <form onSubmit={handlePair} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'end', gap: '12px' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: '1 1 220px', color: 'var(--text-muted)', fontSize: '12px' }}>
            Select Device
            <select
              aria-label="Select Device"
              value={selectedDeviceId}
              onChange={(event) => setSelectedDeviceId(event.target.value)}
              disabled={loading}
              required
            >
              <option value="">Select a registered device</option>
              {pairableDevices.map((device) => (
                <option key={device.id} value={device.id}>
                  {device.name} ({device.device_identifier}) — {device.pairing_status}
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: '1 1 220px', color: 'var(--text-muted)', fontSize: '12px' }}>
            Select Battery
            <select
              aria-label="Select Battery"
              value={selectedBatteryId}
              onChange={(event) => setSelectedBatteryId(event.target.value)}
              disabled={loading || batteries.length === 0}
              required
            >
              <option value="">Select a battery pack</option>
              {batteries.map((battery) => (
                <option key={battery.id} value={battery.id}>
                  {battery.battery_code} — {battery.model_name}
                </option>
              ))}
            </select>
          </label>

          <button className="btn-primary" type="submit" disabled={loading || pairing || !selectedDevice || !selectedBatteryId}>
            <Link2 size={15} /> {pairing ? 'Pairing...' : 'Pair Device'}
          </button>
        </form>

        {!loading && pairableDevices.length === 0 && (
          <p style={{ marginTop: '12px', color: 'var(--text-muted)', fontSize: '12px' }}>
            No active devices are registered. Register a device below to make it available for pairing.
          </p>
        )}
        {!loading && batteries.length === 0 && (
          <p style={{ marginTop: '12px', color: 'var(--text-muted)', fontSize: '12px' }}>
            Register a battery pack before pairing a device.
          </p>
        )}
      </div>

      {canManageDevices && (
        <div className="glass-card">
          <h3 style={{ fontSize: '16px', marginBottom: '4px' }}>Register Device</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '16px' }}>
            New devices are registered as Pairing Pending and can be selected immediately.
          </p>
          <form onSubmit={handleRegister} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'end', gap: '12px' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: '1 1 220px', color: 'var(--text-muted)', fontSize: '12px' }}>
              Device Name
              <input value={deviceName} onChange={(event) => setDeviceName(event.target.value)} required maxLength={100} />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: '1 1 220px', color: 'var(--text-muted)', fontSize: '12px' }}>
              Device Identifier
              <input value={deviceIdentifier} onChange={(event) => setDeviceIdentifier(event.target.value)} required maxLength={100} />
            </label>
            <button className="btn-primary" type="submit" disabled={registering}>
              {registering ? 'Registering...' : 'Register Device'}
            </button>
          </form>
        </div>
      )}

      <div className="glass-card custom-table-container">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <ShieldAlert size={18} color="#00f2fe" />
          <h3 style={{ fontSize: '16px' }}>Registered Devices</h3>
        </div>
        <table className="custom-table">
          <thead>
            <tr><th>Device</th><th>Identifier</th><th>Status</th><th>Paired Battery</th>{canManageDevices && <th>Action</th>}</tr>
          </thead>
          <tbody>
            {devices.map((device) => (
              <tr key={device.id}>
                <td>{device.name}</td>
                <td className="font-mono">{device.device_identifier}</td>
                <td>{device.pairing_status}</td>
                <td>{batteries.find((battery) => battery.id === device.battery_id)?.battery_code || 'Not paired'}</td>
                {canManageDevices && (
                  <td>
                    {!device.is_revoked && (
                      <button className="btn-secondary" onClick={() => handleRevoke(device)} style={{ color: '#f87171' }}>
                        Revoke
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
            {!loading && devices.length === 0 && (
              <tr><td colSpan={canManageDevices ? 5 : 4} style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No registered devices.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
