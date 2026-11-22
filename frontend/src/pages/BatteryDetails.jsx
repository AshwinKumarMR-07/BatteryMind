import React, { useState, useEffect } from 'react';
import { 
  BatteryCharging, 
  Thermometer, 
  Zap, 
  Activity, 
  Clock, 
  AlertTriangle, 
  Cpu, 
  RefreshCw,
  TrendingDown,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  ReferenceLine 
} from 'recharts';
import { api } from '../api';

export default function BatteryDetails({ selectedBatteryId, setSelectedBatteryId, setActiveTab }) {
  const [batteries, setBatteries] = useState([]);
  const [selectedBattery, setSelectedBattery] = useState(null);
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load battery list & initial battery
  useEffect(() => {
    const loadInitial = async () => {
      try {
        setLoading(true);
        const allBats = await api.getBatteries();
        setBatteries(allBats);
        const currentId = selectedBatteryId || (allBats[0] ? allBats[0].id : 1);
        if (currentId) {
          await loadBatteryData(currentId);
        }
      } catch (err) {
        console.error('Failed to load battery details:', err);
      } finally {
        setLoading(false);
      }
    };
    loadInitial();
  }, [selectedBatteryId]);

  const loadBatteryData = async (batId) => {
    try {
      setRefreshing(true);
      const [bat, rList] = await Promise.all([
        api.getBattery(batId),
        api.getReadings(batId, 40)
      ]);
      setSelectedBattery(bat);
      // Format timestamps for chart axis
      const formatted = rList.map(r => ({
        ...r,
        formattedTime: new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }));
      setReadings(formatted);
    } catch (err) {
      console.error(err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleSelectChange = (e) => {
    const id = parseInt(e.target.value);
    setSelectedBatteryId(id);
    loadBatteryData(id);
  };

  if (loading && !selectedBattery) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', gap: '12px', color: '#00f2fe' }}>
        <RefreshCw size={24} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
        <span>Loading Battery Diagnostics...</span>
      </div>
    );
  }

  // Calculate live stats from readings
  const latestReading = readings.length > 0 ? readings[readings.length - 1] : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Top Selector & Specs Bar */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
          {/* Battery Dropdown Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>Select Battery Pack:</span>
            <select
              value={selectedBattery?.id || ''}
              onChange={handleSelectChange}
              style={{ minWidth: '280px', padding: '9px 14px', fontSize: '14px', fontWeight: 600, color: '#00f2fe' }}
            >
              {batteries.map(b => (
                <option key={b.id} value={b.id}>
                  {b.battery_code} – {b.model_name} ({b.vehicle_category})
                </option>
              ))}
            </select>

            <button 
              onClick={() => loadBatteryData(selectedBattery.id)} 
              disabled={refreshing}
              className="btn-secondary"
              style={{ padding: '8px 12px' }}
              title="Refresh readings"
            >
              <RefreshCw size={14} className={refreshing ? 'spin' : ''} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            </button>
          </div>

          {/* Quick jump to AI Analysis */}
          <button
            onClick={() => {
              setSelectedBatteryId(selectedBattery.id);
              setActiveTab('ai-analysis');
            }}
            className="btn-primary"
          >
            <Cpu size={16} /> Open Full AI Diagnostics <ChevronRight size={16} />
          </button>
        </div>

        {/* Battery Specifications Banner */}
        {selectedBattery && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '14px',
            marginTop: '20px',
            paddingTop: '18px',
            borderTop: '1px solid var(--border-subtle)'
          }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Manufacturer / Model</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#f1f5f9', marginTop: '2px' }}>
                {selectedBattery.manufacturer}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{selectedBattery.model_name}</div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Vehicle Category</div>
              <div style={{ marginTop: '4px' }}>
                <span className="badge badge-cyan">{selectedBattery.vehicle_category}</span>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Chemistry & Voltage</div>
              <div className="font-mono" style={{ fontSize: '14px', fontWeight: 700, color: '#38bdf8', marginTop: '2px' }}>
                {selectedBattery.chemistry} • {selectedBattery.nominal_voltage}V
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{selectedBattery.nominal_capacity_ah} Ah Nominal</div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Cycle Count</div>
              <div className="font-mono" style={{ fontSize: '14px', fontWeight: 700, color: '#f1f5f9', marginTop: '2px' }}>
                {selectedBattery.cycle_count} Cycles
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Equivalent Full Cycles</div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>State of Health</div>
              <div style={{ 
                fontSize: '18px', 
                fontWeight: 800, 
                color: selectedBattery.current_soh >= 90 ? '#10b981' : (selectedBattery.current_soh >= 80 ? '#f59e0b' : '#ef4444'),
                marginTop: '2px'
              }}>
                {selectedBattery.current_soh}%
              </div>
              <span className={`badge ${selectedBattery.status === 'Normal' ? 'badge-normal' : (selectedBattery.status === 'Warning' ? 'badge-warning' : 'badge-critical')}`} style={{ fontSize: '10px', marginTop: '2px' }}>
                {selectedBattery.status} Status
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Historical Telemetry Graphs (4 charts grid) */}
      <div className="grid-cols-2">
        {/* Chart 1: Voltage Profile */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div>
              <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#f1f5f9' }}>Pack Terminal Voltage (V)</h4>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Real-time cell string voltage trajectory</p>
            </div>
            <div className="font-mono" style={{ fontSize: '14px', color: '#00f2fe', fontWeight: 700 }}>
              {latestReading ? `${latestReading.voltage} V` : '--'}
            </div>
          </div>
          <div style={{ height: '230px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={readings} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="formattedTime" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={11} domain={['auto', 'auto']} />
                <Tooltip contentStyle={{ background: '#0b1329', border: '1px solid #00f2fe', borderRadius: '8px' }} />
                <Line 
                  type="monotone" 
                  dataKey="voltage" 
                  stroke="#00f2fe" 
                  strokeWidth={2.5} 
                  dot={false}
                  activeDot={{ r: 5, fill: '#00f2fe' }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Temperature Profile with Thermal Threshold */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div>
              <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#f1f5f9' }}>Thermal Profile (°C)</h4>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Pack core temperature vs safety warning line</p>
            </div>
            <div className="font-mono" style={{ 
              fontSize: '14px', 
              fontWeight: 700, 
              color: latestReading && latestReading.temperature > 48 ? '#ef4444' : '#10b981' 
            }}>
              {latestReading ? `${latestReading.temperature} °C` : '--'}
            </div>
          </div>
          <div style={{ height: '230px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={readings} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="formattedTime" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={11} domain={[20, 60]} />
                <Tooltip contentStyle={{ background: '#0b1329', border: '1px solid #f59e0b', borderRadius: '8px' }} />
                <ReferenceLine y={48} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'Warn 48°C', fill: '#ef4444', fontSize: 10 }} />
                <Area 
                  type="monotone" 
                  dataKey="temperature" 
                  stroke="#f59e0b" 
                  strokeWidth={2} 
                  fillOpacity={1} 
                  fill="url(#tempGrad)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Current Profile (Charge vs Discharge) */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div>
              <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#f1f5f9' }}>Current Flow (A)</h4>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Positive: Discharge load • Negative: Regen/Charge</p>
            </div>
            <div className="font-mono" style={{ fontSize: '14px', color: '#38bdf8', fontWeight: 700 }}>
              {latestReading ? `${latestReading.current} A` : '--'}
            </div>
          </div>
          <div style={{ height: '230px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={readings} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="formattedTime" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ background: '#0b1329', border: '1px solid #38bdf8', borderRadius: '8px' }} />
                <ReferenceLine y={0} stroke="#64748b" strokeWidth={1} />
                <Line 
                  type="monotone" 
                  dataKey="current" 
                  stroke="#38bdf8" 
                  strokeWidth={2} 
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: SOC and Capacity Remaining */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div>
              <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#f1f5f9' }}>State of Charge (SOC %)</h4>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Coulombic capacity depletion & energy level</p>
            </div>
            <div className="font-mono" style={{ fontSize: '14px', color: '#10b981', fontWeight: 700 }}>
              {latestReading ? `${latestReading.soc}% (${latestReading.capacity_remaining_ah} Ah)` : '--'}
            </div>
          </div>
          <div style={{ height: '230px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={readings} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="socGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="formattedTime" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} />
                <Tooltip contentStyle={{ background: '#0b1329', border: '1px solid #10b981', borderRadius: '8px' }} />
                <Area 
                  type="monotone" 
                  dataKey="soc" 
                  stroke="#10b981" 
                  strokeWidth={2} 
                  fillOpacity={1} 
                  fill="url(#socGrad)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Sensor Readings Historical Table */}
      <div className="glass-card">
        <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#f1f5f9', marginBottom: '14px' }}>
          Recent Sensor Telemetry Stream (Latest Readings)
        </h4>

        <div className="custom-table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Voltage (V)</th>
                <th>Current (A)</th>
                <th>Temperature (°C)</th>
                <th>SOC (%)</th>
                <th>Capacity (Ah)</th>
                <th>Anomaly Flag</th>
              </tr>
            </thead>
            <tbody>
              {readings.slice(-10).reverse().map((r, i) => (
                <tr key={r.id || i}>
                  <td style={{ color: 'var(--text-muted)' }}>{new Date(r.timestamp).toLocaleString()}</td>
                  <td className="font-mono" style={{ color: '#00f2fe' }}>{r.voltage} V</td>
                  <td className="font-mono">{r.current} A</td>
                  <td className="font-mono" style={{ color: r.temperature > 48 ? '#ef4444' : '#f1f5f9' }}>
                    {r.temperature} °C
                  </td>
                  <td className="font-mono" style={{ color: '#10b981' }}>{r.soc}%</td>
                  <td className="font-mono">{r.capacity_remaining_ah} Ah</td>
                  <td>
                    {r.is_anomaly ? (
                      <span className="badge badge-critical">Anomaly Detected</span>
                    ) : (
                      <span className="badge badge-normal">Normal</span>
                    )}
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
