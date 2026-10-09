import { Accelerometer, Gyroscope } from 'expo-sensors';
import * as Location from 'expo-location';
import { ISensorProvider, SensorDataCallback } from './ISensorProvider';
import {
  NormalizedSensorRecord,
  DeviceSensorCapabilities,
  LocationData,
  GpsSignalState,
} from '../../types';

export class PhoneSensorProvider implements ISensorProvider {
  public readonly id = 'PHONE_BUILTIN';
  public readonly name = 'Smartphone Integrated Sensors';

  private accelSubscription: any = null;
  private gyroSubscription: any = null;
  private locationSubscription: any = null;
  private timer: any = null;
  private active = false;

  private currentAccel = { x: 0, y: 0, z: 1, mag: 1.0 };
  private prevAccelMag = 1.0;
  private prevTimestamp = Date.now();
  private currentGyro = { x: 0, y: 0, z: 0, mag: 0.0 };

  // Improved GPS tracking with signal health and last-known location
  private lastKnownLocation: LocationData | null = null;
  private lastLocationTimestamp = 0;
  private currentLocationData: LocationData = {
    latitude: 37.7749,
    longitude: -122.4194,
    speed: 0,
    heading: 0,
    accuracy: null,
    altitude: null,
    timestamp: Date.now(),
    signalState: 'UNAVAILABLE',
    isLastKnown: true,
  };

  public async checkCapabilities(): Promise<DeviceSensorCapabilities> {
    const accelAvailable = await Accelerometer.isAvailableAsync().catch(() => false);
    const gyroAvailable = await Gyroscope.isAvailableAsync().catch(() => false);

    let locationGranted = false;
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      locationGranted = status === 'granted';
    } catch {
      locationGranted = false;
    }

    return {
      accelerometer: accelAvailable,
      gyroscope: gyroAvailable,
      gps: true,
      magnetometer: false,
      barometer: false,
      batteryLevel: 0.85,
      locationPermissionGranted: locationGranted,
    };
  }

  public async start(onData: SensorDataCallback): Promise<boolean> {
    if (this.active) return true;
    this.active = true;

    // Set sampling rate: 50ms (20Hz)
    Accelerometer.setUpdateInterval(50);
    Gyroscope.setUpdateInterval(50);

    this.accelSubscription = Accelerometer.addListener((d) => {
      const mag = Math.sqrt(d.x * d.x + d.y * d.y + d.z * d.z);
      this.currentAccel = { x: d.x, y: d.y, z: d.z, mag };
    });

    this.gyroSubscription = Gyroscope.addListener((d) => {
      const mag = Math.sqrt(d.x * d.x + d.y * d.y + d.z * d.z);
      this.currentGyro = { x: d.x, y: d.y, z: d.z, mag };
    });

    // Start high-precision GPS tracking
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status === 'granted') {
        // Initial quick fix
        const initial = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        }).catch(() => null);

        if (initial) {
          const speedKmh =
            initial.coords.speed !== null && initial.coords.speed !== undefined
              ? Math.max(0, initial.coords.speed * 3.6)
              : 0;

          this.lastLocationTimestamp = Date.now();
          this.currentLocationData = {
            latitude: initial.coords.latitude,
            longitude: initial.coords.longitude,
            altitude: initial.coords.altitude,
            speed: initial.coords.speed,
            heading: initial.coords.heading,
            accuracy: initial.coords.accuracy,
            timestamp: initial.timestamp,
            signalState: (initial.coords.accuracy || 100) < 20 ? 'CONNECTED' : 'WEAK_SIGNAL',
            isLastKnown: false,
          };
          this.lastKnownLocation = { ...this.currentLocationData };
        }

        // Live continuous high-frequency location watcher
        this.locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.BestForNavigation,
            timeInterval: 1000,
            distanceInterval: 1,
          },
          (loc) => {
            const acc = loc.coords.accuracy || 999;
            const signalState: GpsSignalState =
              acc <= 15 ? 'CONNECTED' : acc <= 50 ? 'WEAK_SIGNAL' : 'UNAVAILABLE';

            this.lastLocationTimestamp = Date.now();
            this.currentLocationData = {
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
              altitude: loc.coords.altitude,
              speed: loc.coords.speed,
              heading: loc.coords.heading,
              accuracy: loc.coords.accuracy,
              timestamp: loc.timestamp,
              signalState,
              isLastKnown: false,
            };
            this.lastKnownLocation = { ...this.currentLocationData };
          }
        );
      }
    } catch (e) {
      console.warn('GPS location subscription warning:', e);
    }

    this.prevTimestamp = Date.now();
    this.prevAccelMag = 1.0;

    // Normalizing emitter loop at 20Hz
    this.timer = setInterval(() => {
      const now = Date.now();
      const dt = Math.max(0.01, (now - this.prevTimestamp) / 1000);

      // Jerk
      const jerk = Math.abs(this.currentAccel.mag - this.prevAccelMag) / dt;
      this.prevAccelMag = this.currentAccel.mag;
      this.prevTimestamp = now;

      // Check if GPS signal became stale (>10 seconds without update)
      let activeLocation = this.currentLocationData;
      if (now - this.lastLocationTimestamp > 10000 && this.lastKnownLocation) {
        activeLocation = {
          ...this.lastKnownLocation,
          signalState: 'UNAVAILABLE',
          isLastKnown: true,
        };
      }

      // Estimate raw tilt angle
      const tiltAngleDeg =
        Math.acos(Math.min(1, Math.max(-1, this.currentAccel.z / (this.currentAccel.mag || 1)))) *
        (180 / Math.PI);

      const speedKmh =
        activeLocation.speed !== null && activeLocation.speed !== undefined
          ? Math.max(0, activeLocation.speed * 3.6)
          : null;

      const record: NormalizedSensorRecord = {
        timestamp: now,
        accelX: this.currentAccel.x,
        accelY: this.currentAccel.y,
        accelZ: this.currentAccel.z,
        accelMagnitude: this.currentAccel.mag,
        gyroX: this.currentGyro.x,
        gyroY: this.currentGyro.y,
        gyroZ: this.currentGyro.z,
        gyroMagnitude: this.currentGyro.mag,
        latitude: activeLocation.latitude,
        longitude: activeLocation.longitude,
        speed: speedKmh,
        locationAccuracy: activeLocation.accuracy ?? null,
        jerk,
        tiltAngleDeg,
      };

      onData(record);
    }, 50);

    return true;
  }

  public async stop(): Promise<void> {
    this.active = false;
    if (this.accelSubscription) {
      this.accelSubscription.remove();
      this.accelSubscription = null;
    }
    if (this.gyroSubscription) {
      this.gyroSubscription.remove();
      this.gyroSubscription = null;
    }
    if (this.locationSubscription) {
      this.locationSubscription.remove();
      this.locationSubscription = null;
    }
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  public isMonitoring(): boolean {
    return this.active;
  }

  public getCurrentLocation(): LocationData {
    return this.currentLocationData;
  }
}
