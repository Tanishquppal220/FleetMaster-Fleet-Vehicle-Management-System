export const StatCard = ({ title, value }) => (
  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-sm">
    <h3 className="text-zinc-400 text-sm font-medium">{title}</h3>
    <p className="text-2xl font-bold mt-2 text-white">{value}</p>
  </div>
);

export const InfoCard = ({ title, children }) => (
  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
    <h2 className="text-lg font-semibold mb-4">{title}</h2>
    {children}
  </div>
);

export const MetricCard = ({ title, value }) => (
  <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
    <h3 className="text-zinc-400 text-sm">{title}</h3>
    <p className="text-3xl font-bold mt-2">{value}</p>
  </div>
);