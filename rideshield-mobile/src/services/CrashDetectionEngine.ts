import {
  NormalizedSensorRecord,
  IncidentEvent,
  IncidentType,
  AppSettings,
} from '../types';

export interface DetectionThresholds {
  impactSpikeG: number;
  rotationAnomalyRads: number;
  speedDropKmh: number;
  potholeThresholdG: number;
  hardBrakingThresholdG: number;
  hardCorneringRads: number;
}

export const SENSITIVITY_PROFILES: Record<'LOW' | 'MEDIUM' | 'HIGH', DetectionThresholds> = {
  LOW: {
    impactSpikeG: 4.5,
    rotationAnomalyRads: 5.5,
    speedDropKmh: 25,
    potholeThresholdG: 3.5,
    hardBrakingThresholdG: 1.5,
    hardCorneringRads: 3.0,
  },
  MEDIUM: {
    impactSpikeG: 3.5,
    rotationAnomalyRads: 4.0,
    speedDropKmh: 15,
    potholeThresholdG: 2.8,
    hardBrakingThresholdG: 1.2,
    hardCorneringRads: 2.2,
  },
  HIGH: {
    impactSpikeG: 2.8,
    rotationAnomalyRads: 3.0,
    speedDropKmh: 10,
    potholeThresholdG: 2.2,
    hardBrakingThresholdG: 0.9,
    hardCorneringRads: 1.8,
  },
};

export class CrashDetectionEngine {
  // Pre-impact rolling FIFO buffer (last 8 seconds at 20Hz = 160 frames)
  private preImpactBuffer: NormalizedSensorRecord[] = [];
  private readonly BUFFER_CAPACITY = 160;
  private lastTriggerTime = 0;
  private readonly COOLDOWN_MS = 6000;

  public addRecord(record: NormalizedSensorRecord): void {
    this.preImpactBuffer.push(record);
    if (this.preImpactBuffer.length > this.BUFFER_CAPACITY) {
      this.preImpactBuffer.shift();
    }
  }

  public getPreImpactBuffer(): NormalizedSensorRecord[] {
    return [...this.preImpactBuffer];
  }

  public clearBuffer(): void {
    this.preImpactBuffer = [];
    this.lastTriggerTime = 0;
  }

  /**
   * Evaluates feature-extracted window for multi-sensor event classification
   */
  public evaluate(settings: AppSettings): IncidentEvent | null {
    const now = Date.now();
    if (now - this.lastTriggerTime < this.COOLDOWN_MS) {
      return null;
    }

    if (this.preImpactBuffer.length < 15) {
      return null;
    }

    const thresholds = SENSITIVITY_PROFILES[settings.sensitivity] || SENSITIVITY_PROFILES.MEDIUM;

    // Scan recent 1.5 seconds (~30 frames)
    const recent = this.preImpactBuffer.slice(-30);
    let peakAccel = 0;
    let peakGyro = 0;
    let peakJerk = 0;
    let maxTilt = 0;

    const initialSpeed = recent[0].speed || 0;
    const finalSpeed = recent[recent.length - 1].speed || 0;
    const speedDelta = Math.max(0, initialSpeed - finalSpeed);

    for (const frame of recent) {
      if (frame.accelMagnitude > peakAccel) peakAccel = frame.accelMagnitude;
      if (frame.gyroMagnitude > peakGyro) peakGyro = frame.gyroMagnitude;
      if (frame.jerk && frame.jerk > peakJerk) peakJerk = frame.jerk;
      if (frame.tiltAngleDeg && frame.tiltAngleDeg > maxTilt) maxTilt = frame.tiltAngleDeg;
    }

    const hasImpactSpike = peakAccel >= thresholds.impactSpikeG;
    const hasViolentRotation = peakGyro >= thresholds.rotationAnomalyRads;
    const hasSuddenDecel = speedDelta >= thresholds.speedDropKmh || (initialSpeed > 15 && finalSpeed < 5);
    const hasAbnormalTilt = maxTilt > 65; // severely tilted or rollover

    // ==========================================
    // 1. POSSIBLE CRASH (Multi-Sensor Confluence)
    // ==========================================
    if (hasImpactSpike && (hasViolentRotation || hasSuddenDecel || hasAbnormalTilt)) {
      this.lastTriggerTime = now;
      const reasons: string[] = [];
      if (hasImpactSpike) reasons.push(`High impact spike: ${peakAccel.toFixed(1)}G`);
      if (hasViolentRotation) reasons.push(`Rotational tumble: ${peakGyro.toFixed(1)} rad/s`);
      if (hasSuddenDecel) reasons.push(`Sudden deceleration: -${speedDelta.toFixed(0)} km/h`);
      if (hasAbnormalTilt) reasons.push(`Abnormal vehicle orientation (${maxTilt.toFixed(0)}°)`);

      // Determine advanced sub-class if orientation and tumble are prominent
      let eventType: IncidentType = 'POSSIBLE_CRASH';
      if (hasAbnormalTilt && peakGyro > 4.5) {
        eventType = 'VEHICLE_ROLLOVER';
      } else if (hasViolentRotation && speedDelta > 20) {
        eventType = 'HIGH_SIDE_CRASH';
      }

      const confidence = Math.min(
        98,
        Math.round(
          (peakAccel / thresholds.impactSpikeG) * 35 +
            (peakGyro / thresholds.rotationAnomalyRads) * 35 +
            (hasSuddenDecel ? 20 : 10) +
            (hasAbnormalTilt ? 10 : 0)
        )
      );

      return {
        id: `crash-${now}`,
        timestamp: now,
        type: eventType,
        severity: 'CRITICAL',
        confidence,
        description: `Crash signature detected: ${reasons.join(', ')}`,
        reasons,
        peakAccelG: peakAccel,
        peakGyroRads: peakGyro,
        speedAtEventKmh: initialSpeed,
        location: null,
        countdownSeconds: settings.countdownDurationSeconds,
        wasCancelled: false,
        sosTriggered: false,
        preImpactBuffer: this.getPreImpactBuffer(),
      };
    }

    // ==========================================
    // 2. POTHOLE / ROAD JOLT
    // ==========================================
    if (peakAccel >= thresholds.potholeThresholdG && !hasViolentRotation && speedDelta < 6) {
      this.lastTriggerTime = now;
      return {
        id: `pothole-${now}`,
        timestamp: now,
        type: 'POTHOLE',
        severity: 'LOW',
        confidence: 88,
        description: `Road surface jolt / pothole (${peakAccel.toFixed(1)}G vertical)`,
        reasons: [`Vertical acceleration: ${peakAccel.toFixed(1)}G`, 'No rotational tumble', 'Speed preserved'],
        peakAccelG: peakAccel,
        peakGyroRads: peakGyro,
        speedAtEventKmh: initialSpeed,
        location: null,
        countdownSeconds: 0,
        wasCancelled: false,
        sosTriggered: false,
      };
    }

    // ==========================================
    // 3. HARD BRAKING
    // ==========================================
    if (speedDelta >= thresholds.speedDropKmh && peakAccel >= thresholds.hardBrakingThresholdG && !hasViolentRotation) {
      this.lastTriggerTime = now;
      return {
        id: `braking-${now}`,
        timestamp: now,
        type: 'HARD_BRAKING',
        severity: 'MEDIUM',
        confidence: 85,
        description: `Hard braking event (-${speedDelta.toFixed(0)} km/h)`,
        reasons: [`Rapid deceleration: -${speedDelta.toFixed(0)} km/h`, 'Stable orientation'],
        peakAccelG: peakAccel,
        peakGyroRads: peakGyro,
        speedAtEventKmh: initialSpeed,
        location: null,
        countdownSeconds: 0,
        wasCancelled: false,
        sosTriggered: false,
      };
    }

    // ==========================================
    // 4. HARD CORNERING
    // ==========================================
    if (peakGyro >= thresholds.hardCorneringRads && !hasImpactSpike && initialSpeed > 25) {
      this.lastTriggerTime = now;
      return {
        id: `cornering-${now}`,
        timestamp: now,
        type: 'HARD_CORNERING',
        severity: 'LOW',
        confidence: 80,
        description: `Aggressive lean / hard cornering (${peakGyro.toFixed(1)} rad/s)`,
        reasons: [`High angular velocity: ${peakGyro.toFixed(1)} rad/s`, 'Smooth trajectory'],
        peakAccelG: peakAccel,
        peakGyroRads: peakGyro,
        speedAtEventKmh: initialSpeed,
        location: null,
        countdownSeconds: 0,
        wasCancelled: false,
        sosTriggered: false,
      };
    }

    return null;
  }
}
