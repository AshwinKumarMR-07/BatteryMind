import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import BatteryMonitoring from './pages/BatteryMonitoring';
import BatteryDetails from './pages/BatteryDetails';
import AIAnalysis from './pages/AIAnalysis';
import Alerts from './pages/Alerts';
import DataUpload from './pages/DataUpload';
import Settings from './pages/Settings';
import UserManagement from './pages/UserManagement';
import DeviceManagement from './pages/DeviceManagement';
import MyProfile from './pages/MyProfile';
import { api } from './api';

export default function App() {
  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('batterymind_user'));
    } catch {
      return null;
    }
  });
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [authView, setAuthView] = useState('login');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [registration, setRegistration] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showRegistrationPassword, setShowRegistrationPassword] = useState(false);
  const [registerError, setRegisterError] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState('');
  const [registering, setRegistering] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [profileSection, setProfileSection] = useState('profile');
  const [selectedBatteryId, setSelectedBatteryId] = useState(null);
  const [alertCount, setAlertCount] = useState(0);

  const refreshAlertCount = async () => {
    try {
      const activeAlerts = await api.getAlerts('All', 'Active');
      setAlertCount(activeAlerts.length);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const validateSession = async () => {
      if (!localStorage.getItem('batterymind_token')) {
        setAuthLoading(false);
        return;
      }
      try {
        const me = await api.getMe();
        setUser(me);
        localStorage.setItem('batterymind_user', JSON.stringify(me));
      } catch {
        await api.logout();
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    };
    validateSession();
  }, []);

  useEffect(() => {
    if (!user) return;
    refreshAlertCount();
    api.getBatteries().then((batteries) => {
      setSelectedBatteryId((current) =>
        batteries.some((battery) => battery.id === current) ? current : (batteries[0]?.id ?? null)
      );
    }).catch((err) => console.error('Failed to load user batteries:', err));
    const interval = setInterval(refreshAlertCount, 15000);
    return () => clearInterval(interval);
  }, [user]);

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoggingIn(true);
    setLoginError('');
    try {
      const result = await api.login(loginUsername, loginPassword);
      localStorage.setItem('batterymind_token', result.access_token);
      localStorage.setItem('batterymind_user', JSON.stringify(result.user));
      setUser(result.user);
      setLoginUsername('');
      setLoginPassword('');
      setShowLoginPassword(false);
    } catch (err) {
      setLoginError(err.message);
    } finally {
      setLoggingIn(false);
    }
  };

  const handleRegistration = async (event) => {
    event.preventDefault();
    setRegisterError('');
    setRegisterSuccess('');
    if (registration.password !== registration.confirmPassword) {
      setRegisterError('Passwords do not match.');
      return;
    }
    if (registration.password.length < 8) {
      setRegisterError('Password must contain at least 8 characters.');
      return;
    }
    setRegistering(true);
    try {
      await api.register({
        full_name: registration.fullName.trim(),
        username: registration.username.trim(),
        email: registration.email.trim(),
        password: registration.password,
        confirm_password: registration.confirmPassword
      });
      setRegisterSuccess('Account created successfully. You can now sign in.');
      setRegistration({ fullName: '', username: '', email: '', password: '', confirmPassword: '' });
    } catch (err) {
      setRegisterError(err.message);
    } finally {
      setRegistering(false);
    }
  };

  const handleLogout = async () => {
    await api.logout();
    setUser(null);
    setSelectedBatteryId(null);
    setActiveTab('dashboard');
    setLoginUsername('');
    setLoginPassword('');
    setShowLoginPassword(false);
    setLoginError('');
  };

  const navigateToProfile = (section) => {
    setProfileSection(section);
    setActiveTab('profile');
  };

  const handleProfileUpdated = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('batterymind_user', JSON.stringify(updatedUser));
  };

  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#070d1e', color: '#00f2fe' }}>
        Loading BatteryMind...
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#070d1e', padding: '20px' }}>
        {authView === 'login' ? (
        <form onSubmit={handleLogin} className="glass-card" style={{ width: 'min(420px, 100%)', padding: '28px' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <h1 style={{ color: '#00f2fe', marginBottom: '6px' }}>Battery<span style={{ color: '#fff' }}>Mind</span></h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Secure EV Battery Intelligence Platform</p>
          </div>
          {loginError && (
            <div role="alert" style={{ color: '#f87171', border: '1px solid rgba(248,113,113,.35)', borderRadius: '8px', padding: '10px', marginBottom: '14px', background: 'rgba(248,113,113,.08)', fontSize: '13px' }}>
              {loginError}
            </div>
          )}
          <label style={{ display: 'block', marginBottom: '12px', color: 'var(--text-muted)', fontSize: '12px' }}>
            Username
            <input autoComplete="username" value={loginUsername} onChange={(e) => setLoginUsername(e.target.value)} required style={{ width: '100%', marginTop: '6px' }} />
          </label>
          <label style={{ display: 'block', marginBottom: '18px', color: 'var(--text-muted)', fontSize: '12px' }}>
            Password
            <div style={{ position: 'relative', marginTop: '6px' }}>
              <input type={showLoginPassword ? 'text' : 'password'} autoComplete="current-password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required style={{ width: '100%', paddingRight: '76px' }} />
              <button type="button" onClick={() => setShowLoginPassword((shown) => !shown)} style={{ position: 'absolute', right: '8px', top: '8px', background: 'transparent', border: 'none', color: '#00f2fe', cursor: 'pointer', fontSize: '11px' }}>
                {showLoginPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </label>
          <button type="submit" className="btn-primary" disabled={loggingIn} style={{ width: '100%', justifyContent: 'center' }}>
            {loggingIn ? 'Signing in...' : 'Sign in'}
          </button>
          <button type="button" onClick={() => { setAuthView('register'); setLoginError(''); setRegisterError(''); setRegisterSuccess(''); }} style={{ width: '100%', marginTop: '12px', background: 'transparent', border: 'none', color: '#00f2fe', cursor: 'pointer', fontSize: '13px' }}>
            Create Account
          </button>
        </form>
        ) : (
        <form onSubmit={handleRegistration} className="glass-card" style={{ width: 'min(480px, 100%)', padding: '28px' }}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <h1 style={{ color: '#00f2fe', marginBottom: '6px' }}>Create Account</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Register for BatteryMind Viewer access</p>
          </div>
          {registerError && <div role="alert" style={{ color: '#f87171', border: '1px solid rgba(248,113,113,.35)', borderRadius: '8px', padding: '10px', marginBottom: '12px', background: 'rgba(248,113,113,.08)', fontSize: '13px' }}>{registerError}</div>}
          {registerSuccess && <div role="status" style={{ color: '#34d399', border: '1px solid rgba(52,211,153,.35)', borderRadius: '8px', padding: '10px', marginBottom: '12px', background: 'rgba(52,211,153,.08)', fontSize: '13px' }}>{registerSuccess}</div>}
          {[
            ['Full Name', 'fullName', 'text', 'name'],
            ['Username', 'username', 'text', 'username'],
            ['Email Address', 'email', 'email', 'email']
          ].map(([label, field, type, autocomplete]) => (
            <label key={field} style={{ display: 'block', marginBottom: '10px', color: 'var(--text-muted)', fontSize: '12px' }}>
              {label}
              <input type={type} autoComplete={autocomplete} value={registration[field]} onChange={(e) => setRegistration({ ...registration, [field]: e.target.value })} required style={{ width: '100%', marginTop: '5px' }} />
            </label>
          ))}
          {[
            ['Password', 'password'],
            ['Confirm Password', 'confirmPassword']
          ].map(([label, field]) => (
            <label key={field} style={{ display: 'block', marginBottom: '10px', color: 'var(--text-muted)', fontSize: '12px' }}>
              {label}
              <div style={{ position: 'relative', marginTop: '5px' }}>
                <input type={showRegistrationPassword ? 'text' : 'password'} autoComplete="new-password" value={registration[field]} onChange={(e) => setRegistration({ ...registration, [field]: e.target.value })} required minLength={8} style={{ width: '100%', paddingRight: '76px' }} />
              </div>
            </label>
          ))}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-42px', marginBottom: '18px', position: 'relative', zIndex: 2 }}>
            <button type="button" onClick={() => setShowRegistrationPassword((shown) => !shown)} style={{ background: 'transparent', border: 'none', color: '#00f2fe', cursor: 'pointer', fontSize: '11px' }}>
              {showRegistrationPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          <button type="submit" className="btn-primary" disabled={registering} style={{ width: '100%', justifyContent: 'center' }}>
            {registering ? 'Creating Account...' : 'Create Account'}
          </button>
          <button type="button" onClick={() => { setAuthView('login'); setRegisterError(''); setRegisterSuccess(''); }} style={{ width: '100%', marginTop: '12px', background: 'transparent', border: 'none', color: '#00f2fe', cursor: 'pointer', fontSize: '13px' }}>
            Back to Sign In
          </button>
        </form>
        )}
      </div>
    );
  }

  return (
    <div className="app-layout">
      {/* Fixed Left Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        alertCount={alertCount}
        user={user}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="main-content">
        <Navbar 
          activeTab={activeTab} 
          selectedBatteryId={selectedBatteryId}
          onSimulateSuccess={refreshAlertCount}
          user={user}
          onLogout={handleLogout}
          onProfileNavigate={navigateToProfile}
        />

        <main className="content-body">
          {activeTab === 'dashboard' && (
            <Dashboard 
              setActiveTab={setActiveTab} 
              setSelectedBatteryId={setSelectedBatteryId} 
            />
          )}

          {activeTab === 'monitoring' && (
            <BatteryMonitoring 
              setActiveTab={setActiveTab} 
              setSelectedBatteryId={setSelectedBatteryId} 
            />
          )}

          {activeTab === 'details' && (
            <BatteryDetails 
              selectedBatteryId={selectedBatteryId} 
              setSelectedBatteryId={setSelectedBatteryId}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'ai-analysis' && (
            <AIAnalysis 
              selectedBatteryId={selectedBatteryId} 
              setSelectedBatteryId={setSelectedBatteryId}
            />
          )}

          {activeTab === 'alerts' && (
            <Alerts 
              setActiveTab={setActiveTab} 
              setSelectedBatteryId={setSelectedBatteryId} 
            />
          )}

          {activeTab === 'data-upload' && (
            <DataUpload 
              setActiveTab={setActiveTab} 
            />
          )}

          {activeTab === 'settings' && (
            <Settings />
          )}
          {activeTab === 'devices' && (
            <DeviceManagement />
          )}
          {activeTab === 'users' && user.role === 'Admin' && (
            <UserManagement />
          )}
          {activeTab === 'profile' && (
            <MyProfile user={user} initialSection={profileSection} onProfileUpdated={handleProfileUpdated} />
          )}
        </main>
      </div>
    </div>
  );
}
