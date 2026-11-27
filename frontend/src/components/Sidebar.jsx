import React from 'react';
import { 
  LayoutDashboard, 
  Activity, 
  BatteryCharging, 
  Cpu, 
  AlertTriangle, 
  UploadCloud, 
  Settings, 
  ShieldCheck,
  Users,
  Zap,
  Radio
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, alertCount = 0, user, onLogout }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'monitoring', label: 'Battery Monitoring', icon: Activity },
    { id: 'devices', label: 'Device Management', icon: Radio },
    { id: 'details', label: 'Battery Details', icon: BatteryCharging },
    { id: 'ai-analysis', label: 'AI Analysis', icon: Cpu, badge: 'ML v2' },
    { id: 'alerts', label: 'Alerts', icon: AlertTriangle, count: alertCount },
    { id: 'data-upload', label: 'Data Upload', icon: UploadCloud },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'users', label: 'User Management', icon: Users },
  ];
  const visibleNavItems = navItems.filter((item) => {
    if (item.id === 'settings' || item.id === 'data-upload') return user?.role !== 'Viewer';
    if (item.id === 'users') return user?.role === 'Admin';
    return true;
  });

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div style={{
        padding: '24px 20px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #0070f3 0%, #00f2fe 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 15px rgba(0, 242, 254, 0.4)'
        }}>
          <Zap size={22} color="#050a17" strokeWidth={2.5} />
        </div>
        <div className="sidebar-text">
          <div style={{ fontWeight: 800, fontSize: '17px', letterSpacing: '-0.3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            Battery<span style={{ color: '#00f2fe' }}>Mind</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            EV Battery Intelligence
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <nav style={{ padding: '18px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '12px 14px',
                borderRadius: '10px',
                border: isActive ? '1px solid rgba(0, 242, 254, 0.4)' : '1px solid transparent',
                background: isActive 
                  ? 'linear-gradient(90deg, rgba(0, 112, 243, 0.25) 0%, rgba(0, 242, 254, 0.08) 100%)' 
                  : 'transparent',
                color: isActive ? '#00f2fe' : 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textAlign: 'left',
                boxShadow: isActive ? '0 0 16px rgba(0, 242, 254, 0.12)' : 'none'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                  e.currentTarget.style.color = '#fff';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-muted)';
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Icon size={19} color={isActive ? '#00f2fe' : 'currentColor'} />
                <span className="sidebar-text" style={{ fontSize: '13.5px', fontWeight: isActive ? 600 : 500 }}>
                  {item.label}
                </span>
              </div>

              {item.badge && (
                <span className="sidebar-text" style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: '12px',
                  background: 'rgba(0, 242, 254, 0.15)',
                  color: '#00f2fe',
                  border: '1px solid rgba(0, 242, 254, 0.3)'
                }}>
                  {item.badge}
                </span>
              )}

              {item.count > 0 && (
                <span className="sidebar-text" style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 7px',
                  borderRadius: '12px',
                  background: 'rgba(239, 68, 68, 0.2)',
                  color: '#f87171',
                  border: '1px solid rgba(239, 68, 68, 0.4)'
                }}>
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* System Status Footer */}
      <div style={{
        padding: '16px',
        margin: '12px',
        borderRadius: '10px',
        background: 'rgba(15, 26, 56, 0.6)',
        border: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <div style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: '#10b981',
          boxShadow: '0 0 10px #10b981'
        }} />
        <div className="sidebar-text" style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
          <div style={{ fontWeight: 600, color: '#f1f5f9' }}>Inference Engine Online</div>
          <div>FastAPI • SQLite • scikit-learn</div>
        </div>
      </div>
    </aside>
  );
}
