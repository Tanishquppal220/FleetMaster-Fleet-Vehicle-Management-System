import { useState, useEffect } from 'react';
import maintenanceService from '../services/maintenanceService';
import vehicleService from '../services/vehicleService';
import useAuth from '../hooks/useAuth';

export default function MaintenancePage() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal / Form States
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [formData, setFormData] = useState({
    vehicle: '',
    type: 'Routine Check',
    scheduledDate: '',
    cost: '',
    description: '',
    priority: 'Medium',
    status: 'Scheduled',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const maintenanceList = await maintenanceService.getMaintenanceRecords();
      setRecords(maintenanceList);

      if (user?.role === 'admin' || user?.role === 'mechanic') {
        const vehicleList = await vehicleService.getVehicles();
        setVehicles(vehicleList);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load maintenance records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.role]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleOpenAdd = () => {
    setFormData({
      vehicle: '',
      type: 'Routine Check',
      scheduledDate: '',
      cost: '',
      description: '',
      priority: 'Medium',
      status: 'Scheduled',
    });
    setIsEditing(false);
    setShowModal(true);
  };

  const handleOpenEdit = (r) => {
    setFormData({
      vehicle: r.vehicle ? r.vehicle._id : '',
      type: r.type,
      scheduledDate: r.scheduledDate ? new Date(r.scheduledDate).toISOString().split('T')[0] : '',
      cost: r.cost || '',
      description: r.description || '',
      priority: r.priority || 'Medium',
      status: r.status || 'Scheduled',
    });
    setCurrentId(r._id);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const payload = {
      ...formData,
      cost: Number(formData.cost),
    };

    try {
      if (isEditing) {
        await maintenanceService.updateMaintenanceRecord(currentId, payload);
        setSuccess('Maintenance record updated successfully');
      } else {
        await maintenanceService.createMaintenanceRecord(payload);
        setSuccess('Maintenance record scheduled successfully');
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    try {
      await maintenanceService.deleteMaintenanceRecord(id);
      setSuccess('Maintenance record deleted successfully');
      loadData();
    } catch (err) {
      setError('Failed to delete maintenance record');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Maintenance Logs</h1>
          <p className="text-zinc-400 text-sm">Schedule inspections, repair logs and review vehicle status.</p>
        </div>
        {(user?.role === 'admin' || user?.role === 'mechanic') && (
          <button
            onClick={handleOpenAdd}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors cursor-pointer text-sm"
          >
            + Schedule Maintenance
          </button>
        )}
      </div>

      {error && <div className="bg-red-950/40 border border-red-800/40 text-red-500 p-4 rounded-lg text-sm">{error}</div>}
      {success && <div className="bg-emerald-950/40 border border-emerald-800/40 text-black p-4 rounded-lg text-sm">{success}</div>}

      {loading ? (
        <div className="text-center py-12 text-zinc-400 text-sm">Loading maintenance history...</div>
      ) : (
        <div className="overflow-x-auto bg-zinc-900/40 border border-zinc-800 rounded-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400 text-xs font-semibold uppercase tracking-wider bg-zinc-900/80">
                <th className="p-4">Vehicle</th>
                <th className="p-4">Type</th>
                <th className="p-4">Scheduled Date</th>
                <th className="p-4">Estimated Cost</th>
                <th className="p-4">Priority</th>
                <th className="p-4">Status</th>
                <th className="p-4">Performed By</th>
                {(user?.role === 'admin' || user?.role === 'mechanic') && <th className="p-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-850 text-sm">
              {records.map((r) => (
                <tr key={r._id} className="hover:bg-zinc-900/30 transition-colors">
                  <td className="p-4 font-mono font-semibold text-black">
                    {r.vehicle ? r.vehicle.vehicleNumber : <span className="text-zinc-500 italic">Deleted Vehicle</span>}
                  </td>
                  <td className="p-4">{r.type}</td>
                  <td className="p-4 text-zinc-300">{new Date(r.scheduledDate).toLocaleDateString()}</td>
                  <td className="p-4 text-zinc-300">${r.cost?.toLocaleString()}</td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium border ${r.priority === 'High'
                        ? 'bg-red-950/30 text-red-400 border-red-900/40'
                        : r.priority === 'Medium'
                          ? 'bg-yellow-950/30 text-yellow-400 border-yellow-900/40'
                          : 'bg-emerald-950/30 text-black border-emerald-900/40'
                        }`}
                    >
                      {r.priority}
                    </span>
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${r.status === 'Completed'
                        ? 'bg-emerald-500/20 text-black'
                        : r.status === 'In Progress'
                          ? 'bg-blue-500/20 text-black'
                          : r.status === 'Cancelled'
                            ? 'bg-zinc-800 text-zinc-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="p-4 text-zinc-400">
                    {r.performedBy ? r.performedBy.name : <span className="text-zinc-500 italic">Unassigned</span>}
                  </td>
                  {(user?.role === 'admin' || user?.role === 'mechanic') && (
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEdit(r)}
                        className="text-zinc-300 hover:text-black font-semibold text-xs border border-zinc-700 hover:border-emerald-500/40 rounded px-2.5 py-1 transition-colors cursor-pointer"
                      >
                        Update
                      </button>
                      {user?.role === 'admin' && (
                        <button
                          onClick={() => handleDelete(r._id)}
                          className="text-red-400 hover:text-red-300 font-semibold text-xs border border-zinc-750 hover:border-red-900/40 rounded px-2.5 py-1 transition-colors cursor-pointer"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {records.length === 0 && (
                <tr>
                  <td colSpan={user?.role === 'admin' || user?.role === 'mechanic' ? 8 : 7} className="p-8 text-center text-zinc-500 italic">
                    No scheduled maintenance logs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-6">
            <div>
              <h3 className="text-xl font-bold">{isEditing ? 'Update Maintenance Log' : 'Schedule Fleet Maintenance'}</h3>
              <p className="text-zinc-400 text-xs mt-1">Submit routine diagnostic checks, mechanical fixes or inspections.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Select Vehicle</label>
                  <select
                    name="vehicle"
                    value={formData.vehicle}
                    onChange={handleChange}
                    required
                    disabled={isEditing}
                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 p-2.5 text-sm focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                  >
                    <option value="">Choose Vehicle</option>
                    {vehicles.map((v) => (
                      <option key={v._id} value={v._id}>
                        {v.vehicleNumber} ({v.type})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Maintenance Type</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 p-2.5 text-sm focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Routine Check">Routine Check</option>
                    <option value="Repair">Repair</option>
                    <option value="Oil Change">Oil Change</option>
                    <option value="Tire Rotation">Tire Rotation</option>
                    <option value="Inspection">Inspection</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Scheduled Date</label>
                  <input
                    type="date"
                    name="scheduledDate"
                    value={formData.scheduledDate}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 p-2.5 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Cost ($)</label>
                  <input
                    type="number"
                    name="cost"
                    value={formData.cost}
                    onChange={handleChange}
                    placeholder="e.g. 250"
                    required
                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 p-2.5 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Priority</label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 p-2.5 text-sm focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Maintenance Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 p-2.5 text-sm focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description / Notes</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                  required
                  placeholder="Describe maintenance issues or scheduled checks..."
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
                  {isEditing ? 'Update Record' : 'Schedule Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
