import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaCarSide, FaEnvelope, FaIdCard, FaLock, FaPhone, FaScrewdriverWrench, FaUser } from 'react-icons/fa6';
import useAuth from '../../hooks/useAuth';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'driver',
    phone: '',
    licenseNumber: '',
    experience: 0,
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const submissionData = {
      ...formData,
      role: formData.role,
      experience: Number(formData.experience),
    };

    try {
      await register(submissionData);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  const inputClass = 'w-full rounded-lg border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm focus:border-emerald-500 focus:outline-none';

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8 text-slate-950">
      <main className="w-full max-w-lg rounded-lg border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
        <div className="mb-7 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-600 text-white">
            <FaCarSide className="h-5 w-5" />
          </div>
          <p className="mt-4 text-sm font-semibold uppercase text-emerald-700">FleetMaster</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">Create Driver Account</h1>
          <p className="mt-2 text-sm text-slate-500">Create a driver or mechanic account. Admin is managed separately.</p>
        </div>

        {error && <p className="mb-5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Full Name</label>
            <div className="relative">
              <FaUser className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="Your full name"
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Phone</label>
              <div className="relative">
                <FaPhone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+91 98765 00000"
                  className={inputClass}
                />
              </div>
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
                placeholder="Minimum 6 characters"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Register as</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'driver' })}
                className={`rounded-lg border p-3 text-left transition-colors ${
                  formData.role === 'driver' ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <FaIdCard className="mb-2" />
                <span className="block text-sm font-bold">Driver</span>
                <span className="text-xs">Fleet driver</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'mechanic' })}
                className={`rounded-lg border p-3 text-left transition-colors ${
                  formData.role === 'mechanic' ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <FaScrewdriverWrench className="mb-2" />
                <span className="block text-sm font-bold">Mechanic</span>
                <span className="text-xs">Maintenance work</span>
              </button>
            </div>
          </div>

          {formData.role === 'driver' && (
            <div className="grid grid-cols-1 gap-4 rounded-lg border border-emerald-100 bg-emerald-50 p-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-emerald-800">License Number</label>
                <div className="relative">
                  <FaIdCard className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-500" />
                  <input
                    type="text"
                    name="licenseNumber"
                    required
                    value={formData.licenseNumber}
                    onChange={handleChange}
                    placeholder="DL-PB-2026-1001"
                    className="w-full rounded-lg border border-emerald-100 bg-white py-3 pl-10 pr-3 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-emerald-800">Years Experience</label>
                <input
                  type="number"
                  name="experience"
                  min="0"
                  required
                  value={formData.experience}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-emerald-100 bg-white p-3 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          <button type="submit" className="w-full rounded-lg bg-emerald-600 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-700">
            Create {formData.role === 'mechanic' ? 'Mechanic' : 'Driver'} Account
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already registered? <Link to="/login" className="font-semibold text-emerald-700 hover:text-emerald-800">Log in</Link>
        </p>
      </main>
    </div>
  );
}
