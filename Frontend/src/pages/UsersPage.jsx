import { useState, useEffect } from 'react';
import { FaMagnifyingGlass } from 'react-icons/fa6';
import api from '../services/api';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'driver',
    phone: '',
    status: 'active',
  });

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/auth/users');
      setUsers(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleOpenAdd = () => {
    setFormData({ name: '', email: '', password: '', role: 'driver', phone: '', status: 'active' });
    setIsEditing(false);
    setShowModal(true);
  };

  const handleOpenEdit = (u) => {
    setFormData({
      name: u.name || '',
      email: u.email || '',
      password: '',
      role: u.role || 'driver',
      phone: u.phone || '',
      status: u.status || 'active',
    });
    setCurrentId(u._id);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (isEditing) {
        const payload = {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          phone: formData.phone,
          status: formData.status,
        };
        await api.put(`/auth/users/${currentId}`, payload);
        setSuccess('User updated successfully');
      } else {
        if (!formData.password || formData.password.length < 6) {
          setError('Password must be at least 6 characters');
          return;
        }
        await api.post('/auth/users', formData);
        setSuccess('User created successfully');
      }
      setShowModal(false);
      loadUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.delete(`/auth/users/${id}`);
      setSuccess('User deleted successfully');
      loadUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const filteredUsers = users.filter((u) => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return true;
    return [u.name, u.email, u.role, u.phone, u.status]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query));
  });

  const roleBadge = (role) => {
    const styles = {
      admin: 'bg-rose-950/40 text-rose-500 border-rose-900/40',
      driver: 'bg-blue-950/40 text-blue-400 border-blue-900/40',
      mechanic: 'bg-emerald-950/40 text-emerald-500 border-emerald-900/40',
      dispatcher: 'bg-amber-950/40 text-amber-500 border-amber-900/40',
    };
    return (
      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${styles[role] || styles.driver}`}>
        {role}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-zinc-400 text-sm">Create, update, and manage user accounts and role assignments.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors cursor-pointer text-sm"
        >
          + Add User
        </button>
      </div>

      {error && <div className="bg-red-950/40 border border-red-800/40 text-red-500 p-4 rounded-lg text-sm">{error}</div>}
      {success && <div className="bg-emerald-950/40 border border-emerald-800/40 text-black p-4 rounded-lg text-sm">{success}</div>}

      <div className="relative rounded-lg border border-slate-200 bg-white shadow-sm">
        <FaMagnifyingGlass className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search by name, email, role, phone, status..."
          className="w-full rounded-lg bg-transparent py-3 pl-11 pr-4 text-sm focus:outline-none"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-zinc-400 text-sm">Loading user directory...</div>
      ) : (
        <div className="overflow-x-auto bg-zinc-900/40 border border-zinc-800 rounded-xl">
          <table className="w-full min-w-[1000px] text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400 text-xs font-semibold uppercase tracking-wider bg-zinc-900/80">
                <th className="p-4">Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Phone</th>
                <th className="p-4">Role</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-850 text-sm">
              {filteredUsers.map((u) => (
                <tr key={u._id} className="hover:bg-zinc-900/30 transition-colors">
                  <td className="p-4 font-semibold text-zinc-200">{u.name}</td>
                  <td className="p-4 text-zinc-400">{u.email}</td>
                  <td className="p-4 text-zinc-400">{u.phone || 'N/A'}</td>
                  <td className="p-4">{roleBadge(u.role)}</td>
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                        u.status === 'active'
                          ? 'bg-emerald-950/40 text-emerald-500 border-emerald-900/40'
                          : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                      }`}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button
                      onClick={() => handleOpenEdit(u)}
                      className="text-zinc-300 hover:text-black font-semibold text-xs border border-zinc-700 hover:border-emerald-500/40 rounded px-2.5 py-1 transition-colors cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(u._id)}
                      className="text-red-400 hover:text-red-300 font-semibold text-xs border border-zinc-750 hover:border-red-900/40 rounded px-2.5 py-1 transition-colors cursor-pointer"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-zinc-500 italic">
                    {users.length === 0 ? 'No users found.' : 'No users match your search.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-6">
            <div>
              <h3 className="text-xl font-bold">{isEditing ? 'Edit User' : 'Create New User'}</h3>
              <p className="text-zinc-400 text-xs mt-1">{isEditing ? 'Update role, status, or contact details.' : 'Create a driver, mechanic, or dispatcher account.'}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="User's full name"
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 p-2.5 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={isEditing}
                  placeholder="user@example.com"
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 p-2.5 text-sm focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                />
              </div>

              {!isEditing && (
                <div>
                  <label className="block text-sm font-medium mb-1">Password</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength={6}
                    placeholder="Minimum 6 characters"
                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 p-2.5 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Role</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 p-2.5 text-sm focus:outline-none focus:border-emerald-500"
                  >
                    <option value="driver">Driver</option>
                    <option value="mechanic">Mechanic</option>
                    <option value="dispatcher">Dispatcher</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 p-2.5 text-sm focus:outline-none focus:border-emerald-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+91 98765 00000"
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 p-2.5 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-zinc-850 hover:bg-zinc-800 text-sm font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  {isEditing ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
