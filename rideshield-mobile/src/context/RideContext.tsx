import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  RideState,
  NormalizedSensorRecord,
  LocationData,
  IncidentEvent,
  RideRecord,
  EmergencyContact,
  AppSettings,
  UserProfile,
  DeviceSensorCapabilities,
  SosDeliveryStatus,
  PhoneMountCalibrationProfile,
  RoadHazard,
  HazardWarningAlert,
  TripPlan,
  TripStop,
  RouteOption,
  RidePathPoint,
} from '../types';
import { ISensorProvider } from '../services/sensors/ISensorProvider';
import { PhoneSensorProvider } from '../services/sensors/PhoneSensorProvider';
import { SimulatedSensorProvider, DemoScenario } from '../services/sensors/SimulatedSensorProvider';
import { BluetoothIMUProvider } from '../services/sensors/BluetoothIMUProvider';
import { CrashDetectionEngine } from '../services/CrashDetectionEngine';
import { emergencyAlertService } from '../services/EmergencyAlertService';
import { StorageService, DEFAULT_SETTINGS, INITIAL_ROAD_HAZARDS } from '../services/StorageService';
import { ApiService } from '../services/ApiService';
import { AuthService } from '../services/AuthService';
import { RiderCoachingEngine } from '../services/RiderCoachingEngine';
import { CalibrationService, CalibrationSample } from '../services/CalibrationService';
import { HazardIntelligenceService } from '../services/HazardIntelligenceService';
import { TripPlannerService } from '../services/TripPlannerService';

interface RideContextType {
  // State Machine
  state: RideState;
  user: UserProfile | null;
  sensorProvider: ISensorProvider;
  sensorCapabilities: DeviceSensorCapabilities | null;
  currentRecord: NormalizedSensorRecord | null;
  currentLocation: LocationData | null;
  activeRide: RideRecord | null;
  activeIncident: IncidentEvent | null;
  countdownRemaining: number;
  sosDeliveryStatus: SosDeliveryStatus;
  contacts: EmergencyContact[];
  settings: AppSettings;
  rideHistory: RideRecord[];
  safetyScore: number;

  // Phone Mount Calibration
  calibrationProfile: PhoneMountCalibrationProfile | null;
  isCalibrating: boolean;
  calibrationProgress: number; // 0 to 100
  calibrationError: string | null;
  startMountCalibration: () => Promise<boolean>;
  cancelMountCalibration: () => void;
  recalibrateMount: () => Promise<boolean>;

  // Lean Angle Monitoring
  currentLeanAngle: number;
  currentLeanDirection: 'LEFT' | 'RIGHT' | 'CENTER';
  currentLeanState: 'NORMAL' | 'CAUTION' | 'HIGH';

  // Road Hazards & Safety Intelligence
  hazards: RoadHazard[];
  activeHazardAlert: HazardWarningAlert | null;
  reportManualHazard: (type: RoadHazard['type'], address?: string) => Promise<RoadHazard>;
  dismissHazardAlert: () => void;

  // Trip Planning & In-App Navigation
  activeTrip: TripPlan | null;
  activeNavigationRoute: RouteOption | null;
  plannedTrips: TripPlan[];
  isNavigating: boolean;
  currentStepIndex: number;
  setTripPlan: (plan: TripPlan | null) => void;
  saveTripPlan: (plan: TripPlan) => Promise<void>;
  deleteTripPlan: (id: string) => Promise<void>;
  startNavigation: (route: RouteOption) => void;
  stopNavigation: () => void;
  startRideFromPlan: (plan: TripPlan, route?: RouteOption) => Promise<boolean>;

  // Standard Ride Actions
  loginUser: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  registerUser: (name: string, email: string, phone: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<boolean>;
  logoutUser: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  setSensorProviderType: (type: 'PHONE' | 'SIMULATOR' | 'BLUETOOTH') => void;
  checkDeviceHealth: () => Promise<DeviceSensorCapabilities>;
  startRide: () => Promise<boolean>;
  endRide: () => Promise<RideRecord | null>;
  cancelAlert: () => Promise<void>;
  triggerManualSos: () => Promise<void>;
  runDemoScenario: (scenario: DemoScenario) => void;
  updateSettings: (newSettings: AppSettings) => Promise<void>;
  saveContact: (contact: EmergencyContact) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
}

const RideContext = createContext<RideContextType | undefined>(undefined);

export const RideProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<RideState>('IDLE');
  const [user, setUser] = useState<UserProfile | null>(null);

  // Sensor provider abstraction
  const phoneProvider = useRef<PhoneSensorProvider>(new PhoneSensorProvider()).current;
  const simProvider = useRef<SimulatedSensorProvider>(new SimulatedSensorProvider()).current;
  const bleProvider = useRef<BluetoothIMUProvider>(new BluetoothIMUProvider()).current;
  const [currentProvider, setCurrentProvider] = useState<ISensorProvider>(phoneProvider);
  const [sensorCapabilities, setSensorCapabilities] = useState<DeviceSensorCapabilities | null>(null);

  const [currentRecord, setCurrentRecord] = useState<NormalizedSensorRecord | null>(null);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [activeRide, setActiveRide] = useState<RideRecord | null>(null);
  const [activeIncident, setActiveIncident] = useState<IncidentEvent | null>(null);
  const [countdownRemaining, setCountdownRemaining] = useState<number>(25);
  const [sosDeliveryStatus, setSosDeliveryStatus] = useState<SosDeliveryStatus>('SOS_GENERATED');
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [rideHistory, setRideHistory] = useState<RideRecord[]>([]);
  const [safetyScore, setSafetyScore] = useState<number>(100);

  // Calibration State
  const [calibrationProfile, setCalibrationProfile] = useState<PhoneMountCalibrationProfile | null>(null);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationProgress, setCalibrationProgress] = useState(0);
  const [calibrationError, setCalibrationError] = useState<string | null>(null);
  const calibrationTimerRef = useRef<any>(null);
  const calibrationSamplesRef = useRef<CalibrationSample[]>([]);

  // Lean Angle State
  const [currentLeanAngle, setCurrentLeanAngle] = useState(0);
  const [currentLeanDirection, setCurrentLeanDirection] = useState<'LEFT' | 'RIGHT' | 'CENTER'>('CENTER');
  const [currentLeanState, setCurrentLeanState] = useState<'NORMAL' | 'CAUTION' | 'HIGH'>('NORMAL');
  const previousLeanRef = useRef(0);

  // Hazards State
  const [hazards, setHazards] = useState<RoadHazard[]>(INITIAL_ROAD_HAZARDS);
  const [activeHazardAlert, setActiveHazardAlert] = useState<HazardWarningAlert | null>(null);
  const lastHazardAlertIdRef = useRef<string | null>(null);
  const lastHazardAlertTimeRef = useRef(0);

  // Trip & Navigation State
  const [activeTrip, setActiveTrip] = useState<TripPlan | null>(null);
  const [activeNavigationRoute, setActiveNavigationRoute] = useState<RouteOption | null>(null);
  const [plannedTrips, setPlannedTrips] = useState<TripPlan[]>([]);
  const [isNavigating, setIsNavigating] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const originTripPlanRef = useRef<TripPlan | null>(null);

  // Path Recording
  const recordedPathRef = useRef<RidePathPoint[]>([]);

  const crashEngine = useRef<CrashDetectionEngine>(new CrashDetectionEngine()).current;
  const countdownTimerRef = useRef<any>(null);
  const rideTimerRef = useRef<any>(null);

  // Initialize session and storage on startup
  useEffect(() => {
    (async () => {
      const { user: restoredUser } = await AuthService.getSession();
      setUser(restoredUser);

      const savedContacts = await StorageService.getContacts();
      const savedSettings = await StorageService.getSettings();
      const savedRides = await StorageService.getRides();
      const savedCalibration = await StorageService.getCalibrationProfile();
      const savedHazards = await StorageService.getRoadHazards();
      const savedPlannedTrips = await StorageService.getPlannedTrips();

      setContacts(savedContacts);
      setSettings(savedSettings);
      setRideHistory(savedRides);
      setCountdownRemaining(savedSettings.countdownDurationSeconds);
      setCalibrationProfile(savedCalibration);
      setHazards(HazardIntelligenceService.ageHazards(savedHazards));
      setPlannedTrips(savedPlannedTrips);

      const caps = await phoneProvider.checkCapabilities();
      setSensorCapabilities(caps);
    })();
  }, []);

  const checkDeviceHealth = async (): Promise<DeviceSensorCapabilities> => {
    const caps = await currentProvider.checkCapabilities();
    setSensorCapabilities(caps);
    return caps;
  };

  const setSensorProviderType = (type: 'PHONE' | 'SIMULATOR' | 'BLUETOOTH') => {
    if (state === 'RIDE_ACTIVE' || state === 'MONITORING') {
      currentProvider.stop();
    }
    if (type === 'PHONE') setCurrentProvider(phoneProvider);
    if (type === 'SIMULATOR') setCurrentProvider(simProvider);
    if (type === 'BLUETOOTH') setCurrentProvider(bleProvider);
  };

  // ----------------------------------------------------
  // CALIBRATION FLOW
  // ----------------------------------------------------
  const startMountCalibration = async (): Promise<boolean> => {
    setIsCalibrating(true);
    setCalibrationProgress(0);
    setCalibrationError(null);
    calibrationSamplesRef.current = [];

    // Temporarily listen to phone IMU for 6 seconds (120 samples at 20Hz)
    const TARGET_SAMPLES = 100;
    let sampleCount = 0;

    await currentProvider.start((record) => {
      calibrationSamplesRef.current.push({
        accelX: record.accelX,
        accelY: record.accelY,
        accelZ: record.accelZ,
        gyroX: record.gyroX,
        gyroY: record.gyroY,
        gyroZ: record.gyroZ,
      });
      sampleCount++;
      const pct = Math.min(100, Math.round((sampleCount / TARGET_SAMPLES) * 100));
      setCalibrationProgress(pct);
    });

    return new Promise((resolve) => {
      calibrationTimerRef.current = setTimeout(async () => {
        await currentProvider.stop();
        setIsCalibrating(false);

        const result = CalibrationService.computeCalibrationProfile(
          calibrationSamplesRef.current
        );

        if (result.success && result.profile) {
          setCalibrationProfile(result.profile);
          await StorageService.saveCalibrationProfile(result.profile);
          setCalibrationError(null);
          resolve(true);
        } else {
          setCalibrationError(result.error || 'Calibration failed. Please keep phone steady.');
          resolve(false);
        }
      }, 5500);
    });
  };

  const cancelMountCalibration = () => {
    if (calibrationTimerRef.current) {
      clearTimeout(calibrationTimerRef.current);
    }
    currentProvider.stop();
    setIsCalibrating(false);
    setCalibrationProgress(0);
    setCalibrationError(null);
  };

  const recalibrateMount = async () => {
    await StorageService.clearCalibrationProfile();
    setCalibrationProfile(null);
    return startMountCalibration();
  };

  // ----------------------------------------------------
  // MANUAL ROAD HAZARD REPORTING
  // ----------------------------------------------------
  const reportManualHazard = async (type: RoadHazard['type'], address?: string): Promise<RoadHazard> => {
    const lat = currentLocation?.latitude || 37.7749;
    const lng = currentLocation?.longitude || -122.4194;

    const { updatedList, affectedHazard } = HazardIntelligenceService.clusterOrAddHazard(
      hazards,
      {
        type,
        latitude: lat,
        longitude: lng,
        severity: type === 'POTHOLE' || type === 'ACCIDENT' ? 'HIGH' : 'MEDIUM',
        confidence: 90,
        source: 'USER_REPORT',
      }
    );

    if (address) {
      affectedHazard.address = address;
    }

    setHazards(updatedList);
    await StorageService.saveRoadHazards(updatedList);
    return affectedHazard;
  };

  const dismissHazardAlert = () => {
    setActiveHazardAlert(null);
  };

  // ----------------------------------------------------
  // IN-APP NAVIGATION & TRIP PLANNING ACTIONS
  // ----------------------------------------------------
  const saveTripPlan = async (plan: TripPlan) => {
    await StorageService.savePlannedTrip(plan);
    const updated = await StorageService.getPlannedTrips();
    setPlannedTrips(updated);
  };

  const deleteTripPlan = async (id: string) => {
    await StorageService.deletePlannedTrip(id);
    const updated = await StorageService.getPlannedTrips();
    setPlannedTrips(updated);
  };

  const startNavigation = (route: RouteOption) => {
    setActiveNavigationRoute(route);
    setIsNavigating(true);
    setCurrentStepIndex(0);
  };

  const stopNavigation = () => {
    setIsNavigating(false);
    setActiveNavigationRoute(null);
    setCurrentStepIndex(0);
  };

  const startRideFromPlan = async (plan: TripPlan, route?: RouteOption): Promise<boolean> => {
    originTripPlanRef.current = plan;
    setActiveTrip(plan);
    const selectedRoute = route || plan.selectedRoute || plan.availableRoutes[0];
    if (selectedRoute) {
      setActiveNavigationRoute(selectedRoute);
      setIsNavigating(true);
    }
    return await startRide();
  };

  // ----------------------------------------------------
  // START RIDE
  // ----------------------------------------------------
  const startRide = async (): Promise<boolean> => {
    const planned = originTripPlanRef.current;
    const selectedRoute = activeNavigationRoute || planned?.selectedRoute;

    const newRide: RideRecord = {
      id: `ride-${Date.now()}`,
      userId: user?.id,
      startTime: Date.now(),
      durationSeconds: 0,
      distanceKm: 0,
      maxSpeedKmh: 0,
      avgSpeedKmh: 0,
      safetyScore: 100,
      originTripId: planned?.id,
      originTripName: planned?.name,
      plannedDistanceKm: selectedRoute?.distanceKm,
      plannedDurationMinutes: selectedRoute?.durationMinutes,
      hazardsEncountered: 0,
      scoreBreakdown: {
        base: 100,
        hardBrakingPenalty: 0,
        hardCorneringPenalty: 0,
        potholePenalty: 0,
        crashPenalty: 0,
      },
      eventCounts: {
        hardBraking: 0,
        hardCornering: 0,
        potholes: 0,
        suddenAcceleration: 0,
        crashes: 0,
      },
      incidents: [],
      coachingTips: [],
      path: [],
    };

    setActiveRide(newRide);
    setState('MONITORING');
    crashEngine.clearBuffer();
    recordedPathRef.current = [];

    // Start 1-second duration timer
    rideTimerRef.current = setInterval(() => {
      setActiveRide((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          durationSeconds: prev.durationSeconds + 1,
        };
      });
    }, 1000);

    // Single active sensor subscription per ride
    const started = await currentProvider.start((record) => {
      // 1. Calculate relative lean angle
      const lean = CalibrationService.calculateLeanAngle(
        record,
        calibrationProfile,
        settings,
        previousLeanRef.current
      );
      previousLeanRef.current = lean.leanAngleDeg * (lean.leanDirection === 'LEFT' ? -1 : 1);

      setCurrentLeanAngle(lean.leanAngleDeg);
      setCurrentLeanDirection(lean.leanDirection);
      setCurrentLeanState(lean.leanState);

      const enrichedRecord: NormalizedSensorRecord = {
        ...record,
        leanAngleDeg: lean.leanAngleDeg,
        leanDirection: lean.leanDirection,
        leanState: lean.leanState,
      };

      setCurrentRecord(enrichedRecord);

      // 2. Update Location & Signal Health
      if (record.latitude && record.longitude) {
        const loc: LocationData = {
          latitude: record.latitude,
          longitude: record.longitude,
          speed: (record.speed || 0) / 3.6,
          accuracy: record.locationAccuracy,
          timestamp: record.timestamp,
          signalState: (record.locationAccuracy || 100) < 25 ? 'CONNECTED' : 'WEAK_SIGNAL',
        };
        setCurrentLocation(loc);

        // Record sampled path polyline point (every 5 seconds)
        if (
          recordedPathRef.current.length === 0 ||
          record.timestamp - recordedPathRef.current[recordedPathRef.current.length - 1].timestamp >= 4000
        ) {
          recordedPathRef.current.push({
            latitude: record.latitude,
            longitude: record.longitude,
            timestamp: record.timestamp,
            speedKmh: record.speed || 0,
            leanAngleDeg: lean.leanAngleDeg,
          });
        }

        // 3. Proximity Hazard Warnings
        const now = Date.now();
        if (now - lastHazardAlertTimeRef.current > 15000) {
          const alerts = HazardIntelligenceService.checkProximityWarnings(
            loc,
            hazards,
            settings.hazardWarningRadiusM || 200
          );
          if (alerts.length > 0) {
            const nearest = alerts[0];
            if (nearest.hazard.id !== lastHazardAlertIdRef.current) {
              setActiveHazardAlert(nearest);
              lastHazardAlertIdRef.current = nearest.hazard.id;
              lastHazardAlertTimeRef.current = now;
            }
          }
        }
      }

      // 4. Pass IMU frame to Crash Engine
      crashEngine.addRecord(enrichedRecord);

      // Update ride telematics metrics
      setActiveRide((prev) => {
        if (!prev) return null;
        const speed = record.speed || 0;
        const newMax = Math.max(prev.maxSpeedKmh, speed);
        return {
          ...prev,
          maxSpeedKmh: newMax,
          distanceKm: Number((prev.distanceKm + (speed * (50 / 3600000))).toFixed(3)),
        };
      });

      // 5. Evaluate Event & Crash Detection Engine
      const detected = crashEngine.evaluate(settings);
      if (detected) {
        handleDetectedEvent(detected, enrichedRecord);
      }
    });

    return started;
  };

  // ----------------------------------------------------
  // EVENT & CRASH CLASSIFICATION HANDLER
  // ----------------------------------------------------
  const handleDetectedEvent = (
    event: IncidentEvent,
    latestRecord: NormalizedSensorRecord
  ) => {
    if (currentLocation) {
      event.location = currentLocation;
    }

    // A. Road Pothole / Hazard Auto-Detection & Spatial Clustering
    if (event.type === 'POTHOLE') {
      if (currentLocation) {
        const { updatedList } = HazardIntelligenceService.clusterOrAddHazard(hazards, {
          type: 'POTHOLE',
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          severity: 'HIGH',
          confidence: event.confidence,
          source: 'SENSOR_AUTODETECT',
        });
        setHazards(updatedList);
        StorageService.saveRoadHazards(updatedList).catch(() => {});
      }
    }

    // Attach incident to active ride log
    setActiveRide((prev) => {
      if (!prev) return null;
      const countKey =
        event.type === 'HARD_BRAKING'
          ? 'hardBraking'
          : event.type === 'HARD_CORNERING'
          ? 'hardCornering'
          : event.type === 'POTHOLE'
          ? 'potholes'
          : 'crashes';

      const updatedCounts = {
        ...prev.eventCounts,
        [countKey]: prev.eventCounts[countKey] + 1,
      };

      const scoreResult = RiderCoachingEngine.calculateScore(
        updatedCounts
      );
      setSafetyScore(scoreResult.score);

      return {
        ...prev,
        eventCounts: updatedCounts,
        safetyScore: scoreResult.score,
        scoreBreakdown: scoreResult.breakdown,
        incidents: [event, ...prev.incidents],
      };
    });

    // B. CRASH / EMERGENCY STATE MACHINE TRIGGER
    if (
      event.type === 'POSSIBLE_CRASH' ||
      event.type === 'HIGH_SIDE_CRASH' ||
      event.type === 'LOW_SIDE_CRASH' ||
      event.type === 'VEHICLE_ROLLOVER' ||
      event.type === 'RIDER_SEPARATION'
    ) {
      triggerCrashConfirmation(event);
    }
  };

  // ----------------------------------------------------
  // CRASH CONFIRMATION COUNTDOWN & EMERGENCY BUFFER
  // ----------------------------------------------------
  const triggerCrashConfirmation = (crashEvent: IncidentEvent) => {
    setState('POSSIBLE_CRASH');
    setActiveIncident(crashEvent);
    setCountdownRemaining(settings.countdownDurationSeconds);

    // Activate siren & continuous haptic pulses
    emergencyAlertService.startAlarm();

    setState('EMERGENCY_COUNTDOWN');

    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
    }

    let remaining = settings.countdownDurationSeconds;

    countdownTimerRef.current = setInterval(() => {
      remaining -= 1;
      setCountdownRemaining(remaining);

      if (remaining <= 0) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
        triggerAutomaticSos(crashEvent);
      }
    }, 1000);
  };

  // ----------------------------------------------------
  // CANCEL ALERT — RIDER CONFIRMS "I'M SAFE"
  // ----------------------------------------------------
  const cancelAlert = async () => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }

    await emergencyAlertService.stopAlarm();
    setState('CANCELLED');

    if (activeIncident) {
      const cancelledIncident: IncidentEvent = {
        ...activeIncident,
        wasCancelled: true,
        cancelledAt: Date.now(),
        sosTriggered: false,
      };
      setActiveIncident(cancelledIncident);
      await ApiService.dispatchSosCloud(cancelledIncident, contacts, currentLocation);
    }

    setTimeout(() => {
      setState('MONITORING');
    }, 3000);
  };

  // ----------------------------------------------------
  // AUTOMATIC SOS DISPATCH (UNRESPONSIVE TIMER EXPIRY)
  // ----------------------------------------------------
  const triggerAutomaticSos = async (incident: IncidentEvent) => {
    setState('SOS_PENDING');
    setSosDeliveryStatus('SOS_SENDING');

    const triggeredIncident: IncidentEvent = {
      ...incident,
      sosTriggered: true,
      wasCancelled: false,
      location: currentLocation,
    };
    setActiveIncident(triggeredIncident);

    // 1. Dispatch SMS directly via native SIM
    if (settings.autoSendSms && contacts.length > 0) {
      await emergencyAlertService.dispatchSos(contacts, triggeredIncident, currentLocation);
    }

    // 2. Dispatch payload to cloud webhook gateway
    await ApiService.dispatchSosCloud(triggeredIncident, contacts, currentLocation);

    setSosDeliveryStatus('SOS_SENT');
    setState('SOS_TRIGGERED');
  };

  // ----------------------------------------------------
  // MANUAL SOS BUTTON
  // ----------------------------------------------------
  const triggerManualSos = async () => {
    const manualEvent: IncidentEvent = {
      id: `manual-sos-${Date.now()}`,
      timestamp: Date.now(),
      type: 'MANUAL_SOS',
      severity: 'CRITICAL',
      confidence: 100,
      description: 'Rider initiated manual emergency panic button',
      reasons: ['Manual SOS trigger by rider'],
      peakAccelG: currentRecord?.accelMagnitude || 1.0,
      peakGyroRads: currentRecord?.gyroMagnitude || 0.0,
      speedAtEventKmh: currentRecord?.speed || 0,
      location: currentLocation,
      countdownSeconds: settings.countdownDurationSeconds,
      wasCancelled: false,
      sosTriggered: false,
    };

    triggerCrashConfirmation(manualEvent);
  };

  // ----------------------------------------------------
  // END RIDE
  // ----------------------------------------------------
  const endRide = async (): Promise<RideRecord | null> => {
    if (rideTimerRef.current) {
      clearInterval(rideTimerRef.current);
      rideTimerRef.current = null;
    }
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }

    await currentProvider.stop();
    await emergencyAlertService.stopAlarm();
    setState('IDLE');
    setIsNavigating(false);

    if (!activeRide) return null;

    const coachingTips = RiderCoachingEngine.generateCoaching(activeRide);

    const completedRide: RideRecord = {
      ...activeRide,
      endTime: Date.now(),
      coachingTips,
      path: recordedPathRef.current,
      originTripId: activeRide.originTripId || originTripPlanRef.current?.id,
      originTripName: activeRide.originTripName || originTripPlanRef.current?.name,
      plannedDistanceKm: activeRide.plannedDistanceKm || originTripPlanRef.current?.selectedRoute?.distanceKm,
      plannedDurationMinutes: activeRide.plannedDurationMinutes || originTripPlanRef.current?.selectedRoute?.durationMinutes,
      hazardsEncountered: activeRide.hazardsEncountered || (activeRide.eventCounts?.potholes || 0),
    };

    await StorageService.saveRide(completedRide);
    await ApiService.syncRide(completedRide);

    const updatedRides = await StorageService.getRides();
    setRideHistory(updatedRides);
    setActiveRide(null);
    originTripPlanRef.current = null;

    return completedRide;
  };

  const runDemoScenario = (scenario: DemoScenario) => {
    if (currentProvider === simProvider) {
      simProvider.triggerScenario(scenario);
    }
  };

  // Auth delegators
  const loginUser = async (email: string, pass: string) => {
    const res = await AuthService.login(email, pass);
    if (res.success && res.user) setUser(res.user);
    return res;
  };

  const registerUser = async (name: string, email: string, phone: string, pass: string) => {
    const res = await AuthService.register(name, email, phone, pass);
    if (res.success && res.user) setUser(res.user);
    return res;
  };

  const loginWithGoogle = async () => {
    const res = await AuthService.signInWithGoogle();
    if (res.success && res.user) {
      setUser(res.user);
      return true;
    }
    return false;
  };

  const logoutUser = async () => {
    await AuthService.logout();
    setUser(null);
  };

  const completeOnboarding = async () => {
    if (user) {
      const updated = { ...user, onboardingCompleted: true };
      setUser(updated);
      await StorageService.saveSettings(settings);
    }
  };

  const updateSettings = async (newSettings: AppSettings) => {
    setSettings(newSettings);
    await StorageService.saveSettings(newSettings);
  };

  const saveContact = async (contact: EmergencyContact) => {
    const updated = [contact, ...contacts.filter((c) => c.id !== contact.id)];
    setContacts(updated);
    await StorageService.saveContacts(updated);
  };

  const deleteContact = async (id: string) => {
    const updated = contacts.filter((c) => c.id !== id);
    setContacts(updated);
    await StorageService.saveContacts(updated);
  };

  return (
    <RideContext.Provider
      value={{
        state,
        user,
        sensorProvider: currentProvider,
        sensorCapabilities,
        currentRecord,
        currentLocation,
        activeRide,
        activeIncident,
        countdownRemaining,
        sosDeliveryStatus,
        contacts,
        settings,
        rideHistory,
        safetyScore,
        calibrationProfile,
        isCalibrating,
        calibrationProgress,
        calibrationError,
        startMountCalibration,
        cancelMountCalibration,
        recalibrateMount,
        currentLeanAngle,
        currentLeanDirection,
        currentLeanState,
        hazards,
        activeHazardAlert,
        reportManualHazard,
        dismissHazardAlert,
        activeTrip,
        activeNavigationRoute,
        plannedTrips,
        isNavigating,
        currentStepIndex,
        setTripPlan: setActiveTrip,
        saveTripPlan,
        deleteTripPlan,
        startNavigation,
        stopNavigation,
        startRideFromPlan,
        loginUser,
        registerUser,
        loginWithGoogle,
        logoutUser,
        completeOnboarding,
        setSensorProviderType,
        checkDeviceHealth,
        startRide,
        endRide,
        cancelAlert,
        triggerManualSos,
        runDemoScenario,
        updateSettings,
        saveContact,
        deleteContact,
      }}
    >
      {children}
    </RideContext.Provider>
  );
};

export const useRide = () => {
  const context = useContext(RideContext);
  if (!context) {
    throw new Error('useRide must be used within a RideProvider');
  }
  return context;
};
