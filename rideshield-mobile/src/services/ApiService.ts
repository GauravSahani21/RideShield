import { RideRecord, IncidentEvent, EmergencyContact, LocationData } from '../types';

// Replace with your local machine's IP (e.g. http://192.168.1.5:4000) when testing on a physical phone
const BACKEND_BASE_URL = 'http://localhost:4000';

export class ApiService {
  /**
   * Sync a completed ride record with the cloud backend
   */
  public static async syncRide(ride: RideRecord): Promise<boolean> {
    try {
      const response = await fetch(`${BACKEND_BASE_URL}/api/rides`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ride),
      });
      return response.ok;
    } catch (err) {
      // Backend is optional for standalone offline operation
      console.log('Backend sync skipped or offline:', err);
      return false;
    }
  }

  /**
   * Transmit SOS alert webhook to the emergency cloud gateway
   */
  public static async dispatchSosCloud(
    incident: IncidentEvent,
    contacts: EmergencyContact[],
    location?: LocationData | null
  ): Promise<boolean> {
    try {
      const response = await fetch(`${BACKEND_BASE_URL}/api/sos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ incident, contacts, location }),
      });
      return response.ok;
    } catch (err) {
      console.log('Cloud SOS gateway offline, native SMS used:', err);
      return false;
    }
  }
}
