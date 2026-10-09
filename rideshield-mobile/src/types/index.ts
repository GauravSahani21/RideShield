export type RideState =
  | 'IDLE'
  | 'RIDE_ACTIVE'
  | 'MONITORING'
  | 'POSSIBLE_CRASH'
  | 'EMERGENCY_COUNTDOWN'
  | 'CANCELLED'
  | 'SOS_PENDING'
  | 'SOS_TRIGGERED'
  | 'INCIDENT_LOGGED';

export type IncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type IncidentType =
  | 'NORMAL'
  | 'HARD_BRAKING'
  | 'HARD_CORNERING'
  | 'POTHOLE'
  | 'SUDDEN_ACCELERATION'
  | 'POSSIBLE_CRASH'
  | 'LOW_SIDE_CRASH'
  | 'HIGH_SIDE_CRASH'
  | 'RIDER_SEPARATION'
  | 'VEHICLE_ROLLOVER'
  | 'MANUAL_SOS';

export type SosDeliveryStatus =
  | 'SOS_GENERATED'
  | 'SOS_SENDING'
  | 'SOS_SENT'
  | 'SOS_FAILED';

export interface DeviceSensorCapabilities {
  accelerometer: boolean;
  gyroscope: boolean;
  gps: boolean;
  magnetometer: boolean;
  barometer: boolean;
  batteryLevel?: number;
  locationPermissionGranted: boolean;
}

export interface NormalizedSensorRecord {
  timestamp: number;
  accelX: number;
  accelY: number;
  accelZ: number;
  accelMagnitude: number;
  gyroX: number;
  gyroY: number;
  gyroZ: number;
  gyroMagnitude: number;
  latitude: number | null;
  longitude: number | null;
  speed: number | null; // km/h
  locationAccuracy: number | null;
  // Computed features
  jerk?: number;
  tiltAngleDeg?: number;
  leanAngleDeg?: number; // calibrated lean angle: -90 (left) to +90 (right)
  leanDirection?: 'LEFT' | 'RIGHT' | 'CENTER';
  leanState?: 'NORMAL' | 'CAUTION' | 'HIGH';
}

export type GpsSignalState = 'CONNECTED' | 'WEAK_SIGNAL' | 'UNAVAILABLE';

export interface LocationData {
  latitude: number;
  longitude: number;
  altitude?: number | null;
  speed?: number | null; // m/s
  accuracy?: number | null;
  heading?: number | null; // degrees from north
  timestamp: number;
  address?: string;
  signalState?: GpsSignalState;
  isLastKnown?: boolean;
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  priority: number; // 1 = highest
  active: boolean;
}

export interface IncidentEvent {
  id: string;
  rideId?: string;
  timestamp: number;
  type: IncidentType;
  severity: IncidentSeverity;
  confidence: number; // 0 to 100%
  description: string;
  reasons: string[]; // Explainable reasons for detection
  peakAccelG: number;
  peakGyroRads: number;
  speedAtEventKmh: number;
  location: LocationData | null;
  countdownSeconds: number;
  wasCancelled: boolean;
  cancelledAt?: number;
  sosTriggered: boolean;
  sosDeliveryStatus?: SosDeliveryStatus;
  preImpactBuffer?: NormalizedSensorRecord[]; // Last 5-8 seconds of IMU data
}

export interface CoachingFeedback {
  category: 'BRAKING' | 'CORNERING' | 'PACE' | 'GENERAL';
  title: string;
  advice: string;
  type: 'POSITIVE' | 'CAUTION' | 'INFO';
}

export interface RidePathPoint {
  latitude: number;
  longitude: number;
  timestamp: number;
  speedKmh?: number;
  leanAngleDeg?: number;
}

export interface RideRecord {
  id: string;
  userId?: string;
  startTime: number;
  endTime?: number;
  durationSeconds: number;
  distanceKm: number;
  maxSpeedKmh: number;
  avgSpeedKmh: number;
  safetyScore: number; // 0 to 100
  scoreBreakdown: {
    base: number;
    hardBrakingPenalty: number;
    hardCorneringPenalty: number;
    potholePenalty: number;
    crashPenalty: number;
  };
  eventCounts: {
    hardBraking: number;
    hardCornering: number;
    potholes: number;
    suddenAcceleration: number;
    crashes: number;
  };
  incidents: IncidentEvent[];
  coachingTips: CoachingFeedback[];
  path?: RidePathPoint[];
  originTripId?: string;
  originTripName?: string;
  plannedDistanceKm?: number;
  plannedDurationMinutes?: number;
  hazardsEncountered?: number;
}


export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  authProvider: 'LOCAL' | 'GOOGLE' | 'LOCAL_AND_GOOGLE';
  profileImageUrl?: string;
  onboardingCompleted: boolean;
  bloodGroup?: string;
}

export interface AppSettings {
  sensitivity: 'LOW' | 'MEDIUM' | 'HIGH';
  countdownDurationSeconds: number; // 20 - 30 seconds
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  notificationsEnabled: boolean;
  autoSendSms: boolean;
  testSimulationMode: boolean;
  units: 'KMH' | 'MPH';
  leanAngleCautionDeg?: number; // default 35
  leanAngleHighDeg?: number; // default 48
  hazardWarningRadiusM?: number; // default 200m
}

// ----------------------------------------------------
// SMARTPHONE MOUNT & RELATIVE ORIENTATION CALIBRATION
// ----------------------------------------------------
export interface PhoneMountCalibrationProfile {
  calibrated: boolean;
  baselineOrientation: {
    pitch: number; // forward/backward tilt (degrees)
    roll: number;  // left/right lean (degrees)
    yaw?: number;
  };
  baselineGravity: {
    x: number;
    y: number;
    z: number;
  };
  sensorVariance: {
    accel: number;
    gyro: number;
  };
  calibratedAt: number;
  deviceModel?: string;
}

// ----------------------------------------------------
// ROAD HAZARD & ROAD-RISK INTELLIGENCE
// ----------------------------------------------------
export type RoadHazardType =
  | 'POTHOLE'
  | 'ROUGH_ROAD'
  | 'SEVERE_BUMP'
  | 'ACCIDENT'
  | 'DEBRIS'
  | 'CONSTRUCTION'
  | 'FLOODED_ROAD'
  | 'BLOCKED_ROAD';

export type RoadHazardSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type RoadHazardStatus = 'TENTATIVE' | 'CONFIRMED' | 'AGED' | 'RESOLVED';

export interface RoadHazard {
  id: string;
  type: RoadHazardType;
  latitude: number;
  longitude: number;
  severity: RoadHazardSeverity;
  confidence: number; // 0 to 100%
  reportCount: number;
  firstDetected: number;
  lastDetected: number;
  status: RoadHazardStatus;
  source: 'SENSOR_AUTODETECT' | 'USER_REPORT' | 'SHARED_COMMUNITY';
  address?: string;
  recommendedSpeedKmh?: number;
}

export interface HazardWarningAlert {
  hazard: RoadHazard;
  distanceMeters: number;
  recommendedAction: string;
  severity: RoadHazardSeverity;
}

// ----------------------------------------------------
// TRIP PLANNER & GOOGLE MAPS NAVIGATION
// ----------------------------------------------------
export interface TripStop {
  id: string;
  sequence: number;
  name: string;
  latitude: number;
  longitude: number;
  address?: string;
  placeId?: string;
  locked: boolean; // if true, user locked order
}

export interface RouteOption {
  id: string;
  name: string;
  distanceKm: number;
  durationMinutes: number;
  hazardCount: number;
  safetyScore: number; // 0 - 100
  isFastest: boolean;
  isSafer: boolean;
  polyline: string;
  summary: string;
  steps?: NavigationStep[];
}

export interface NavigationStep {
  instruction: string;
  maneuver: string; // 'turn-left' | 'turn-right' | 'straight' | 'merge' | 'arrive'
  distanceMeters: number;
  durationSeconds: number;
  startLocation: { latitude: number; longitude: number };
  endLocation: { latitude: number; longitude: number };
}

export interface TripPlan {
  id: string;
  name: string;
  startLocation: LocationData;
  destination: TripStop;
  stops: TripStop[];
  selectedRoute?: RouteOption;
  availableRoutes: RouteOption[];
  avoidTolls: boolean;
  avoidHighways: boolean;
  preferSaferRoutes: boolean;
  createdAt: number;
}

export interface PlaceSearchResult {
  placeId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  category?: string;
}
