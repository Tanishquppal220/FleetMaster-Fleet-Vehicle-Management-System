import { useState, useEffect } from 'react';
import { FaMagnifyingGlass } from 'react-icons/fa6';
import driverService from '../services/driverService';
import vehicleService from '../services/vehicleService';
import uploadService from '../services/uploadService';

export default function DriversPage() {
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal / Editing States
  const [showModal, setShowModal] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [formData, setFormData] = useState({
    status: 'Available',
    experience: 0,
    licenseNumber: '',
    licensePhoto: '',
    assignedVehicle: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const driverList = await driverService.getDrivers();
      setDrivers(driverList);

      const vehicleList = await vehicleService.getVehicles();
      setVehicles(vehicleList.filter(v => v.availability));
    } catch (err) {
      setError('Failed to load drivers or available vehicles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenEdit = (d) => {
    setFormData({
      status: d.status || 'Available',
      experience: d.experience || 0,
      licenseNumber: d.licenseNumber || '',
      licensePhoto: d.licensePhoto || '',
      assignedVehicle: d.assignedVehicle ? d.assignedVehicle._id : '',
    });
    setCurrentId(d._id);
    setShowModal(true);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLicenseUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      setError('');
      const res = await uploadService.uploadImage(file);
      setFormData((prev) => ({ ...prev, licensePhoto: res.url }));
      setSuccess('License photo uploaded to ImageKit. Save the driver record to apply it.');
    } catch (err) {
      setError(err.response?.data?.message || 'License photo upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const payload = {
      ...formData,
      experience: Number(formData.experience),
      assignedVehicle: formData.assignedVehicle || null,
    };

    try {
      await driverService.updateDriverStatus(currentId, payload);
      setSuccess('Driver profile updated successfully');
      setShowModal(false);
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update driver');
    }
  };

  const filteredDrivers = drivers.filter((driver) => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return true;

    return [
      driver.user?.name,
      driver.user?.email,
      driver.user?.phone,
      driver.licenseNumber,
      driver.experience,
      driver.status,
      driver.assignedVehicle?.vehicleNumber,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query));
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Driver Records</h1>
        <p className="text-zinc-400 text-sm">Monitor driver statuses, CDL licenses, and vehicle assignments.</p>
      </div>

      {error && <div className="bg-red-950/40 border border-red-800/40 text-red-500 p-4 rounded-lg text-sm">{error}</div>}
      {success && <div className="bg-emerald-950/40 border border-emerald-800/40 text-black p-4 rounded-lg text-sm">{success}</div>}

      <div className="relative rounded-lg border border-slate-200 bg-white shadow-sm">
        <FaMagnifyingGlass className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search drivers by name, email, phone, license, status, vehicle..."
          className="w-full rounded-lg bg-transparent py-3 pl-11 pr-4 text-sm focus:outline-none"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-zinc-400 text-sm">Loading driver directory...</div>
      ) : (
        <div className="overflow-x-auto bg-zinc-900/40 border border-zinc-800 rounded-xl">
          <table className="w-full min-w-[1320px] text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400 text-xs font-semibold uppercase tracking-wider bg-zinc-900/80">
                <th className="p-4">Avatar</th>
                <th className="p-4">Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Phone</th>
                <th className="p-4">License Number</th>
                <th className="p-4">License Photo</th>
                <th className="p-4">Experience</th>
                <th className="p-4 min-w-40">Status</th>
                <th className="p-4">Assigned Vehicle</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-850 text-sm">
              {filteredDrivers.map((d) => (
                <tr key={d._id} className="hover:bg-zinc-900/30 transition-colors">
                  <td className="p-4">
                    {d.user?.avatar ? (
                      <img
                        src={d.user.avatar}
                        alt="avatar"
                        className="h-10 w-10 rounded-full object-cover border border-zinc-800"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-emerald-950/40 border border-emerald-900 flex items-center justify-center font-bold text-black uppercase">
                        {(d.user?.name || 'D').slice(0, 2)}
                      </div>
                    )}
                  </td>
                  <td className="p-4 font-semibold text-zinc-200">{d.user?.name || 'Unknown User'}</td>
                  <td className="p-4 text-zinc-400">{d.user?.email || 'N/A'}</td>
                  <td className="p-4 text-zinc-400">{d.user?.phone || 'N/A'}</td>
                  <td className="p-4 font-mono text-zinc-300">{d.licenseNumber}</td>
                  <td className="p-4">
                    {d.licensePhoto ? (
                      <a href={d.licensePhoto} target="_blank" rel="noreferrer" className="text-black hover:underline font-semibold text-xs">
                        View License
                      </a>
                    ) : (
                      <span className="text-zinc-500 italic text-xs">Not uploaded</span>
                    )}
                  </td>
                  <td className="p-4 text-zinc-300">{d.experience} years</td>
                  <td className="p-4 min-w-40">
                    <span
                      className={`inline-flex min-w-28 items-center justify-center whitespace-nowrap rounded-full border px-3 py-1 text-xs font-semibold leading-none ${d.status === 'Available'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : d.status === 'On Trip'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : d.status === 'In Maintenance'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                    >
                      {d.status}
                    </span>
                  </td>
                  <td className="p-4 text-black font-mono font-semibold">
                    {d.assignedVehicle ? d.assignedVehicle.vehicleNumber : <span className="text-zinc-500 italic">None</span>}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleOpenEdit(d)}
                      className="text-zinc-300 hover:text-black font-semibold text-xs border border-zinc-700 hover:border-emerald-500/40 rounded px-2.5 py-1 transition-colors cursor-pointer"
                    >
                      Edit Profile
                    </button>
                  </td>
                </tr>
              ))}
              {filteredDrivers.length === 0 && (
                <tr>
                  <td colSpan="10" className="p-8 text-center text-zinc-500 italic">
                    {drivers.length === 0 ? 'No registered drivers found.' : 'No drivers match your search.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Driver Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-6">
            <div>
              <h3 className="text-xl font-bold">Edit Driver Record</h3>
              <p className="text-zinc-400 text-xs mt-1">Modify professional status, commercial license, or vehicle deployment.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Commercial License (CDL)</label>
                <input
                  type="text"
                  name="licenseNumber"
                  value={formData.licenseNumber}
                  onChange={handleChange}
                  required
                  placeholder="CDL number"
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 p-2.5 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
                <label className="block text-sm font-medium mb-2">Driving License Photo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLicenseUpload}
                  disabled={uploading}
                  className="block w-full text-xs text-zinc-400 file:mr-4 file:rounded-lg file:border-0 file:bg-emerald-600 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white disabled:opacity-50"
                />
                {uploading && <p className="mt-2 text-xs text-zinc-400">Uploading license photo to ImageKit...</p>}
                {formData.licensePhoto && (
                  <a href={formData.licensePhoto} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs font-semibold text-black hover:underline">
                    View uploaded license photo
                  </a>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Years Experience</label>
                  <input
                    type="number"
                    name="experience"
                    value={formData.experience}
                    onChange={handleChange}
                    min="0"
                    required
                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 p-2.5 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Deployment Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 p-2.5 text-sm focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Available">Available</option>
                    <option value="On Trip">On Trip</option>
                    <option value="In Maintenance">In Maintenance</option>
                    <option value="Off Duty">Off Duty</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Assign Fleet Vehicle</label>
                <select
                  name="assignedVehicle"
                  value={formData.assignedVehicle}
                  onChange={handleChange}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 p-2.5 text-sm focus:outline-none focus:border-emerald-500"
                >
                  <option value="">No Vehicle Assigned</option>
                  {vehicles.map((v) => (
                    <option key={v._id} value={v._id}>
                      {v.vehicleNumber} - {v.type} ({v.capacity}kg capacity)
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
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
