import Vehicle from '../Models/Vehicle.js';
import Driver from '../Models/Driver.js';

/**
 * Atomically sync the Driver↔Vehicle assignment in both directions.
 *
 * @param {Object|null} session  - MongoDB transaction session (pass null to skip transactions)
 * @param {string}      vehicleId      - The vehicle being updated
 * @param {string|null} newDriverUserId - The User ID of the driver to assign (null to unassign)
 */
export async function syncVehicleDriverAssignment(session, vehicleId, newDriverUserId) {
  const vehicle = await Vehicle.findById(vehicleId).session(session);
  if (!vehicle) return;

  const prevDriverUserId = vehicle.assignedDriver?.toString() ?? null;
  const nextDriverUserId = newDriverUserId?.toString() ?? null;

  if (prevDriverUserId === nextDriverUserId) return;

  const opts = session ? { session } : {};

  // 1. Clear the old driver's assignedVehicle (if any)
  if (prevDriverUserId) {
    await Driver.findOneAndUpdate(
      { user: prevDriverUserId },
      { assignedVehicle: null },
      opts
    );
  }

  // 2. If assigning a new driver, handle displaced driver on the target vehicle
  if (nextDriverUserId) {
    const incomingDriver = await Driver.findOne({ user: nextDriverUserId }).session(session);
    if (incomingDriver?.assignedVehicle) {
      const oldVehicleId = incomingDriver.assignedVehicle.toString();
      if (oldVehicleId !== vehicleId.toString()) {
        await Vehicle.findByIdAndUpdate(oldVehicleId, { assignedDriver: null }, opts);
      }
    }

    await Driver.findOneAndUpdate(
      { user: nextDriverUserId },
      { assignedVehicle: vehicleId },
      opts
    );
  }

  // 3. Update the vehicle's assignedDriver field
  await Vehicle.findByIdAndUpdate(
    vehicleId,
    { assignedDriver: nextDriverUserId },
    opts
  );
}
