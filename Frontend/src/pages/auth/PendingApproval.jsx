import { Link } from 'react-router-dom';
import { FaClock } from 'react-icons/fa6';

export default function PendingApproval() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8 text-slate-950">
      <main className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-xl sm:p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
          <FaClock className="h-5 w-5" />
        </div>
        <p className="mt-4 text-sm font-semibold uppercase text-emerald-700">FleetMaster</p>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-950">Account Pending Approval</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-500">
          Your account has been created and is waiting for administrator approval.
          You will be able to log in once an admin reviews and activates your account.
        </p>

        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-800">
            This usually takes less than 24 hours. Please check back later.
          </p>
        </div>

        <Link
          to="/login"
          className="mt-6 inline-block w-full rounded-lg bg-emerald-600 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-700"
        >
          Back to Login
        </Link>
      </main>
    </div>
  );
}
