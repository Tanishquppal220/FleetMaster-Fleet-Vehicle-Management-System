import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaCalendarCheck,
  FaCamera,
  FaCircleCheck,
  FaGasPump,
  FaIdCard,
  FaLocationArrow,
  FaPen,
  FaScrewdriverWrench,
  FaUser,
} from 'react-icons/fa6';
import useAuth from '../hooks/useAuth';
import api from '../services/api';
import driverService from '../services/driverService';
import expenseService from '../services/expenseService';
import maintenanceService from '../services/maintenanceService';
import uploadService from '../services/uploadService';

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const totalExpense = (expense) => Number(expense?.fuelCost || 0) + Number(expense?.miscExpense || 0);

function SummaryTile({ icon: Icon, title, value, note, tone = 'emerald' }) {
  const tones = {
    emerald: 'bg-emerald-50 text-emerald-700',
    blue: 'bg-blue-50 text-blue-700',
    amber: 'bg-amber-50 text-amber-700',
  };

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
        </div>
        <div className={`rounded-lg p-2 ${tones[tone]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-3 text-sm text-slate-500">{note}</p>
    </section>
  );
}

function EmptyState({ message }) {
  return <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">{message}</p>;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState({
    name: '',
    phone: '',
    address: '',
    avatar: '',
    driverProfile: null,
  });
  const [activity, setActivity] = useState({
    maintenance: [],
    expenses: [],
  });
  const [isEditing, setIsEditing] = useState(false);
  const [licenseUploading, setLicenseUploading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      const profileResponse = await api.get('/auth/me');
      const userData = profileResponse.data.data.user;

      setProfile({
        name: userData.name || '',
        phone: userData.phone || '',
        address: userData.address || '',
        avatar: userData.avatar || '',
        driverProfile: profileResponse.data.data.driverProfile || null,
      });

      if (user?.role === 'driver') {
        const [maintenance, expenses] = await Promise.all([
          maintenanceService.getMaintenanceRecords().catch(() => []),
          expenseService.getExpenses().catch(() => []),
        ]);

        setActivity({ maintenance, expenses });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load dashboard details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.role]);

  const insights = useMemo(() => {
    const openMaintenance = activity.maintenance.filter((item) => !['Completed', 'Cancelled'].includes(item.status));
    const expenseTotal = activity.expenses.reduce((sum, expense) => sum + totalExpense(expense), 0);
    const latestExpense = activity.expenses[0];

    return {
      openMaintenance,
      expenseTotal,
      latestExpense,
      assignedVehicle: profile.driverProfile?.assignedVehicle,
      driverStatus: profile.driverProfile?.status || 'Active',
      licenseNumber: profile.driverProfile?.licenseNumber || 'Not assigned',
      experience: profile.driverProfile?.experience ?? 0,
    };
  }, [activity, profile]);

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      setError('');
      setSuccess('');
      const res = await uploadService.uploadImage(file);
      setProfile((prev) => ({ ...prev, avatar: res.url }));
      setSuccess('Profile photo uploaded. Save profile to apply it.');
    } catch (err) {
      setError(err.response?.data?.message || 'Avatar upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await api.put('/auth/update-profile', {
        name: profile.name,
        phone: profile.phone,
        address: profile.address,
        avatar: profile.avatar,
      });
      setSuccess('Your profile was updated successfully.');
      setIsEditing(false);
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    }
  };

  const handleLicensePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !profile.driverProfile?._id) return;

    try {
      setLicenseUploading(true);
      setError('');
      setSuccess('');
      const uploadResult = await uploadService.uploadImage(file);
      const updatedDriver = await driverService.updateDriverStatus(profile.driverProfile._id, {
        licensePhoto: uploadResult.url,
      });
      setProfile((prev) => ({
        ...prev,
        driverProfile: updatedDriver,
      }));
      setSuccess('Driving license photo uploaded and saved.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload license photo');
    } finally {
      setLicenseUploading(false);
    }
  };

  if (loading) {
    return <div className="py-16 text-center text-sm text-slate-500">Loading your workspace...</div>;
  }

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-6 bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            {profile.avatar ? (
              <img src={profile.avatar} alt={profile.name} className="h-20 w-20 rounded-full border-4 border-white/40 object-cover" />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white/40 bg-white/20 text-2xl font-bold">
                {(profile.name || user?.name || 'U').slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-sm font-semibold uppercase text-emerald-50">{user?.role} workspace</p>
              <h1 className="mt-1 text-3xl font-bold text-white">Welcome back, {profile.name || user?.name}</h1>
              <p className="mt-2 text-sm text-emerald-50">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm hover:bg-emerald-50"
          >
            <FaPen /> Edit Profile
          </button>
        </div>
      </section>

      {error && <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}
      {success && <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{success}</div>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <SummaryTile icon={FaIdCard} title="Driver Status" value={insights.driverStatus} note={`License: ${insights.licenseNumber}`} />
        <SummaryTile icon={FaScrewdriverWrench} title="Open Maintenance" value={insights.openMaintenance.length} note="Scheduled or in-progress service logs" tone="amber" />
        <SummaryTile icon={FaGasPump} title="Recorded Expenses" value={currency.format(insights.expenseTotal)} note={insights.latestExpense ? 'Latest expense is available below' : 'No expenses recorded yet'} tone="blue" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-950">Assigned Fleet</h2>
              <p className="text-sm text-slate-500">Your current vehicle assignment and readiness details.</p>
            </div>
            <Link to="/dashboard/maintenance" className="text-sm font-semibold text-emerald-700">Maintenance</Link>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
              <FaLocationArrow className="text-emerald-600" />
              <p className="mt-3 text-sm font-semibold uppercase text-slate-500">Vehicle</p>
              <p className="mt-1 text-2xl font-bold text-slate-950">
                {insights.assignedVehicle?.vehicleNumber || 'Not assigned'}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                {insights.assignedVehicle?.type || 'Admin can assign a vehicle from driver management.'}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
              <FaCircleCheck className="text-emerald-600" />
              <p className="mt-3 text-sm font-semibold uppercase text-slate-500">Experience</p>
              <p className="mt-1 text-2xl font-bold text-slate-950">{insights.experience} years</p>
              <p className="mt-2 text-sm text-slate-500">Profile records are controlled by fleet administration.</p>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-950">Quick Actions</h2>
          </div>
          <div className="space-y-3">
            <Link to="/dashboard/expenses" className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 hover:border-emerald-200">
              <FaGasPump className="text-emerald-600" />
              <span className="font-semibold text-slate-950">Log trip expense</span>
            </Link>
            <Link to="/dashboard/maintenance" className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 hover:border-emerald-200">
              <FaCalendarCheck className="text-emerald-600" />
              <span className="font-semibold text-slate-950">Review service schedule</span>
            </Link>
          </div>
        </section>
      </div>

      {user?.role === 'driver' && (
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-950">Driving License Photo</h2>
              <p className="mt-1 text-sm text-slate-500">Upload a clear photo of your driving license. It is stored securely on ImageKit.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {profile.driverProfile?.licensePhoto && (
                <a
                  href={profile.driverProfile.licensePhoto}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  View current photo
                </a>
              )}
              <input id="licensePhotoUpload" type="file" accept="image/*" onChange={handleLicensePhotoUpload} disabled={licenseUploading} className="hidden" />
              <label
                htmlFor="licensePhotoUpload"
                className="cursor-pointer rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                {licenseUploading ? 'Uploading...' : profile.driverProfile?.licensePhoto ? 'Replace photo' : 'Upload photo'}
              </label>
            </div>
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-950">Maintenance Activity</h2>
            <Link to="/dashboard/maintenance" className="text-sm font-semibold text-emerald-700">View all</Link>
          </div>
          <div className="space-y-3">
            {insights.openMaintenance.slice(0, 4).map((item) => (
              <div key={item._id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3">
                <div>
                  <p className="font-semibold text-slate-950">{item.vehicle?.vehicleNumber || 'Fleet vehicle'}</p>
                  <p className="text-sm text-slate-500">{item.type} • {item.scheduledDate ? new Date(item.scheduledDate).toLocaleDateString() : 'Date pending'}</p>
                </div>
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">{item.status}</span>
              </div>
            ))}
            {insights.openMaintenance.length === 0 && <EmptyState message="No scheduled maintenance logs found." />}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-950">Recent Expenses</h2>
            <Link to="/dashboard/expenses" className="text-sm font-semibold text-emerald-700">Open tracker</Link>
          </div>
          <div className="space-y-3">
            {activity.expenses.slice(0, 4).map((expense) => (
              <div key={expense._id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3">
                <div>
                  <p className="font-semibold text-slate-950">{expense.expenseId || 'Expense'}</p>
                  <p className="text-sm text-slate-500">{expense.vehicle?.vehicleNumber || 'Vehicle'} • {expense.fuelLiters || 0} L</p>
                </div>
                <p className="font-bold text-emerald-700">{currency.format(totalExpense(expense))}</p>
              </div>
            ))}
            {activity.expenses.length === 0 && <EmptyState message="No expense entries found." />}
          </div>
        </section>
      </div>

      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <form onSubmit={handleProfileSubmit} className="w-full max-w-xl rounded-lg border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-950">Profile Settings</h2>
                <p className="text-sm text-slate-500">Update your contact details and avatar.</p>
              </div>
              <button type="button" onClick={() => setIsEditing(false)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600">
                Close
              </button>
            </div>

            <div className="mb-5 flex items-center gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
              {profile.avatar ? (
                <img src={profile.avatar} alt={profile.name} className="h-16 w-16 rounded-full object-cover" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-700">
                  <FaUser />
                </div>
              )}
              <div>
                <input id="avatarUpload" type="file" accept="image/*" onChange={handleAvatarUpload} disabled={uploading} className="hidden" />
                <label htmlFor="avatarUpload" className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white">
                  <FaCamera /> {uploading ? 'Uploading...' : 'Upload photo'}
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Full Name</label>
                <input name="name" value={profile.name} onChange={handleChange} required className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-sm focus:border-emerald-500 focus:outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Phone</label>
                <input name="phone" value={profile.phone} onChange={handleChange} className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-sm focus:border-emerald-500 focus:outline-none" />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Address</label>
                <input name="address" value={profile.address} onChange={handleChange} className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-sm focus:border-emerald-500 focus:outline-none" />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setIsEditing(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600">
                Cancel
              </button>
              <button type="submit" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
                Save Profile
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
