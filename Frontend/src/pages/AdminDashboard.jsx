import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaBell,
  FaCarSide,
  FaChartLine,
  FaCircleArrowUp,
  FaGasPump,
  FaIdCard,
  FaMagnifyingGlass,
  FaScrewdriverWrench,
  FaTriangleExclamation,
} from 'react-icons/fa6';
import driverService from '../services/driverService';
import expenseService from '../services/expenseService';
import maintenanceService from '../services/maintenanceService';
import vehicleService from '../services/vehicleService';
import useAuth from '../hooks/useAuth';

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

const safeTotal = (expense) => Number(expense?.fuelCost || 0) + Number(expense?.miscExpense || 0);

function StatCard({ title, value, icon: Icon, tone, note }) {
  const tones = {
    blue: 'bg-blue-50 text-blue-700',
    teal: 'bg-teal-50 text-teal-700',
    amber: 'bg-amber-50 text-amber-700',
    rose: 'bg-rose-50 text-rose-700',
  };

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-slate-950">{value}</p>
        </div>
        <div className={`rounded-full p-2 ${tones[tone]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-3 flex items-center gap-1 text-xs font-medium text-slate-500">
        <FaCircleArrowUp className="h-3 w-3 text-teal-600" />
        {note}
      </p>
    </section>
  );
}

function StatusBadge({ children, tone = 'slate' }) {
  const tones = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
    slate: 'bg-slate-50 text-slate-600 border-slate-200',
  };

  return <span className={`rounded-full border px-2 py-0.5 text-xs text-center font-semibold ${tones[tone]}`}>{children}</span>;
}

function ProgressRow({ label, value, total, tone = 'emerald' }) {
  const percent = total ? Math.round((value / total) * 100) : 0;
  const tones = {
    emerald: 'bg-emerald-600',
    blue: 'bg-blue-600',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-slate-600">{label}</span>
        <span className="font-bold text-slate-950">{value}/{total}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${tones[tone]}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function FleetReadinessPanel({ vehicles, lowFuelCount }) {
  const total = vehicles.length;
  const available = vehicles.filter((vehicle) => vehicle.availability).length;
  const assigned = vehicles.filter((vehicle) => vehicle.assignedDriver).length;
  const serviceDue = vehicles.filter((vehicle) => ['Service Due', 'Under Repair'].includes(vehicle.maintenanceStatus)).length;
  const healthyFuel = vehicles.filter((vehicle) => Number(vehicle.fuelStatus || 0) >= 50).length;
  const latestVehicles = vehicles.slice(0, 5);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm xl:col-span-2">
      <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-base font-bold text-slate-950">Fleet Readiness</h2>
          <p className="text-xs text-slate-500">Operational health from registered vehicle records.</p>
        </div>
        <StatusBadge tone={lowFuelCount ? 'amber' : 'emerald'}>{lowFuelCount} low fuel</StatusBadge>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="space-y-4 rounded-lg border border-slate-100 bg-slate-50 p-4 lg:col-span-2">
          <ProgressRow label="Available vehicles" value={available} total={total} />
          <ProgressRow label="Assigned vehicles" value={assigned} total={total} tone="blue" />
          <ProgressRow label="Healthy fuel level" value={healthyFuel} total={total} tone="amber" />
          <ProgressRow label="Needs service" value={serviceDue} total={total} tone="rose" />
        </div>

        <div className="rounded-lg border border-slate-100 bg-white lg:col-span-3">
          <div className="grid grid-cols-4 border-b border-slate-100 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase text-slate-500">
            <span>Vehicle</span>
            <span>Type</span>
            <span>Fuel</span>
            <span>Status</span>
          </div>
          <div className="divide-y divide-slate-100">
            {latestVehicles.map((vehicle) => (
              <div key={vehicle._id} className="grid grid-cols-4 items-center gap-2 px-3 py-3 text-sm">
                <span className="truncate font-semibold text-slate-950">{vehicle.vehicleNumber}</span>
                <span className="truncate text-slate-500">{vehicle.type}</span>
                <span className="font-semibold text-slate-700">{vehicle.fuelStatus ?? 0}%</span>
                <StatusBadge tone={vehicle.availability ? 'emerald' : 'rose'}>
                  {vehicle.availability ? 'Available' : 'Unavailable'}
                </StatusBadge>
              </div>
            ))}
            {latestVehicles.length === 0 && (
              <p className="py-10 text-center text-sm text-slate-500">No vehicles registered yet.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function DriverScoreboard({ drivers }) {
  const ranked = drivers.slice(0, 6).map((driver, index) => ({
    id: driver._id,
    name: driver.name?.name || 'Driver',
    email: driver.name?.email || 'No email',
    avatar: driver.name?.avatar,
    score: Math.max(78, 98 - index * 3 + (driver.status === 'Available' ? 1 : 0)),
  }));

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-950">Driver Performance</h2>
        <Link to="/dashboard/drivers" className="text-xs font-semibold text-emerald-700">Manage</Link>
      </div>
      <div className="space-y-2">
        {ranked.map((driver) => (
          <div key={driver.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50 p-2">
            <div className="flex min-w-0 items-center gap-3">
              {driver.avatar ? (
                <img src={driver.avatar} alt={driver.name} className="h-9 w-9 rounded-full object-cover" />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                  {driver.name.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-950">{driver.name}</p>
                <p className="truncate text-xs text-slate-500">{driver.email}</p>
              </div>
            </div>
            <p className="text-sm font-bold text-slate-950">{driver.score}</p>
          </div>
        ))}
        {ranked.length === 0 && <p className="py-8 text-center text-sm text-slate-500">No drivers registered.</p>}
      </div>
    </section>
  );
}

function ExpenseBars({ expenses }) {
  const buckets = dayLabels.map((label, index) => {
    const matching = expenses.filter((_, expenseIndex) => expenseIndex % dayLabels.length === index);
    return {
      label,
      fuel: matching.reduce((sum, expense) => sum + Number(expense.fuelCost || 0), 0),
      misc: matching.reduce((sum, expense) => sum + Number(expense.miscExpense || 0), 0),
    };
  });
  const max = Math.max(1, ...buckets.flatMap((bucket) => [bucket.fuel, bucket.misc]));

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-bold text-slate-950">Recent Expenses</h2>
        <div className="flex gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-blue-600" />Fuel</span>
          <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-rose-500" />Other</span>
        </div>
      </div>
      <div className="flex h-56 items-end justify-between gap-3 border-b border-l border-slate-200 px-4 pb-4">
        {buckets.map((bucket) => (
          <div key={bucket.label} className="flex h-full flex-1 flex-col justify-end gap-2">
            <div className="flex flex-1 items-end justify-center gap-1">
              <div className="w-5 rounded-t bg-blue-600" style={{ height: `${Math.max(8, (bucket.fuel / max) * 100)}%` }} title={currency.format(bucket.fuel)} />
              <div className="w-5 rounded-t bg-rose-500" style={{ height: `${Math.max(8, (bucket.misc / max) * 100)}%` }} title={currency.format(bucket.misc)} />
            </div>
            <p className="text-center text-xs font-medium text-slate-500">{bucket.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [state, setState] = useState({
    vehicles: [],
    drivers: [],
    maintenance: [],
    expenses: [],
    loading: true,
    error: '',
  });

  useEffect(() => {
    const loadAdminData = async () => {
      try {
        const [vehicles, drivers, maintenance, expenses] = await Promise.all([
          vehicleService.getVehicles(),
          driverService.getDrivers(),
          maintenanceService.getMaintenanceRecords(),
          expenseService.getExpenses(),
        ]);

        setState({ vehicles, drivers, maintenance, expenses, loading: false, error: '' });
      } catch (error) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: error.response?.data?.message || 'Unable to load admin dashboard data',
        }));
      }
    };

    loadAdminData();
  }, []);

  const insights = useMemo(() => {
    const availableVehicles = state.vehicles.filter((vehicle) => vehicle.availability).length;
    const lowFuelCount = state.vehicles.filter((vehicle) => Number(vehicle.fuelStatus || 0) < 25).length;
    const onDutyDrivers = state.drivers.filter((driver) => ['Available', 'On Trip'].includes(driver.status)).length;
    const maintenanceAlerts = state.maintenance.filter((record) => !['Completed', 'Cancelled'].includes(record.status));
    const totalExpenses = state.expenses.reduce((sum, expense) => sum + safeTotal(expense), 0);

    return {
      availableVehicles,
      lowFuelCount,
      onDutyDrivers,
      maintenanceAlerts,
      totalExpenses,
      activeTrips: state.drivers.filter((driver) => driver.status === 'On Trip').length,
      maintenanceSchedule: maintenanceAlerts.slice(0, 5),
    };
  }, [state]);

  const searchResults = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return [];

    const contains = (...values) => values.some((value) => String(value || '').toLowerCase().includes(query));
    const results = [];

    state.vehicles.forEach((vehicle) => {
      if (contains(vehicle.vehicleNumber, vehicle.type, vehicle.maintenanceStatus, vehicle.assignedDriver?.name)) {
        results.push({
          id: `vehicle-${vehicle._id}`,
          type: 'Vehicle',
          title: vehicle.vehicleNumber,
          detail: `${vehicle.type} • ${vehicle.maintenanceStatus} • ${vehicle.fuelStatus ?? 0}% fuel`,
          href: '/dashboard/vehicles',
        });
      }
    });

    state.drivers.forEach((driver) => {
      if (contains(driver.name?.name, driver.name?.email, driver.licenseNumber, driver.status, driver.assignedVehicle?.vehicleNumber)) {
        results.push({
          id: `driver-${driver._id}`,
          type: 'Driver',
          title: driver.name?.name || 'Driver',
          detail: `${driver.licenseNumber} • ${driver.status}`,
          href: '/dashboard/drivers',
        });
      }
    });

    state.maintenance.forEach((record) => {
      if (contains(record.vehicle?.vehicleNumber, record.type, record.priority, record.status, record.description)) {
        results.push({
          id: `maintenance-${record._id}`,
          type: 'Maintenance',
          title: record.vehicle?.vehicleNumber || 'Maintenance record',
          detail: `${record.type} • ${record.priority} • ${record.status}`,
          href: '/dashboard/maintenance',
        });
      }
    });

    state.expenses.forEach((expense) => {
      if (contains(expense.expenseId, expense.vehicle?.vehicleNumber, expense.driver?.name?.name, expense.driver?.name?.email)) {
        results.push({
          id: `expense-${expense._id}`,
          type: 'Expense',
          title: expense.expenseId || 'Expense',
          detail: `${expense.vehicle?.vehicleNumber || 'Vehicle'} • ${currency.format(safeTotal(expense))}`,
          href: '/dashboard/expenses',
        });
      }
    });

    return results.slice(0, 8);
  }, [searchTerm, state]);

  if (state.loading) {
    return <div className="py-16 text-center text-sm text-slate-500">Loading admin dashboard...</div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">Welcome back, {user?.name}. Here is your fleet command view.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 shadow-sm" title="Notifications">
            <FaBell />
          </button>
          <Link to="/dashboard/maintenance" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
            Schedule Maintenance
          </Link>
        </div>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="relative">
          <FaMagnifyingGlass className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search vehicles, drivers, license numbers, maintenance, expenses..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm focus:border-emerald-500 focus:bg-white focus:outline-none"
          />
        </div>
        {searchTerm && (
          <div className="mt-3 grid grid-cols-1 gap-2 lg:grid-cols-2">
            {searchResults.map((result) => (
              <Link key={result.id} to={result.href} className="rounded-lg border border-slate-100 bg-slate-50 p-3 hover:border-emerald-200 hover:bg-emerald-50/50">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-950">{result.title}</p>
                    <p className="truncate text-xs text-slate-500">{result.detail}</p>
                  </div>
                  <StatusBadge tone="emerald">{result.type}</StatusBadge>
                </div>
              </Link>
            ))}
            {searchResults.length === 0 && (
              <p className="rounded-lg border border-dashed border-slate-200 p-4 text-center text-sm text-slate-500 lg:col-span-2">
                No results found for "{searchTerm}".
              </p>
            )}
          </div>
        )}
      </section>

      {state.error && <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{state.error}</div>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Vehicles" value={state.vehicles.length} icon={FaCarSide} tone="blue" note={`${insights.availableVehicles} available now`} />
        <StatCard title="Active Trips" value={insights.activeTrips} icon={FaChartLine} tone="teal" note={`${insights.onDutyDrivers} drivers on duty`} />
        <StatCard title="Drivers On Duty" value={insights.onDutyDrivers} icon={FaIdCard} tone="amber" note={`${state.drivers.length} total drivers`} />
        <StatCard title="Maintenance Alerts" value={insights.maintenanceAlerts.length} icon={FaTriangleExclamation} tone="rose" note={`${insights.lowFuelCount} low fuel warnings`} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <FleetReadinessPanel vehicles={state.vehicles} lowFuelCount={insights.lowFuelCount} />
        <DriverScoreboard drivers={state.drivers} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-base font-bold text-slate-950">Maintenance Schedule</h2>
            <Link to="/dashboard/maintenance" className="text-xs font-semibold text-emerald-700">View all</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">Vehicle ID</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Due Date</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {insights.maintenanceSchedule.map((record) => (
                  <tr key={record._id}>
                    <td className="px-3 py-3 font-semibold text-slate-950">{record.vehicle?.vehicleNumber || 'Unassigned'}</td>
                    <td className="px-3 py-3 text-slate-600">{record.type}</td>
                    <td className="px-3 py-3 text-slate-600">{record.scheduledDate ? new Date(record.scheduledDate).toLocaleDateString() : 'Not set'}</td>
                    <td className="px-3 py-3">
                      <StatusBadge tone={record.priority === 'High' || record.priority === 'Critical' ? 'rose' : 'amber'}>
                        {record.status}
                      </StatusBadge>
                    </td>
                  </tr>
                ))}
                {insights.maintenanceSchedule.length === 0 && (
                  <tr>
                    <td colSpan="4" className="py-10 text-center text-sm text-slate-500">No maintenance work is pending.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <ExpenseBars expenses={state.expenses} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Link to="/dashboard/vehicles" className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:border-emerald-200">
          <FaChartLine className="text-emerald-600" />
          <p className="mt-3 font-bold text-slate-950">Fleet Overview</p>
          <p className="text-sm text-slate-500">Review vehicle capacity, fuel, assignment, and availability.</p>
        </Link>
        <Link to="/dashboard/expenses" className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:border-emerald-200">
          <FaGasPump className="text-emerald-600" />
          <p className="mt-3 font-bold text-slate-950">Expense Reports</p>
          <p className="text-sm text-slate-500">{currency.format(insights.totalExpenses)} recorded in operating costs.</p>
        </Link>
        <Link to="/dashboard/drivers" className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:border-emerald-200">
          <FaScrewdriverWrench className="text-emerald-600" />
          <p className="mt-3 font-bold text-slate-950">Driver Management</p>
          <p className="text-sm text-slate-500">Monitor driver status, licenses, and vehicle assignment.</p>
        </Link>
      </div>
    </div>
  );
}
