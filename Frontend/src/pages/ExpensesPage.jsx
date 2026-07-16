import { useState, useEffect } from 'react';
import expenseService from '../services/expenseService';
import vehicleService from '../services/vehicleService';
import driverService from '../services/driverService';
import api from '../services/api';
import useAuth from '../hooks/useAuth';

export default function ExpensesPage() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal / Form States
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [formData, setFormData] = useState({
    vehicle: '',
    driver: '',
    fuelLiters: '',
    fuelCost: '',
    miscExpense: '0',
    expenseDate: '',
    receiptUrl: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const expenseList = await expenseService.getExpenses();
      setExpenses(expenseList);

      const vehicleList = await vehicleService.getVehicles();
      setVehicles(vehicleList);

      if (user?.role === 'admin') {
        const driverList = await driverService.getDrivers();
        setDrivers(driverList);
      }
    } catch (err) {
      setError('Failed to load expenses or supporting data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const data = new FormData();
    data.append('image', file);

    try {
      setUploading(true);
      setError('');
      setSuccess('');
      const res = await api.post('/upload', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setFormData(prev => ({ ...prev, receiptUrl: res.data.url }));
      setSuccess('Receipt image uploaded successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Receipt upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleOpenAdd = () => {
    setFormData({
      vehicle: '',
      driver: '',
      fuelLiters: '',
      fuelCost: '',
      miscExpense: '0',
      expenseDate: new Date().toISOString().split('T')[0],
      receiptUrl: '',
    });
    setIsEditing(false);
    setShowModal(true);
  };

  const handleOpenEdit = (exp) => {
    setFormData({
      vehicle: exp.vehicle ? exp.vehicle._id : '',
      driver: exp.driver ? exp.driver._id : '',
      fuelLiters: exp.fuelLiters || '',
      fuelCost: exp.fuelCost || '',
      miscExpense: exp.miscExpense || '0',
      expenseDate: exp.expenseDate ? new Date(exp.expenseDate).toISOString().split('T')[0] : '',
      receiptUrl: exp.receiptUrl || '',
    });
    setCurrentId(exp._id);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const payload = {
      ...formData,
      fuelLiters: Number(formData.fuelLiters),
      fuelCost: Number(formData.fuelCost),
      miscExpense: Number(formData.miscExpense),
    };

    try {
      if (isEditing) {
        await expenseService.updateExpense(currentId, payload);
        setSuccess('Expense record updated successfully');
      } else {
        await expenseService.createExpense(payload);
        setSuccess('Expense recorded successfully');
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense record?')) return;
    try {
      await expenseService.deleteExpense(id);
      setSuccess('Expense record deleted successfully');
      loadData();
    } catch (err) {
      setError('Failed to delete expense record');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Expense Tracker</h1>
          <p className="text-zinc-400 text-sm">Log operational costs, fuel expenses, and miscellaneous receipts.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors cursor-pointer text-sm"
        >
          + Log Expense
        </button>
      </div>

      {error && <div className="bg-red-950/40 border border-red-800/40 text-red-500 p-4 rounded-lg text-sm">{error}</div>}
      {success && <div className="bg-emerald-950/40 border border-emerald-800/40 text-emerald-400 p-4 rounded-lg text-sm">{success}</div>}

      {loading ? (
        <div className="text-center py-12 text-zinc-400 text-sm">Loading expense transactions...</div>
      ) : (
        <div className="overflow-x-auto bg-zinc-900/40 border border-zinc-800 rounded-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400 text-xs font-semibold uppercase tracking-wider bg-zinc-900/80">
                <th className="p-4">Expense ID</th>
                <th className="p-4">Vehicle</th>
                <th className="p-4">Driver</th>
                <th className="p-4">Fuel (L)</th>
                <th className="p-4">Fuel Cost</th>
                <th className="p-4">Misc. Cost</th>
                <th className="p-4">Total Cost</th>
                <th className="p-4">Receipt</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-850 text-sm">
              {expenses.map((e) => (
                <tr key={e._id} className="hover:bg-zinc-900/30 transition-colors">
                  <td className="p-4 font-mono text-zinc-300 text-xs">{e.expenseId}</td>
                  <td className="p-4 font-mono font-semibold text-emerald-400">
                    {e.vehicle ? e.vehicle.vehicleNumber : <span className="text-zinc-500 italic">Deleted Vehicle</span>}
                  </td>
                  <td className="p-4 text-zinc-300">
                    {e.driver?.name?.name || 'Unknown Driver'}
                  </td>
                  <td className="p-4">{e.fuelLiters} L</td>
                  <td className="p-4">${e.fuelCost?.toLocaleString()}</td>
                  <td className="p-4">${e.miscExpense?.toLocaleString()}</td>
                  <td className="p-4 font-semibold text-emerald-400">
                    ${(e.fuelCost + e.miscExpense).toLocaleString()}
                  </td>
                  <td className="p-4">
                    {e.receiptUrl ? (
                      <a
                        href={e.receiptUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-400 hover:underline font-semibold text-xs flex items-center gap-1"
                      >
                        📄 View Receipt
                      </a>
                    ) : (
                      <span className="text-zinc-500 italic text-xs">No receipt</span>
                    )}
                  </td>
                  <td className="p-4 text-right space-x-2">
                    {user?.role === 'admin' && (
                      <>
                        <button
                          onClick={() => handleOpenEdit(e)}
                          className="text-zinc-300 hover:text-emerald-400 font-semibold text-xs border border-zinc-700 hover:border-emerald-500/40 rounded px-2.5 py-1 transition-colors cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(e._id)}
                          className="text-red-400 hover:text-red-300 font-semibold text-xs border border-zinc-750 hover:border-red-900/40 rounded px-2.5 py-1 transition-colors cursor-pointer"
                        >
                          Delete
                        </button>
                      </>
                    )}
                    {user?.role !== 'admin' && (
                      <span className="text-zinc-500 text-xs italic">View Only</span>
                    )}
                  </td>
                </tr>
              ))}
              {expenses.length === 0 && (
                <tr>
                  <td colSpan="9" className="p-8 text-center text-zinc-500 italic">
                    No expense entries found.
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
              <h3 className="text-xl font-bold">{isEditing ? 'Edit Expense Record' : 'Record Trip Expense'}</h3>
              <p className="text-zinc-400 text-xs mt-1">Submit fuel transactions and receipt uploads for auditing.</p>
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
                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 p-2.5 text-sm focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">Choose Vehicle</option>
                    {vehicles.map((v) => (
                      <option key={v._id} value={v._id}>
                        {v.vehicleNumber} ({v.type})
                      </option>
                    ))}
                  </select>
                </div>

                {user?.role === 'admin' ? (
                  <div>
                    <label className="block text-sm font-medium mb-1">Select Driver</label>
                    <select
                      name="driver"
                      value={formData.driver}
                      onChange={handleChange}
                      required
                      className="w-full rounded-lg bg-zinc-800 border border-zinc-700 p-2.5 text-sm focus:outline-none focus:border-emerald-500"
                    >
                      <option value="">Choose Driver</option>
                      {drivers.map((d) => (
                        <option key={d._id} value={d._id}>
                          {d.name?.name || 'Unknown Driver'}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium mb-1">Date</label>
                    <input
                      type="date"
                      name="expenseDate"
                      value={formData.expenseDate}
                      onChange={handleChange}
                      required
                      className="w-full rounded-lg bg-zinc-800 border border-zinc-700 p-2.5 text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                )}
              </div>

              {user?.role === 'admin' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Expense Date</label>
                  <input
                    type="date"
                    name="expenseDate"
                    value={formData.expenseDate}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 p-2.5 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Fuel (Liters)</label>
                  <input
                    type="number"
                    name="fuelLiters"
                    value={formData.fuelLiters}
                    onChange={handleChange}
                    required
                    placeholder="e.g. 50"
                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 p-2.5 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Fuel Cost ($)</label>
                  <input
                    type="number"
                    name="fuelCost"
                    value={formData.fuelCost}
                    onChange={handleChange}
                    required
                    placeholder="e.g. 150"
                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 p-2.5 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Misc. Cost ($)</label>
                  <input
                    type="number"
                    name="miscExpense"
                    value={formData.miscExpense}
                    onChange={handleChange}
                    placeholder="e.g. 20"
                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 p-2.5 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Upload Receipt</label>
                <div className="flex gap-4 items-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="block w-full text-xs text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-950/40 file:text-emerald-400 hover:file:bg-emerald-900/30 cursor-pointer disabled:opacity-50"
                  />
                  {uploading && <span className="text-xs text-zinc-400 animate-pulse">Uploading to ImageKit...</span>}
                </div>
                {formData.receiptUrl && (
                  <p className="text-xs text-emerald-400 mt-2 font-semibold">✔ Receipt linked: {formData.receiptUrl.substring(0, 45)}...</p>
                )}
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
                  disabled={uploading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isEditing ? 'Update Record' : 'Record Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
