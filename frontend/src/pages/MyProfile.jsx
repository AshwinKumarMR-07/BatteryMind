import React, { useEffect, useState } from 'react';
import { UserRound, Save, KeyRound } from 'lucide-react';
import { api } from '../api';

export default function MyProfile({ user, initialSection = 'profile', onProfileUpdated }) {
  const [section, setSection] = useState(initialSection);
  const [fullName, setFullName] = useState(user.full_name || '');
  const [email, setEmail] = useState(user.email || '');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [passwords, setPasswords] = useState({
    current_password: '',
    new_password: '',
    confirm_new_password: ''
  });

  useEffect(() => {
    setSection(initialSection);
    setEditing(false);
  }, [initialSection]);

  const saveProfile = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setSaving(true);
    try {
      const updated = await api.updateProfile({ full_name: fullName.trim(), email: email.trim() });
      onProfileUpdated(updated);
      setFullName(updated.full_name);
      setEmail(updated.email || '');
      setEditing(false);
      setMessage('Profile updated successfully.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    if (passwords.new_password !== passwords.confirm_new_password) {
      setError('New passwords do not match.');
      return;
    }
    if (passwords.new_password.length < 8) {
      setError('New password must contain at least 8 characters.');
      return;
    }
    setSaving(true);
    try {
      const result = await api.changePassword(passwords);
      setMessage(result.message);
      setPasswords({ current_password: '', new_password: '', confirm_new_password: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const initial = (user.full_name || user.username || '?')
    .split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '900px' }}>
      <div className="glass-card">
        <h2 style={{ color: '#f1f5f9', fontSize: '20px', marginBottom: '6px' }}>
          {section === 'password' ? 'Change Password' : section === 'settings' ? 'Account Settings' : 'My Profile'}
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Manage your BatteryMind account information and security.</p>
        <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
          {[['profile', 'My Profile'], ['settings', 'Account Settings'], ['password', 'Change Password']].map(([value, label]) => (
            <button key={value} className={section === value ? 'btn-primary' : 'btn-secondary'} onClick={() => { setSection(value); setError(''); setMessage(''); }}>
              {value === 'password' && <KeyRound size={15} />} {label}
            </button>
          ))}
        </div>
      </div>

      {message && <div role="status" style={{ color: '#34d399', fontSize: '13px' }}>{message}</div>}
      {error && <div role="alert" style={{ color: '#f87171', fontSize: '13px' }}>{error}</div>}

      {section === 'profile' && (
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px', marginBottom: '22px' }}>
            <div aria-label={`${user.full_name} initials`} style={{ width: '68px', height: '68px', borderRadius: '50%', display: 'grid', placeItems: 'center', color: '#06101e', fontSize: '22px', fontWeight: 800, background: 'linear-gradient(135deg, #00f2fe, #0070f3)' }}>
              {initial || <UserRound />}
            </div>
            <div>
              <h3 style={{ color: '#f1f5f9', fontSize: '18px' }}>{user.full_name}</h3>
              <span className="badge badge-cyan">{user.role}</span>
            </div>
          </div>
          <div className="grid-cols-2" style={{ display: 'grid', gap: '16px' }}>
            {[['Full Name', user.full_name], ['Username', user.username], ['Email Address', user.email || 'Not set'], ['Account Role', user.role], ['Account Created', user.created_at ? new Date(user.created_at).toLocaleString() : 'Not available']].map(([label, value]) => (
              <div key={label} style={{ padding: '12px', border: '1px solid var(--border-subtle)', borderRadius: '8px', background: 'rgba(9,17,38,.45)' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginBottom: '5px' }}>{label}</div>
                <div style={{ color: '#f1f5f9', fontSize: '14px' }}>{value}</div>
              </div>
            ))}
          </div>
          <button className="btn-primary" style={{ marginTop: '18px' }} onClick={() => { setSection('settings'); setEditing(true); }}>
            <Save size={15} /> Edit Profile
          </button>
        </div>
      )}

      {section === 'settings' && (
        <div className="glass-card">
          <h3 style={{ color: '#f1f5f9', marginBottom: '16px' }}>Account Settings</h3>
          <form onSubmit={saveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '520px' }}>
            <label style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
              Full Name
              <input value={fullName} onChange={(event) => setFullName(event.target.value)} required minLength={2} maxLength={200} disabled={!editing} style={{ display: 'block', width: '100%', marginTop: '6px' }} />
            </label>
            <label style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
              Email Address
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required maxLength={255} disabled={!editing} style={{ display: 'block', width: '100%', marginTop: '6px' }} />
            </label>
            {editing ? (
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn-primary" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Profile'}</button>
                <button className="btn-secondary" type="button" onClick={() => { setEditing(false); setFullName(user.full_name); setEmail(user.email || ''); }}>Cancel</button>
              </div>
            ) : (
              <button className="btn-primary" type="button" onClick={() => setEditing(true)}>Edit Profile</button>
            )}
          </form>
        </div>
      )}

      {section === 'password' && (
        <div className="glass-card">
          <h3 style={{ color: '#f1f5f9', marginBottom: '16px' }}>Change Password</h3>
          <form onSubmit={changePassword} style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '520px' }}>
            {[
              ['Current Password', 'current_password', 'current-password'],
              ['New Password', 'new_password', 'new-password'],
              ['Confirm New Password', 'confirm_new_password', 'new-password']
            ].map(([label, key, autocomplete]) => (
              <label key={key} style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                {label}
                <input type="password" autoComplete={autocomplete} value={passwords[key]} onChange={(event) => setPasswords({ ...passwords, [key]: event.target.value })} required minLength={8} style={{ display: 'block', width: '100%', marginTop: '6px' }} />
              </label>
            ))}
            <button className="btn-primary" type="submit" disabled={saving}>{saving ? 'Updating...' : 'Update Password'}</button>
          </form>
        </div>
      )}
    </div>
  );
}
