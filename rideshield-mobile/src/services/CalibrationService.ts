import {
  NormalizedSensorRecord,
  PhoneMountCalibrationProfile,
  AppSettings,
} from '../types';

export interface CalibrationSample {
  accelX: number;
  accelY: number;
  accelZ: number;
  gyroX: number;
  gyroY: number;
  gyroZ: number;
}

export interface CalibrationResult {
  success: boolean;
  profile?: PhoneMountCalibrationProfile;
  error?: string;
  variance?: { accel: number; gyro: number };
}

export class CalibrationService {
  // Maximum allowed standard deviation variance during stationary sampling
  private static readonly MAX_ACCEL_VARIANCE = 0.08; // in G^2
  private static readonly MAX_GYRO_VARIANCE = 0.35;  // in (rad/s)^2

  /**
   * Process an array of sensor samples collected over 5-10s stationary window
   */
  public static computeCalibrationProfile(
    samples: CalibrationSample[]
  ): CalibrationResult {
    if (!samples || samples.length < 20) {
      return {
        success: false,
        error: 'Insufficient sensor samples collected. Keep phone stationary for 5-10 seconds.',
      };
    }

    // 1. Calculate Means
    let sumAx = 0, sumAy = 0, sumAz = 0;
    let sumGx = 0, sumGy = 0, sumGz = 0;

    for (const s of samples) {
      sumAx += s.accelX;
      sumAy += s.accelY;
      sumAz += s.accelZ;
      sumGx += s.gyroX;
      sumGy += s.gyroY;
      sumGz += s.gyroZ;
    }

    const n = samples.length;
    const meanAx = sumAx / n;
    const meanAy = sumAy / n;
    const meanAz = sumAz / n;

    const meanGx = sumGx / n;
    const meanGy = sumGy / n;
    const meanGz = sumGz / n;

    // 2. Calculate Variances to ensure the phone was stable and not shaking
    let varA = 0;
    let varG = 0;

    for (const s of samples) {
      const dAx = s.accelX - meanAx;
      const dAy = s.accelY - meanAy;
      const dAz = s.accelZ - meanAz;
      varA += dAx * dAx + dAy * dAy + dAz * dAz;

      const dGx = s.gyroX - meanGx;
      const dGy = s.gyroY - meanGy;
      const dGz = s.gyroZ - meanGz;
      varG += dGx * dGx + dGy * dGy + dGz * dGz;
    }

    const accelVariance = varA / n;
    const gyroVariance = varG / n;

    if (accelVariance > this.MAX_ACCEL_VARIANCE || gyroVariance > this.MAX_GYRO_VARIANCE) {
      return {
        success: false,
        error: 'Phone movement or engine vibration detected. Keep motorcycle stationary and still.',
        variance: { accel: accelVariance, gyro: gyroVariance },
      };
    }

    // 3. Compute baseline orientation angles relative to gravity vector
    // Standard pitch (forward/backward) and roll (left/right) in degrees
    const baselineRollDeg = Math.atan2(meanAx, Math.sqrt(meanAy * meanAy + meanAz * meanAz)) * (180 / Math.PI);
    const baselinePitchDeg = Math.atan2(-meanAy, meanAz) * (180 / Math.PI);

    const profile: PhoneMountCalibrationProfile = {
      calibrated: true,
      baselineOrientation: {
        pitch: Number(baselinePitchDeg.toFixed(2)),
        roll: Number(baselineRollDeg.toFixed(2)),
      },
      baselineGravity: {
        x: Number(meanAx.toFixed(4)),
        y: Number(meanAy.toFixed(4)),
        z: Number(meanAz.toFixed(4)),
      },
      sensorVariance: {
        accel: Number(accelVariance.toFixed(5)),
        gyro: Number(gyroVariance.toFixed(5)),
      },
      calibratedAt: Date.now(),
    };

    return {
      success: true,
      profile,
      variance: { accel: accelVariance, gyro: gyroVariance },
    };
  }

  /**
   * Compute relative lean angle given a raw sensor frame and the baseline calibration
   * Returns lean angle in degrees (-90 to +90), direction, and safe threshold status
   */
  public static calculateLeanAngle(
    record: NormalizedSensorRecord,
    profile: PhoneMountCalibrationProfile | null,
    settings?: AppSettings,
    previousLean?: number
  ): {
    leanAngleDeg: number;
    leanDirection: 'LEFT' | 'RIGHT' | 'CENTER';
    leanState: 'NORMAL' | 'CAUTION' | 'HIGH';
  } {
    // If not calibrated, use raw accelerometer lateral axis as fallback
    const baselineRoll = profile?.calibrated ? profile.baselineOrientation.roll : 0;

    // Calculate current instantaneous roll angle relative to gravity
    const rawRollDeg = Math.atan2(
      record.accelX,
      Math.sqrt(record.accelY * record.accelY + record.accelZ * record.accelZ)
    ) * (180 / Math.PI);

    // Subtract mount baseline tilt
    let relativeLean = rawRollDeg - baselineRoll;

    // Apply low-pass exponential smoothing filter to reject road vibration chatter
    if (previousLean !== undefined && !isNaN(previousLean)) {
      relativeLean = 0.75 * previousLean + 0.25 * relativeLean;
    }

    // Clamp between -85 and +85 degrees
    relativeLean = Math.max(-85, Math.min(85, relativeLean));

    const absLean = Math.abs(relativeLean);
    const direction: 'LEFT' | 'RIGHT' | 'CENTER' =
      absLean < 2.5 ? 'CENTER' : relativeLean > 0 ? 'RIGHT' : 'LEFT';

    const cautionThreshold = settings?.leanAngleCautionDeg || 35;
    const highThreshold = settings?.leanAngleHighDeg || 48;

    let state: 'NORMAL' | 'CAUTION' | 'HIGH' = 'NORMAL';
    if (absLean >= highThreshold) {
      state = 'HIGH';
    } else if (absLean >= cautionThreshold) {
      state = 'CAUTION';
    }

    return {
      leanAngleDeg: Number(absLean.toFixed(1)),
      leanDirection: direction,
      leanState: state,
    };
  }
}
