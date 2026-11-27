import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Activity, 
  AlertTriangle, 
  ShieldAlert, 
  TrendingUp, 
  CheckCircle2, 
  Thermometer, 
  BatteryCharging,
  ArrowRight,
  RefreshCw,
  SlidersHorizontal
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Cell, 
  PieChart, 
  Pie, 
  AreaChart, 
  Area 
} from 'recharts';
import { api } from '../api';

export default function Dashboard({ setActiveTab, setSelectedBatteryId }) {
  const [stats, setStats] = useState(null);
  const [recentBatteries, setRecentBatteries] = useState([]);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsData, batteriesData, alertsData] = await Promise.all([
        api.getDashboardStats(),
        api.getBatteries(),
        api.getAlerts()
      ]);
      setStats(statsData);
      setRecentBatteries(batteriesData.slice(0, 6));
      setRecentAlerts(alertsData.slice(0, 4));
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading && !stats) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', gap: '12px', color: '#00f2fe' }}>
        <RefreshCw size={24} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
        <span>Loading Battery Intelligence Fleet Data...</span>
      </div>
    );
  }

  // Formatting for Category bar chart
  const categoryData = stats?.category_counts ? Object.entries(stats.category_counts).map(([name, count]) => ({
    name: name.replace('Electric ', 'E-'),
    fullName: name,
    count
  })) : [];

  // Chemistry Pie Chart
  const chemistryData = stats?.chemistry_counts ? Object.entries(stats.chemistry_counts).map(([chem, count]) => ({
    name: chem,
    value: count
  })) : [];
  const CHEM_COLORS = ['#00f2fe', '#0070f3', '#7928ca', '#10b981'];

  // Health distribution
  const healthDistData = stats?.fleet_health_distribution ? Object.entries(stats.fleet_health_distribution).map(([range, count]) => ({
    range,
    count
  })) : [];
  const hasBatteries = (stats?.total_batteries ?? 0) > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '26px' }}>
      {/* Top Metric Cards */}
      <div className="grid-cols-4">
        {/* Card 1: Total Batteries */}
        <div className="glass-card" style={{ borderLeft: '4px solid #00f2fe' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>Total Monitored Packs</p>
              <h2 style={{ fontSize: '32px', fontWeight: 800, marginTop: '4px', letterSpacing: '-0.5px' }}>
                {stats?.total_batteries ?? 0}
              </h2>
            </div>
            <div style={{ 
              background: 'rgba(0, 242, 254, 0.1)', 
              padding: '10px', 
              borderRadius: '10px',
              border: '1px solid rgba(0, 242, 254, 0.25)' 
            }}>
              <BatteryCharging size={24} color="#00f2fe" />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '14px', fontSize: '12.5px', color: '#38bdf8' }}>
            <span>Across 5 Universal EV Segments</span>
          </div>
        </div>

        {/* Card 2: Average SOH */}
        <div className="glass-card" style={{ borderLeft: '4px solid #10b981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>Fleet Average SOH</p>
              <h2 style={{ fontSize: '32px', fontWeight: 800, marginTop: '4px', color: '#10b981', letterSpacing: '-0.5px' }}>
                {hasBatteries ? `${stats.average_soh}%` : '--'}
              </h2>
            </div>
            <div style={{ 
              background: 'rgba(16, 185, 129, 0.1)', 
              padding: '10px', 
              borderRadius: '10px',
              border: '1px solid rgba(16, 185, 129, 0.25)' 
            }}>
              <TrendingUp size={24} color="#10b981" />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '14px', fontSize: '12.5px', color: '#94a3b8' }}>
            <span>Normal Packs: {stats?.normal_count || 0} ({stats?.total_batteries ? Math.round((stats.normal_count / stats.total_batteries) * 100) : 0}%)</span>
          </div>
        </div>

        {/* Card 3: Warning Count */}
        <div className="glass-card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>Warning Status</p>
              <h2 style={{ fontSize: '32px', fontWeight: 800, marginTop: '4px', color: '#f59e0b', letterSpacing: '-0.5px' }}>
                {stats?.warning_count || 0}
              </h2>
            </div>
            <div style={{ 
              background: 'rgba(245, 158, 11, 0.1)', 
              padding: '10px', 
              borderRadius: '10px',
              border: '1px solid rgba(245, 158, 11, 0.25)' 
            }}>
              <AlertTriangle size={24} color="#f59e0b" />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '14px', fontSize: '12.5px', color: '#f59e0b' }}>
            <span>Requires Preventive Balancing</span>
          </div>
        </div>

        {/* Card 4: Critical Alerts */}
        <div className="glass-card" style={{ borderLeft: '4px solid #ef4444' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>Critical Alerts</p>
              <h2 style={{ fontSize: '32px', fontWeight: 800, marginTop: '4px', color: '#ef4444', letterSpacing: '-0.5px' }}>
                {stats?.critical_count || 0}
              </h2>
            </div>
            <div style={{ 
              background: 'rgba(239, 68, 68, 0.12)', 
              padding: '10px', 
              borderRadius: '10px',
              border: '1px solid rgba(239, 68, 68, 0.3)' 
            }}>
              <ShieldAlert size={24} color="#ef4444" />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '14px', fontSize: '12.5px', color: '#f87171' }}>
            <span>Immediate Depot Inspection Needed</span>
          </div>
        </div>
      </div>

      {/* Charts Section: Category Distribution & Health Distribution */}
      <div className="grid-cols-2">
        {/* EV Category Breakdown */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f1f5f9' }}>Fleet by EV Vehicle Category</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Universal coverage from Micro-mobility to Heavy Trucks</p>
            </div>
            <span className="badge badge-cyan">5 Categories</span>
          </div>
          <div style={{ height: '240px', width: '100%' }}>
            {!hasBatteries ? (
              <div style={{ height: '100%', display: 'grid', placeItems: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                No battery data yet. Register a battery pack to see fleet statistics.
              </div>
            ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} interval={0} angle={-15} textAnchor="end" />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip 
                  contentStyle={{ background: '#0b1329', border: '1px solid #00f2fe', borderRadius: '8px', color: '#fff' }}
                  formatter={(val, name, item) => [val + ' Packs', item.payload.fullName]}
                />
                <Bar dataKey="count" fill="#0070f3" radius={[6, 6, 0, 0]}>
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#00f2fe' : '#0070f3'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Health Bracket Distribution & Chemistry */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f1f5f9' }}>State of Health (SOH) Tier Spread</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Packs grouped by remaining capacity tiers</p>
            </div>
            <span className="badge badge-normal">Health Index</span>
          </div>
            <div style={{ height: '240px', display: 'flex', alignItems: 'center' }}>
              {!hasBatteries ? (
                <div style={{ width: '100%', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                  SOH and chemistry charts will appear after you add batteries.
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center', height: '100%', width: '100%' }}>
                  <div style={{ flex: 1, height: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={healthDistData} layout="vertical" margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                        <XAxis type="number" stroke="#64748b" fontSize={11} />
                        <YAxis type="category" dataKey="range" stroke="#94a3b8" fontSize={12} width={70} />
                        <Tooltip contentStyle={{ background: '#0b1329', border: '1px solid #10b981', borderRadius: '8px' }} />
                        <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                          <Cell fill="#10b981" />
                          <Cell fill="#00f2fe" />
                          <Cell fill="#f59e0b" />
                          <Cell fill="#ef4444" />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div style={{ width: '130px', textAlign: 'center' }}>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Chemistry Mix</p>
                    <div style={{ height: '120px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={chemistryData} dataKey="value" nameKey="name" innerRadius={28} outerRadius={46} paddingAngle={4}>
                            {chemistryData.map((entry, index) => (
                              <Cell key={`chem-${index}`} fill={CHEM_COLORS[index % CHEM_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ background: '#0b1329', border: '1px solid #38bdf8', borderRadius: '8px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center', marginTop: '6px' }}>
                      {chemistryData.map((c, i) => (
                        <span key={c.name} style={{ fontSize: '10px', color: CHEM_COLORS[i % CHEM_COLORS.length] }}>
                          {c.name}: {c.value}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
        </div>
      </div>

      {/* Bottom Section: Active Alerts & Featured Batteries */}
      <div className="grid-cols-2">
        {/* Active Critical & Warning Alerts */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f1f5f9' }}>Real-time Safety Warnings</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Actionable alerts generated by BMS threshold & AI</p>
            </div>
            <button 
              onClick={() => setActiveTab('alerts')}
              style={{ background: 'transparent', border: 'none', color: '#00f2fe', fontSize: '12.5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              View All <ArrowRight size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {recentAlerts.length === 0 ? (
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>No active safety warnings</p>
            ) : (
              recentAlerts.map(alert => (
                <div 
                  key={alert.id}
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span className={`badge ${alert.severity === 'Critical' ? 'badge-critical' : 'badge-warning'}`}>
                      {alert.severity}
                    </span>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#f1f5f9' }}>
                        {alert.battery_code} • {alert.alert_type}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {alert.message}
                      </div>
                    </div>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
                    {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Key Monitored Battery Packs */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f1f5f9' }}>Fleet Battery Packs Status</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Quick health status and cycle count overview</p>
            </div>
            <button 
              onClick={() => setActiveTab('monitoring')}
              style={{ background: 'transparent', border: 'none', color: '#00f2fe', fontSize: '12.5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              All Packs <ArrowRight size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {recentBatteries.length === 0 ? (
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>
                No battery packs registered yet. Use Battery Monitoring to add your first pack.
              </p>
            ) : recentBatteries.map(battery => (
              <div 
                key={battery.id}
                onClick={() => {
                  setSelectedBatteryId(battery.id);
                  setActiveTab('details');
                }}
                className="glass-card-interactive"
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#f1f5f9' }}>{battery.battery_code}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>• {battery.vehicle_category}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {battery.model_name} ({battery.nominal_capacity_ah}Ah, {battery.nominal_voltage}V)
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ 
                      fontSize: '14px', 
                      fontWeight: 700, 
                      color: battery.current_soh >= 90 ? '#10b981' : (battery.current_soh >= 80 ? '#f59e0b' : '#ef4444') 
                    }}>
                      {battery.current_soh}% SOH
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{battery.cycle_count} cycles</div>
                  </div>
                  <span className={`badge ${battery.status === 'Normal' ? 'badge-normal' : (battery.status === 'Warning' ? 'badge-warning' : 'badge-critical')}`}>
                    {battery.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
