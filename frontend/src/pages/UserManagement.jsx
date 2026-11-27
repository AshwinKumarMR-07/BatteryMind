import React, { useEffect, useState } from 'react';
import { RefreshCw, ShieldCheck, Trash2 } from 'lucide-react';
import { api } from '../api';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const currentUser = (() => {
    try { return JSON.parse(localStorage.getItem('batterymind_user')); } catch { return null; }
  })();

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      setUsers(await api.getUsers());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const updateUser = async (id, payload) => {
    setMessage('');
    setError('');
    try {
      const updated = await api.updateUser(id, payload);
      setUsers((items) => items.map((item) => item.id === id ? updated : item));
      setMessage('User updated successfully.');
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteUser = async (user) => {
    if (!window.confirm(`Delete account "${user.username}"? This cannot be undone.`)) return;
    setMessage('');
    setError('');
    try {
      await api.deleteUser(user.id);
      setUsers((items) => items.filter((item) => item.id !== user.id));
      setMessage('User deleted successfully.');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '18px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={20} color="#00f2fe" /> User Management
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Admin-only account and role administration</p>
          </div>
          <button className="btn-secondary" onClick={loadUsers} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {message && <div role="status" style={{ color: '#34d399', fontSize: '13px' }}>{message}</div>}
      {error && <div role="alert" style={{ color: '#f87171', fontSize: '13px' }}>{error}</div>}

      <div className="glass-card custom-table-container">
        <table className="custom-table">
          <thead>
            <tr><th>Full Name</th><th>Username</th><th>Email Address</th><th>Role</th><th>Status</th><th>Action</th></tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.full_name}</td>
                <td className="font-mono">{user.username}</td>
                <td>{user.email || 'Not set'}</td>
                <td>
                  <select
                    value={user.role}
                    disabled={user.id === currentUser?.id}
                    onChange={(event) => updateUser(user.id, { role: event.target.value })}
                  >
                    <option>Viewer</option><option>Operator</option><option>Admin</option>
                  </select>
                </td>
                <td>
                  <span className={user.is_active ? 'badge badge-normal' : 'badge badge-critical'}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  {user.id !== currentUser?.id && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn-secondary" onClick={() => updateUser(user.id, { is_active: !user.is_active })}>
                        {user.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button className="btn-secondary" onClick={() => deleteUser(user)} title="Delete account" style={{ color: '#f87171' }}>
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
