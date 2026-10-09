import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  EmergencyContact,
  RideRecord,
  AppSettings,
  PhoneMountCalibrationProfile,
  RoadHazard,
  TripPlan,
  PlaceSearchResult,
} from '../types';

const CONTACTS_KEY = '@rideshield_contacts';
const RIDES_KEY = '@rideshield_rides';
const SETTINGS_KEY = '@rideshield_settings';
const CALIBRATION_KEY = '@rideshield_phone_calibration';
const HAZARDS_KEY = '@rideshield_road_hazards';
const SAVED_PLACES_KEY = '@rideshield_saved_places';
const TRIPS_KEY = '@rideshield_trips';

export const DEFAULT_SETTINGS: AppSettings = {
  sensitivity: 'MEDIUM',
  countdownDurationSeconds: 25,
  soundEnabled: true,
  vibrationEnabled: true,
  notificationsEnabled: true,
  autoSendSms: true,
  testSimulationMode: false,
  units: 'KMH',
  leanAngleCautionDeg: 35,
  leanAngleHighDeg: 48,
  hazardWarningRadiusM: 200,
};

export const DEFAULT_CONTACTS: EmergencyContact[] = [
  {
    id: '1',
    name: 'Emergency Services / ICE',
    phone: '911',
    relationship: 'Emergency Response',
    priority: 1,
    active: true,
  },
  {
    id: '2',
    name: 'Family Contact',
    phone: '+1 555-0199',
    relationship: 'Family',
    priority: 2,
    active: true,
  },
];

export const INITIAL_ROAD_HAZARDS: RoadHazard[] = [
  {
    id: 'hazard-seed-1',
    type: 'POTHOLE',
    latitude: 37.7749,
    longitude: -122.4194,
    severity: 'HIGH',
    confidence: 94,
    reportCount: 5,
    firstDetected: Date.now() - 3600000 * 24,
    lastDetected: Date.now() - 3600000 * 2,
    status: 'CONFIRMED',
    source: 'SHARED_COMMUNITY',
    address: 'Market St & 7th Ave Crossing',
    recommendedSpeedKmh: 30,
  },
  {
    id: 'hazard-seed-2',
    type: 'ROUGH_ROAD',
    latitude: 37.779,
    longitude: -122.414,
    severity: 'MEDIUM',
    confidence: 88,
    reportCount: 3,
    firstDetected: Date.now() - 3600000 * 48,
    lastDetected: Date.now() - 3600000 * 5,
    status: 'CONFIRMED',
    source: 'SENSOR_AUTODETECT',
    address: 'Expressway Sector 4 Incline',
    recommendedSpeedKmh: 45,
  },
  {
    id: 'hazard-seed-3',
    type: 'POTHOLE',
    latitude: 12.9716,
    longitude: 77.5946,
    severity: 'CRITICAL',
    confidence: 96,
    reportCount: 8,
    firstDetected: Date.now() - 3600000 * 12,
    lastDetected: Date.now() - 1800000,
    status: 'CONFIRMED',
    source: 'SHARED_COMMUNITY',
    address: 'Outer Ring Rd Flyover Entry',
    recommendedSpeedKmh: 25,
  },
];

export class StorageService {
  public static async getContacts(): Promise<EmergencyContact[]> {
    try {
      const data = await AsyncStorage.getItem(CONTACTS_KEY);
      if (data) return JSON.parse(data);
      await AsyncStorage.setItem(CONTACTS_KEY, JSON.stringify(DEFAULT_CONTACTS));
      return DEFAULT_CONTACTS;
    } catch {
      return DEFAULT_CONTACTS;
    }
  }

  public static async saveContacts(contacts: EmergencyContact[]): Promise<void> {
    await AsyncStorage.setItem(CONTACTS_KEY, JSON.stringify(contacts));
  }

  public static async getRides(): Promise<RideRecord[]> {
    try {
      const data = await AsyncStorage.getItem(RIDES_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public static async saveRide(ride: RideRecord): Promise<void> {
    const rides = await this.getRides();
    const updated = [ride, ...rides.filter((r) => r.id !== ride.id)];
    await AsyncStorage.setItem(RIDES_KEY, JSON.stringify(updated.slice(0, 50)));
  }

  public static async getSettings(): Promise<AppSettings> {
    try {
      const data = await AsyncStorage.getItem(SETTINGS_KEY);
      if (data) return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
      return DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  public static async saveSettings(settings: AppSettings): Promise<void> {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }

  // ----------------------------------------------------
  // CALIBRATION PERSISTENCE
  // ----------------------------------------------------
  public static async getCalibrationProfile(): Promise<PhoneMountCalibrationProfile | null> {
    try {
      const data = await AsyncStorage.getItem(CALIBRATION_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  public static async saveCalibrationProfile(profile: PhoneMountCalibrationProfile): Promise<void> {
    await AsyncStorage.setItem(CALIBRATION_KEY, JSON.stringify(profile));
  }

  public static async clearCalibrationProfile(): Promise<void> {
    await AsyncStorage.removeItem(CALIBRATION_KEY);
  }

  // ----------------------------------------------------
  // ROAD HAZARDS PERSISTENCE
  // ----------------------------------------------------
  public static async getRoadHazards(): Promise<RoadHazard[]> {
    try {
      const data = await AsyncStorage.getItem(HAZARDS_KEY);
      if (data) return JSON.parse(data);
      await AsyncStorage.setItem(HAZARDS_KEY, JSON.stringify(INITIAL_ROAD_HAZARDS));
      return INITIAL_ROAD_HAZARDS;
    } catch {
      return INITIAL_ROAD_HAZARDS;
    }
  }

  public static async saveRoadHazards(hazards: RoadHazard[]): Promise<void> {
    await AsyncStorage.setItem(HAZARDS_KEY, JSON.stringify(hazards.slice(0, 200)));
  }

  // ----------------------------------------------------
  // SAVED PLACES (HOME, WORK, FAVORITES)
  // ----------------------------------------------------
  public static async getSavedPlaces(): Promise<PlaceSearchResult[]> {
    try {
      const data = await AsyncStorage.getItem(SAVED_PLACES_KEY);
      if (data) return JSON.parse(data);
      const defaults: PlaceSearchResult[] = [
        {
          placeId: 'saved-home',
          name: 'Home',
          address: '42 Pine Crest Ave',
          latitude: 37.7749,
          longitude: -122.4194,
          category: 'Home',
        },
        {
          placeId: 'saved-work',
          name: 'Work / Campus',
          address: 'Tech Innovation Hub, Tower 2',
          latitude: 37.7891,
          longitude: -122.4014,
          category: 'Work',
        },
      ];
      await AsyncStorage.setItem(SAVED_PLACES_KEY, JSON.stringify(defaults));
      return defaults;
    } catch {
      return [];
    }
  }

  public static async saveSavedPlaces(places: PlaceSearchResult[]): Promise<void> {
    await AsyncStorage.setItem(SAVED_PLACES_KEY, JSON.stringify(places));
  }

  // ----------------------------------------------------
  // PLANNED TRIPS PERSISTENCE
  // ----------------------------------------------------
  public static async getPlannedTrips(): Promise<TripPlan[]> {
    try {
      const data = await AsyncStorage.getItem(TRIPS_KEY);
      if (data) return JSON.parse(data);

      const initialPlannedTrips: TripPlan[] = [
        {
          id: 'planned-trip-1',
          name: 'Bangalore to Mysore Heritage Route',
          startLocation: {
            latitude: 12.9716,
            longitude: 77.5946,
            timestamp: Date.now(),
          },
          destination: {
            id: 'dest-mysore-palace',
            sequence: 3,
            name: 'Mysore Palace Heritage Gate',
            address: 'Sayyaji Rao Rd, Agrahara, Mysuru',
            latitude: 12.3051,
            longitude: 76.6551,
            locked: true,
          },
          stops: [
            {
              id: 'stop-channapatna',
              sequence: 1,
              name: 'Channapatna Craft & Refreshment Stop',
              address: 'BM Highway Mile 58',
              latitude: 12.6518,
              longitude: 77.2089,
              locked: false,
            },
            {
              id: 'stop-srirangapatna',
              sequence: 2,
              name: 'Srirangapatna River Bridge Lookout',
              address: 'Mysore Express Highway',
              latitude: 12.4238,
              longitude: 76.6946,
              locked: false,
            },
          ],
          avoidTolls: false,
          avoidHighways: false,
          preferSaferRoutes: true,
          createdAt: Date.now() - 86400000,
          selectedRoute: {
            id: 'route-mysore-express',
            name: 'Mysore Heritage Expressway',
            distanceKm: 142.5,
            durationMinutes: 145,
            hazardCount: 1,
            safetyScore: 92,
            isFastest: true,
            isSafer: false,
            polyline: '12.9716,77.5946|12.6518,77.2089|12.4238,76.6946|12.3051,76.6551',
            summary: 'Smooth multi-lane expressway with designated two-wheeler service lanes',
          },
          availableRoutes: [],
        },
        {
          id: 'planned-trip-2',
          name: 'Weekend Nandi Hills Sunrise Sprint',
          startLocation: {
            latitude: 12.9716,
            longitude: 77.5946,
            timestamp: Date.now(),
          },
          destination: {
            id: 'dest-nandi-peak',
            sequence: 2,
            name: 'Nandi Hills Scenic Peak Viewpoint',
            address: 'Chikkaballapur District',
            latitude: 13.3702,
            longitude: 77.6835,
            locked: true,
          },
          stops: [
            {
              id: 'stop-airport-toll',
              sequence: 1,
              name: 'Shell Fuel Station & Air Check',
              address: 'Airport Expressway Mile 22',
              latitude: 13.1986,
              longitude: 77.7066,
              locked: false,
            },
          ],
          avoidTolls: false,
          avoidHighways: false,
          preferSaferRoutes: true,
          createdAt: Date.now() - 172800000,
          selectedRoute: {
            id: 'route-nandi-scenic',
            name: 'Airport Bypass & Hill Climb',
            distanceKm: 61.2,
            durationMinutes: 72,
            hazardCount: 0,
            safetyScore: 98,
            isFastest: true,
            isSafer: true,
            polyline: '12.9716,77.5946|13.1986,77.7066|13.3702,77.6835',
            summary: 'Clean open tarmac with sweeping curves and low hazard incidence',
          },
          availableRoutes: [],
        },
      ];

      await AsyncStorage.setItem(TRIPS_KEY, JSON.stringify(initialPlannedTrips));
      return initialPlannedTrips;
    } catch {
      return [];
    }
  }

  public static async savePlannedTrip(trip: TripPlan): Promise<void> {
    const trips = await this.getPlannedTrips();
    const updated = [trip, ...trips.filter((t) => t.id !== trip.id)];
    await AsyncStorage.setItem(TRIPS_KEY, JSON.stringify(updated.slice(0, 50)));
  }

  public static async deletePlannedTrip(tripId: string): Promise<void> {
    const trips = await this.getPlannedTrips();
    const updated = trips.filter((t) => t.id !== tripId);
    await AsyncStorage.setItem(TRIPS_KEY, JSON.stringify(updated));
  }
}

