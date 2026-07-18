import { useState, useEffect } from 'react';
import { FaMagnifyingGlass } from 'react-icons/fa6';
import vehicleService from '../services/vehicleService';
import driverService from '../services/driverService';

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal / Form States
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [formData, setFormData] = useState({
    vehicleNumber: '',
    type: 'Box Truck',
    capacity: '',
    fuelStatus: 100,
    maintenanceStatus: 'Satisfactory',
    assignedDriver: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const vehicleList = await vehicleService.getVehicles();
      setVehicles(vehicleList);

      const driverList = await driverService.getDrivers();
      setDrivers(driverList);
    } catch (err) {
      setError('Failed to load vehicles or drivers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleOpenAdd = () => {
    setFormData({
      vehicleNumber: '',
      type: 'Box Truck',
      capacity: '',
      fuelStatus: 100,
      maintenanceStatus: 'Satisfactory',
      assignedDriver: '',
    });
    setIsEditing(false);
    setShowModal(true);
  };

  const handleOpenEdit = (v) => {
    setFormData({
      vehicleNumber: v.vehicleNumber,
      type: v.type,
      capacity: v.capacity,
      fuelStatus: v.fuelStatus || 100,
      maintenanceStatus: v.maintenanceStatus || 'Satisfactory',
      assignedDriver: v.assignedDriver ? v.assignedDriver._id : '',
    });
    setCurrentId(v._id);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const payload = {
      ...formData,
      capacity: Number(formData.capacity),
      fuelStatus: Number(formData.fuelStatus),
      assignedDriver: formData.assignedDriver || null,
    };

    try {
      if (isEditing) {
        await vehicleService.updateVehicle(currentId, payload);
        setSuccess('Vehicle updated successfully');
      } else {
        await vehicleService.createVehicle(payload);
        setSuccess('Vehicle created successfully');
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this vehicle?')) return;
    try {
      await vehicleService.deleteVehicle(id);
      setSuccess('Vehicle deleted successfully');
      loadData();
    } catch (err) {
      setError('Failed to delete vehicle');
    }
  };

  const filteredVehicles = vehicles.filter((vehicle) => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return true;

    return [
      vehicle.vehicleNumber,
      vehicle.type,
      vehicle.capacity,
      vehicle.fuelStatus,
      vehicle.maintenanceStatus,
      vehicle.availability ? 'available' : 'unavailable',
      vehicle.assignedDriver?.name,
      vehicle.assignedDriver?.email,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query));
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vehicles Management</h1>
          <p className="text-zinc-400 text-sm">Create, monitor and assign vehicles in your fleet.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors cursor-pointer text-sm"
        >
          + Add Vehicle
        </button>
      </div>

      {error && <div className="bg-red-950/40 border border-red-800/40 text-red-500 p-4 rounded-lg text-sm">{error}</div>}
      {success && <div className="bg-emerald-950/40 border border-emerald-800/40 text-black p-4 rounded-lg text-sm">{success}</div>}

      <div className="relative rounded-lg border border-slate-200 bg-white shadow-sm">
        <FaMagnifyingGlass className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search vehicles by number, type, fuel, maintenance, driver..."
          className="w-full rounded-lg bg-transparent py-3 pl-11 pr-4 text-sm focus:outline-none"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-zinc-400 text-sm">Loading vehicles data...</div>
      ) : (
        <div className="overflow-x-auto bg-zinc-900/40 border border-zinc-800 rounded-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400 text-xs font-semibold uppercase tracking-wider bg-zinc-900/80">
                <th className="p-4">Vehicle Number</th>
                <th className="p-4">Type</th>
                <th className="p-4">Capacity (kg)</th>
                <th className="p-4">Fuel Status</th>
                <th className="p-4">Maintenance</th>
                <th className="p-4">Availability</th>
                <th className="p-4">Assigned Driver</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-850 text-sm">
              {filteredVehicles.map((v) => (
                <tr key={v._id} className="hover:bg-zinc-900/30 transition-colors">
                  <td className="p-4 font-mono font-semibold text-black">{v.vehicleNumber}</td>
                  <td className="p-4">{v.type}</td>
                  <td className="p-4">{v.capacity.toLocaleString()}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-zinc-800 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${v.fuelStatus < 20 ? 'bg-red-500' : v.fuelStatus < 50 ? 'bg-yellow-500' : 'bg-emerald-500'}`}
                          style={{ width: `${v.fuelStatus}%` }}
                        />
                      </div>
                      <span className="text-xs text-zinc-300 font-semibold">{v.fuelStatus}%</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${v.maintenanceStatus === 'Satisfactory'
                        ? 'bg-emerald-950/30 text-black border-emerald-900/40'
                        : v.maintenanceStatus === 'Service Due'
                          ? 'bg-yellow-950/30 text-yellow-400 border-yellow-900/40'
                          : 'bg-red-950/30 text-red-400 border-red-900/40'
                        }`}
                    >
                      {v.maintenanceStatus}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`h-2.5 w-2.5 rounded-full inline-block mr-2 ${v.availability ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    {v.availability ? 'Available' : 'Unavailable'}
                  </td>
                  <td className="p-4 text-zinc-300">
                    {v.assignedDriver ? v.assignedDriver.name : <span className="text-zinc-500 italic">None</span>}
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button
                      onClick={() => handleOpenEdit(v)}
                      className="text-zinc-300 hover:text-black font-semibold text-xs border border-zinc-700 hover:border-emerald-500/40 rounded px-2.5 py-1 transition-colors cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(v._id)}
                      className="text-red-400 hover:text-red-300 font-semibold text-xs border border-zinc-750 hover:border-red-900/40 rounded px-2.5 py-1 transition-colors cursor-pointer"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {filteredVehicles.length === 0 && (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-zinc-500 italic">
                    {vehicles.length === 0 ? 'No vehicles found. Click "+ Add Vehicle" to register one.' : 'No vehicles match your search.'}
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
              <h3 className="text-xl font-bold">{isEditing ? 'Edit Vehicle Details' : 'Register New Vehicle'}</h3>
              <p className="text-zinc-400 text-xs mt-1">Please enter the technical details and driver assignment.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Vehicle Number</label>
                <input
                  type="text"
                  name="vehicleNumber"
                  value={formData.vehicleNumber}
                  onChange={handleChange}
                  required
                  placeholder="e.g. MH-12-AB-1234"
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 p-2.5 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Vehicle Type</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 p-2.5 text-sm focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Semi-Truck">Semi-Truck</option>
                    <option value="Box Truck">Box Truck</option>
                    <option value="Cargo Van">Cargo Van</option>
                    <option value="Flatbed">Flatbed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Capacity (kg)</label>
                  <input
                    type="number"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleChange}
                    required
                    placeholder="e.g. 5000"
                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 p-2.5 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Fuel Status (%)</label>
                  <input
                    type="number"
                    name="fuelStatus"
                    value={formData.fuelStatus}
                    onChange={handleChange}
                    min="0"
                    max="100"
                    required
                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 p-2.5 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Maintenance Status</label>
                  <select
                    name="maintenanceStatus"
                    value={formData.maintenanceStatus}
                    onChange={handleChange}
                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 p-2.5 text-sm focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Satisfactory">Satisfactory</option>
                    <option value="Service Due">Service Due</option>
                    <option value="Under Repair">Under Repair</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Assign Driver</label>
                <select
                  name="assignedDriver"
                  value={formData.assignedDriver}
                  onChange={handleChange}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 p-2.5 text-sm focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Unassigned</option>
                  {drivers
                    .filter((d) => {
                      const isFree = !d.assignedVehicle;
                      const isCurrentDriver = isEditing && (d.user?._id || d._id) === formData.assignedDriver;
                      return isFree || isCurrentDriver;
                    })
                    .map((d) => (
                      <option key={d._id} value={d.user?._id || d._id}>
                        {d.user?.name || 'Unknown Driver'} ({d.licenseNumber})
                      </option>
                    ))}
                </select>
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
                  {isEditing ? 'Save Changes' : 'Register Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
