import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaCarSide, FaEnvelope, FaLock } from 'react-icons/fa6';
import useAuth from '../../hooks/useAuth';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await login(formData.email, formData.password);
      navigate(res.data.user.role === 'admin' ? '/dashboard/admin' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8 text-slate-950">
      <main className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
        <div className="mb-7 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-600 text-white">
            <FaCarSide className="h-5 w-5" />
          </div>
          <p className="mt-4 text-sm font-semibold uppercase text-emerald-700">FleetMaster</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">Login</h1>
          <p className="mt-2 text-sm text-slate-500">Access your fleet workspace.</p>
        </div>

        {error && <p className="mb-5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Email</label>
            <div className="relative">
              <FaEnvelope className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Password</label>
            <div className="relative">
              <FaLock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter password"
                className="w-full rounded-lg border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <button type="submit" className="w-full rounded-lg bg-emerald-600 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-700">
            Log In
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          New driver? <Link to="/register" className="font-semibold text-emerald-700 hover:text-emerald-800">Create driver account</Link>
        </p>
      </main>
    </div>
  );
}
