import { ISensorProvider, SensorDataCallback } from './ISensorProvider';
import { DeviceSensorCapabilities } from '../../types';

/**
 * BluetoothIMUProvider
 * Placeholder & architectural stub for the future physical RideShield garment
 * equipped with an external 6-axis IMU + BLE microcontroller.
 */
export class BluetoothIMUProvider implements ISensorProvider {
  public readonly id = 'BLUETOOTH_GARMENT_IMU';
  public readonly name = 'RideShield Smart Garment (BLE 6-Axis IMU)';

  private active = false;

  public async checkCapabilities(): Promise<DeviceSensorCapabilities> {
    return {
      accelerometer: true,
      gyroscope: true,
      gps: false, // uses host phone GPS
      magnetometer: true,
      barometer: false,
      batteryLevel: 0.95,
      locationPermissionGranted: true,
    };
  }

  public async start(onData: SensorDataCallback): Promise<boolean> {
    console.log('BluetoothIMUProvider: Prepared for BLE connection to RideShield hardware.');
    this.active = true;
    return true;
  }

  public async stop(): Promise<void> {
    this.active = false;
  }

  public isMonitoring(): boolean {
    return this.active;
  }
}
