import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Cpu, 
  BatteryCharging, 
  Thermometer, 
  Zap, 
  Layers, 
  RefreshCw,
  LayoutGrid,
  Table as TableIcon
} from 'lucide-react';
import { api } from '../api';

export default function BatteryMonitoring({ setActiveTab, setSelectedBatteryId }) {
  const [batteries, setBatteries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  const [showAddModal, setShowAddModal] = useState(false);

  // New Battery Form state
  const [newBattery, setNewBattery] = useState({
    battery_code: '',
    vehicle_category: 'Electric cars',
    model_name: '',
    manufacturer: '',
    nominal_capacity_ah: 100.0,
    nominal_voltage: 400.0,
    chemistry: 'NMC',
    cycle_count: 0,
    current_soh: 100.0,
    status: 'Normal'
  });

  const categories = [
    'All',
    'Electric scooters',
    'Electric bikes',
    'Electric cars',
    'Electric buses',
    'Electric trucks'
  ];

  const fetchBatteries = async () => {
    try {
      setLoading(true);
      const data = await api.getBatteries(categoryFilter, statusFilter, searchQuery);
      setBatteries(data);
    } catch (err) {
      console.error('Failed to load batteries:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatteries();
  }, [categoryFilter, statusFilter, searchQuery]);

  const handleCreateBattery = async (e) => {
    e.preventDefault();
    try {
      const createdBattery = await api.createBattery({
        ...newBattery,
        nominal_capacity_ah: parseFloat(newBattery.nominal_capacity_ah),
        nominal_voltage: parseFloat(newBattery.nominal_voltage),
        cycle_count: parseInt(newBattery.cycle_count) || 0,
        current_soh: parseFloat(newBattery.current_soh) || 100.0
      });
      setShowAddModal(false);
      setSelectedBatteryId(createdBattery.id);
      setNewBattery({
        battery_code: '',
        vehicle_category: 'Electric cars',
        model_name: '',
        manufacturer: '',
        nominal_capacity_ah: 100.0,
        nominal_voltage: 400.0,
        chemistry: 'NMC',
        cycle_count: 0,
        current_soh: 100.0,
        status: 'Normal'
      });
      fetchBatteries();
    } catch (err) {
      alert('Error registering battery: ' + err.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Controls & Filter Bar */}
      <div className="glass-card" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '14px' }}>
          {/* Category Tabs */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '2px' }}>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                style={{
                  background: categoryFilter === cat ? 'rgba(0, 242, 254, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                  border: categoryFilter === cat ? '1px solid #00f2fe' : '1px solid var(--border-subtle)',
                  color: categoryFilter === cat ? '#00f2fe' : 'var(--text-muted)',
                  padding: '7px 14px',
                  borderRadius: '20px',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease'
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ display: 'flex', background: 'rgba(9, 17, 38, 0.8)', borderRadius: '8px', border: '1px solid var(--border-subtle)', padding: '2px' }}>
              <button
                onClick={() => setViewMode('grid')}
                style={{
                  background: viewMode === 'grid' ? 'rgba(0, 242, 254, 0.2)' : 'transparent',
                  border: 'none',
                  color: viewMode === 'grid' ? '#00f2fe' : 'var(--text-dim)',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
                title="Grid View"
              >
                <LayoutGrid size={16} />
              </button>
              <button
                onClick={() => setViewMode('table')}
                style={{
                  background: viewMode === 'table' ? 'rgba(0, 242, 254, 0.2)' : 'transparent',
                  border: 'none',
                  color: viewMode === 'table' ? '#00f2fe' : 'var(--text-dim)',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
                title="Table View"
              >
                <TableIcon size={16} />
              </button>
            </div>

            <button onClick={() => setShowAddModal(true)} className="btn-primary">
              <Plus size={16} /> Register EV Pack
            </button>
          </div>
        </div>

        {/* Second Row: Search and Status filters */}
        <div style={{ display: 'flex', gap: '14px', marginTop: '14px', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--text-dim)' }} />
            <input
              type="text"
              placeholder="Search by battery code (e.g. BM-SCOOT-101), vehicle model, or manufacturer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', paddingLeft: '38px' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12.5px', color: 'var(--text-dim)' }}>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: '8px 12px', fontSize: '13px' }}
            >
              <option value="All">All Statuses</option>
              <option value="Normal">Normal</option>
              <option value="Warning">Warning</option>
              <option value="Critical">Critical</option>
            </select>
          </div>
        </div>
      </div>

      {/* Battery Cards / Table View */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '40vh', gap: '12px', color: '#00f2fe' }}>
          <RefreshCw size={22} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
          <span>Refreshing Telemetry Status...</span>
        </div>
      ) : batteries.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-muted)' }}>
          <p style={{ fontSize: '16px', fontWeight: 600 }}>No battery packs match the selected filters.</p>
          <p style={{ fontSize: '13px', marginTop: '6px' }}>Try switching category or resetting search parameters.</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid-cols-3">
          {batteries.map((bat) => (
            <div 
              key={bat.id} 
              className="glass-card glass-card-interactive" 
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '14px',
                borderTop: bat.status === 'Critical' ? '3px solid #ef4444' : (bat.status === 'Warning' ? '3px solid #f59e0b' : '3px solid #00f2fe')
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontWeight: 800, fontSize: '15px', color: '#f1f5f9' }}>{bat.battery_code}</span>
                    <span className="badge badge-cyan" style={{ fontSize: '10.5px' }}>{bat.chemistry}</span>
                  </div>
                  <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {bat.model_name}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{bat.manufacturer} • {bat.vehicle_category}</div>
                </div>

                <span className={`badge ${bat.status === 'Normal' ? 'badge-normal' : (bat.status === 'Warning' ? 'badge-warning' : 'badge-critical')}`}>
                  {bat.status}
                </span>
              </div>

              {/* SOH Progress Bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Health (SOH):</span>
                  <span style={{ 
                    fontWeight: 700, 
                    color: bat.current_soh >= 90 ? '#10b981' : (bat.current_soh >= 80 ? '#f59e0b' : '#ef4444') 
                  }}>
                    {bat.current_soh}%
                  </span>
                </div>
                <div style={{ height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ 
                    height: '100%', 
                    width: `${bat.current_soh}%`,
                    background: bat.current_soh >= 90 
                      ? 'linear-gradient(90deg, #10b981, #34d399)' 
                      : (bat.current_soh >= 80 ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' : 'linear-gradient(90deg, #ef4444, #f87171)'),
                    borderRadius: '3px'
                  }} />
                </div>
              </div>

              {/* Sensor Metrics Grid */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(3, 1fr)', 
                gap: '8px', 
                background: 'rgba(9, 17, 38, 0.6)', 
                padding: '10px', 
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)'
              }}>
                <div>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-dim)' }}>VOLTAGE</div>
                  <div className="font-mono" style={{ fontSize: '13px', fontWeight: 600, color: '#38bdf8' }}>
                    {bat.nominal_voltage}V
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-dim)' }}>CAPACITY</div>
                  <div className="font-mono" style={{ fontSize: '13px', fontWeight: 600, color: '#f1f5f9' }}>
                    {bat.nominal_capacity_ah}Ah
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-dim)' }}>CYCLES</div>
                  <div className="font-mono" style={{ fontSize: '13px', fontWeight: 600, color: '#f1f5f9' }}>
                    {bat.cycle_count}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <button
                  onClick={() => {
                    setSelectedBatteryId(bat.id);
                    setActiveTab('details');
                  }}
                  className="btn-secondary"
                  style={{ flex: 1, justifyContent: 'center', fontSize: '12.5px', padding: '8px 10px' }}
                >
                  <Eye size={14} /> Telemetry
                </button>
                <button
                  onClick={() => {
                    setSelectedBatteryId(bat.id);
                    setActiveTab('ai-analysis');
                  }}
                  className="btn-secondary"
                  style={{ flex: 1, justifyContent: 'center', fontSize: '12.5px', padding: '8px 10px', borderColor: 'rgba(0, 242, 254, 0.3)', color: '#00f2fe' }}
                >
                  <Cpu size={14} /> AI Analysis
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="custom-table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Battery Code</th>
                <th>Category</th>
                <th>Model & Chemistry</th>
                <th>Nominal Rating</th>
                <th>Cycle Count</th>
                <th>SOH Health</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {batteries.map((bat) => (
                <tr key={bat.id}>
                  <td style={{ fontWeight: 700, color: '#f1f5f9' }}>{bat.battery_code}</td>
                  <td>
                    <span className="badge badge-cyan" style={{ fontSize: '11px' }}>{bat.vehicle_category}</span>
                  </td>
                  <td>
                    <div>{bat.model_name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{bat.chemistry} • {bat.manufacturer}</div>
                  </td>
                  <td className="font-mono">{bat.nominal_voltage}V / {bat.nominal_capacity_ah}Ah</td>
                  <td className="font-mono">{bat.cycle_count}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ 
                        fontWeight: 700, 
                        color: bat.current_soh >= 90 ? '#10b981' : (bat.current_soh >= 80 ? '#f59e0b' : '#ef4444') 
                      }}>
                        {bat.current_soh}%
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${bat.status === 'Normal' ? 'badge-normal' : (bat.status === 'Warning' ? 'badge-warning' : 'badge-critical')}`}>
                      {bat.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => {
                          setSelectedBatteryId(bat.id);
                          setActiveTab('details');
                        }}
                        className="btn-secondary"
                        style={{ padding: '5px 8px', fontSize: '12px' }}
                      >
                        <Eye size={13} /> View
                      </button>
                      <button
                        onClick={() => {
                          setSelectedBatteryId(bat.id);
                          setActiveTab('ai-analysis');
                        }}
                        className="btn-secondary"
                        style={{ padding: '5px 8px', fontSize: '12px', color: '#00f2fe' }}
                      >
                        <Cpu size={13} /> AI
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Battery Modal */}
      {showAddModal && (
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
          <div className="glass-card" style={{ width: '100%', maxWidth: '540px', background: '#0a142e', border: '1px solid rgba(0, 242, 254, 0.3)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '6px', color: '#fff' }}>Register New EV Battery Pack</h2>
            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '18px' }}>
              Add a new battery into universal fleet tracking with automated ML degradation baseline.
            </p>

            <form onSubmit={handleCreateBattery} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>Battery Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BM-CAR-901"
                    value={newBattery.battery_code}
                    onChange={(e) => setNewBattery({ ...newBattery, battery_code: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>Vehicle Category *</label>
                  <select
                    value={newBattery.vehicle_category}
                    onChange={(e) => setNewBattery({ ...newBattery, vehicle_category: e.target.value })}
                    style={{ width: '100%' }}
                  >
                    <option value="Electric scooters">Electric scooters</option>
                    <option value="Electric bikes">Electric bikes</option>
                    <option value="Electric cars">Electric cars</option>
                    <option value="Electric buses">Electric buses</option>
                    <option value="Electric trucks">Electric trucks</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>Model Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. HyperDrive 60kWh"
                    value={newBattery.model_name}
                    onChange={(e) => setNewBattery({ ...newBattery, model_name: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>Manufacturer *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. EcoVolt Systems"
                    value={newBattery.manufacturer}
                    onChange={(e) => setNewBattery({ ...newBattery, manufacturer: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>Nominal (V) *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={newBattery.nominal_voltage}
                    onChange={(e) => setNewBattery({ ...newBattery, nominal_voltage: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>Capacity (Ah) *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={newBattery.nominal_capacity_ah}
                    onChange={(e) => setNewBattery({ ...newBattery, nominal_capacity_ah: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>Chemistry</label>
                  <select
                    value={newBattery.chemistry}
                    onChange={(e) => setNewBattery({ ...newBattery, chemistry: e.target.value })}
                    style={{ width: '100%' }}
                  >
                    <option value="NMC">NMC</option>
                    <option value="LFP">LFP</option>
                    <option value="NCA">NCA</option>
                    <option value="LTO">LTO</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>Initial Cycle Count</label>
                  <input
                    type="number"
                    value={newBattery.cycle_count}
                    onChange={(e) => setNewBattery({ ...newBattery, cycle_count: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>Initial SOH (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newBattery.current_soh}
                    onChange={(e) => setNewBattery({ ...newBattery, current_soh: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Register Battery
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
