import { NormalizedSensorRecord, DeviceSensorCapabilities } from '../../types';

export type SensorDataCallback = (record: NormalizedSensorRecord) => void;

/**
 * Universal SensorProvider interface.
 * Decouples the detection engine from concrete data sources
 * (Smartphone sensors, Simulator, or future Bluetooth 6-axis IMU garment).
 */
export interface ISensorProvider {
  readonly id: string;
  readonly name: string;
  
  checkCapabilities(): Promise<DeviceSensorCapabilities>;
  start(onData: SensorDataCallback): Promise<boolean>;
  stop(): Promise<void>;
  isMonitoring(): boolean;
}
