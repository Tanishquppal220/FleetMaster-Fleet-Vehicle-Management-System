import { Outlet, NavLink } from 'react-router-dom';
import { FaCarSide, FaChartLine, FaGasPump, FaIdCard, FaRightFromBracket, FaScrewdriverWrench, FaUserGear } from 'react-icons/fa6';
import useAuth from '../hooks/useAuth';

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
      isActive ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
    }`;

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-950">
      <aside className="hidden w-72 border-r border-slate-200 bg-white p-6 lg:flex lg:flex-col">
        <div className="mb-8">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-600 text-white">
            <FaCarSide className="h-5 w-5" />
          </div>
          <h2 className="mt-4 text-xl font-bold text-slate-950">FleetMaster</h2>
          <p className="mt-1 text-xs font-medium uppercase text-slate-500">{user?.role || 'user'} workspace</p>
        </div>

        <nav className="flex-1 space-y-1">
          <NavLink to="/dashboard" end className={linkClass}>
            <FaUserGear /> My Dashboard
          </NavLink>
          
          {user?.role === 'admin' && (
            <>
              <NavLink to="/dashboard/admin" className={linkClass}>
                <FaChartLine /> Admin Dashboard
              </NavLink>
              <NavLink to="/dashboard/vehicles" className={linkClass}>
                <FaCarSide /> Vehicles
              </NavLink>
              <NavLink to="/dashboard/drivers" className={linkClass}>
                <FaIdCard /> Drivers
              </NavLink>
              <NavLink to="/dashboard/maintenance" className={linkClass}>
                <FaScrewdriverWrench /> Maintenance
              </NavLink>
              <NavLink to="/dashboard/expenses" className={linkClass}>
                <FaGasPump /> Expenses
              </NavLink>
            </>
          )}
          
          {user?.role === 'driver' && (
            <>
              <NavLink to="/dashboard/maintenance" className={linkClass}>
                <FaScrewdriverWrench /> My Maintenance
              </NavLink>
              <NavLink to="/dashboard/expenses" className={linkClass}>
                <FaGasPump /> My Expenses
              </NavLink>
            </>
          )}

          {user?.role === 'mechanic' && (
            <>
              <NavLink to="/dashboard/mechanic" className={linkClass}>
                <FaChartLine /> Mechanic Dashboard
              </NavLink>
              <NavLink to="/dashboard/maintenance" className={linkClass}>
                <FaScrewdriverWrench /> Maintenance Jobs
              </NavLink>
            </>
          )}
        </nav>

        <div className="border-t border-slate-200 pt-4">
          <div className="mb-3 text-sm">
            <p className="font-semibold text-slate-950">{user?.name}</p>
            <p className="text-xs text-slate-500">{user?.email}</p>
          </div>
          <button onClick={logout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50">
            <FaRightFromBracket /> Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8">
        <div className="mb-5 flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm lg:hidden">
          <div>
            <p className="font-bold text-slate-950">FleetMaster</p>
            <p className="text-xs capitalize text-slate-500">{user?.role} workspace</p>
          </div>
          <button onClick={logout} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-rose-600">
            Logout
          </button>
        </div>
        <nav className="mb-5 flex gap-2 overflow-x-auto rounded-lg border border-slate-200 bg-white p-2 shadow-sm lg:hidden">
          <NavLink to="/dashboard" end className={linkClass}>
            <FaUserGear /> Home
          </NavLink>
          {user?.role === 'admin' && (
            <>
              <NavLink to="/dashboard/admin" className={linkClass}>
                <FaChartLine /> Admin
              </NavLink>
              <NavLink to="/dashboard/vehicles" className={linkClass}>
                <FaCarSide /> Vehicles
              </NavLink>
              <NavLink to="/dashboard/drivers" className={linkClass}>
                <FaIdCard /> Drivers
              </NavLink>
            </>
          )}
          {user?.role === 'mechanic' && (
            <NavLink to="/dashboard/mechanic" className={linkClass}>
              <FaChartLine /> Mechanic
            </NavLink>
          )}
          <NavLink to="/dashboard/maintenance" className={linkClass}>
            <FaScrewdriverWrench /> Maintenance
          </NavLink>
          <NavLink to="/dashboard/expenses" className={linkClass}>
            <FaGasPump /> Expenses
          </NavLink>
        </nav>
        <Outlet />
      </main>
    </div>
  );
}
