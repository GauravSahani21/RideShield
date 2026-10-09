import { ISensorProvider, SensorDataCallback } from './ISensorProvider';
import { NormalizedSensorRecord, DeviceSensorCapabilities } from '../../types';

export type DemoScenario =
  | 'NORMAL'
  | 'HARD_BRAKING'
  | 'HARD_CORNERING'
  | 'POTHOLE'
  | 'CRASH';

export class SimulatedSensorProvider implements ISensorProvider {
  public readonly id = 'SENSOR_SIMULATOR';
  public readonly name = 'RideShield Sensor Simulator (Testing Rig)';

  private active = false;
  private timer: any = null;
  private currentScenario: DemoScenario = 'NORMAL';
  private scenarioTicksRemaining = 0;
  private currentSpeed = 50; // km/h

  public async checkCapabilities(): Promise<DeviceSensorCapabilities> {
    return {
      accelerometer: true,
      gyroscope: true,
      gps: true,
      magnetometer: true,
      barometer: true,
      batteryLevel: 1.0,
      locationPermissionGranted: true,
    };
  }

  public triggerScenario(scenario: DemoScenario): void {
    this.currentScenario = scenario;
    this.scenarioTicksRemaining = 20; // run for ~1 second (20 ticks at 50ms)
  }

  public async start(onData: SensorDataCallback): Promise<boolean> {
    if (this.active) return true;
    this.active = true;

    this.timer = setInterval(() => {
      const now = Date.now();
      let ax = (Math.random() - 0.5) * 0.1;
      let ay = (Math.random() - 0.5) * 0.1;
      let az = 1.0 + (Math.random() - 0.5) * 0.05;
      let gx = (Math.random() - 0.5) * 0.1;
      let gy = (Math.random() - 0.5) * 0.1;
      let gz = (Math.random() - 0.5) * 0.1;

      if (this.scenarioTicksRemaining > 0) {
        this.scenarioTicksRemaining--;

        switch (this.currentScenario) {
          case 'POTHOLE':
            // High vertical spike, low rotation, speed stays constant
            az = 3.6 + Math.random() * 0.4;
            break;
          case 'HARD_BRAKING':
            // High negative longitudinal G, low rotation, sharp speed drop
            ay = -1.5;
            this.currentSpeed = Math.max(10, this.currentSpeed - 3);
            break;
          case 'HARD_CORNERING':
            // Lateral G + strong yaw rotation
            ax = 1.2;
            gz = 2.4;
            break;
          case 'CRASH':
            // High impact spike (4.8G) + violent rotational tumble + speed dropping to zero
            ax = 3.2;
            ay = -2.8;
            az = 4.5;
            gx = 4.2;
            gy = 3.8;
            gz = 5.1;
            this.currentSpeed = Math.max(0, this.currentSpeed - 8);
            break;
        }
      } else {
        this.currentScenario = 'NORMAL';
        if (this.currentSpeed < 45) {
          this.currentSpeed += 1;
        }
      }

      const magAccel = Math.sqrt(ax * ax + ay * ay + az * az);
      const magGyro = Math.sqrt(gx * gx + gy * gy + gz * gz);

      const record: NormalizedSensorRecord = {
        timestamp: now,
        accelX: ax,
        accelY: ay,
        accelZ: az,
        accelMagnitude: magAccel,
        gyroX: gx,
        gyroY: gy,
        gyroZ: gz,
        gyroMagnitude: magGyro,
        latitude: 37.7749 + (Math.random() - 0.5) * 0.0001,
        longitude: -122.4194 + (Math.random() - 0.5) * 0.0001,
        speed: this.currentSpeed,
        locationAccuracy: 4.5,
        jerk: magAccel * 1.5,
        tiltAngleDeg: Math.acos(Math.min(1, Math.max(-1, az / magAccel))) * (180 / Math.PI),
      };

      onData(record);
    }, 50);

    return true;
  }

  public async stop(): Promise<void> {
    this.active = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  public isMonitoring(): boolean {
    return this.active;
  }
}
