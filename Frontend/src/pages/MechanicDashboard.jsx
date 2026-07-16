import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaCalendarCheck,
  FaCarSide,
  FaCircleCheck,
  FaClock,
  FaScrewdriverWrench,
  FaTriangleExclamation,
} from 'react-icons/fa6';
import maintenanceService from '../services/maintenanceService';
import useAuth from '../hooks/useAuth';

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

function WorkCard({ icon: Icon, title, value, note, tone = 'emerald' }) {
  const tones = {
    emerald: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    blue: 'bg-blue-50 text-blue-700',
    rose: 'bg-rose-50 text-rose-700',
  };

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-slate-950">{value}</p>
        </div>
        <div className={`rounded-lg p-2 ${tones[tone]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-3 text-sm text-slate-500">{note}</p>
    </section>
  );
}

function StatusPill({ status }) {
  const classes = {
    Completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'In Progress': 'bg-blue-50 text-blue-700 border-blue-200',
    Cancelled: 'bg-slate-50 text-slate-600 border-slate-200',
    Scheduled: 'bg-amber-50 text-amber-700 border-amber-200',
  };

  return (
    <span className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold ${classes[status] || classes.Scheduled}`}>
      {status}
    </span>
  );
}

export default function MechanicDashboard() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadWork = async () => {
      try {
        setLoading(true);
        const data = await maintenanceService.getMaintenanceRecords();
        setRecords(data);
        setError('');
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load mechanic work queue');
      } finally {
        setLoading(false);
      }
    };

    loadWork();
  }, []);

  const summary = useMemo(() => {
    const scheduled = records.filter((record) => record.status === 'Scheduled');
    const inProgress = records.filter((record) => record.status === 'In Progress');
    const completed = records.filter((record) => record.status === 'Completed');
    const urgent = records.filter((record) => ['High', 'Critical'].includes(record.priority) && record.status !== 'Completed');
    const open = records.filter((record) => !['Completed', 'Cancelled'].includes(record.status));

    return {
      scheduled,
      inProgress,
      completed,
      urgent,
      open,
      estimatedCost: open.reduce((sum, record) => sum + Number(record.cost || 0), 0),
      queue: [...open].sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate)).slice(0, 6),
    };
  }, [records]);

  if (loading) {
    return <div className="py-16 text-center text-sm text-slate-500">Loading mechanic dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <p className="text-sm font-semibold uppercase text-emerald-700">Mechanic Workspace</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Maintenance Work Queue</h1>
          <p className="mt-2 text-sm text-slate-500">Welcome, {user?.name}. Review service jobs and update repair progress.</p>
        </div>
        <Link to="/dashboard/maintenance" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
          Open Maintenance Logs
        </Link>
      </div>

      {error && <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <WorkCard icon={FaClock} title="Scheduled Jobs" value={summary.scheduled.length} note="Jobs waiting to begin" tone="amber" />
        <WorkCard icon={FaScrewdriverWrench} title="In Progress" value={summary.inProgress.length} note="Repairs currently active" tone="blue" />
        <WorkCard icon={FaTriangleExclamation} title="Urgent Jobs" value={summary.urgent.length} note="High priority maintenance" tone="rose" />
        <WorkCard icon={FaCircleCheck} title="Completed" value={summary.completed.length} note="Closed service records" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-950">Priority Work</h2>
              <p className="text-sm text-slate-500">Open records sorted by scheduled date.</p>
            </div>
            <Link to="/dashboard/maintenance" className="text-sm font-semibold text-emerald-700">Update jobs</Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-3">Vehicle</th>
                  <th className="px-3 py-3">Service</th>
                  <th className="px-3 py-3">Due Date</th>
                  <th className="px-3 py-3">Priority</th>
                  <th className="px-3 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {summary.queue.map((record) => (
                  <tr key={record._id}>
                    <td className="px-3 py-3 font-mono font-semibold text-emerald-700">{record.vehicle?.vehicleNumber || 'Unassigned'}</td>
                    <td className="px-3 py-3 text-slate-700">{record.type}</td>
                    <td className="px-3 py-3 text-slate-600">{record.scheduledDate ? new Date(record.scheduledDate).toLocaleDateString() : 'Not set'}</td>
                    <td className="px-3 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${['High', 'Critical'].includes(record.priority) ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'}`}>
                        {record.priority}
                      </span>
                    </td>
                    <td className="px-3 py-3"><StatusPill status={record.status} /></td>
                  </tr>
                ))}
                {summary.queue.length === 0 && (
                  <tr>
                    <td colSpan="5" className="py-10 text-center text-sm text-slate-500">No active maintenance jobs.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-950">Today’s Focus</h2>
          <div className="mt-4 space-y-3">
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
              <FaCarSide className="text-emerald-600" />
              <p className="mt-3 text-sm font-semibold uppercase text-slate-500">Open Vehicles</p>
              <p className="mt-1 text-2xl font-bold text-slate-950">{summary.open.length}</p>
            </div>
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
              <FaCalendarCheck className="text-emerald-600" />
              <p className="mt-3 text-sm font-semibold uppercase text-slate-500">Estimated Work Value</p>
              <p className="mt-1 text-2xl font-bold text-slate-950">{currency.format(summary.estimatedCost)}</p>
            </div>
            <p className="text-sm text-slate-500">
              Use Maintenance Logs to change status to In Progress or Completed as work moves forward.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
