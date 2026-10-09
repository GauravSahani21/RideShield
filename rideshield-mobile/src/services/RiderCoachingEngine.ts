import { RideRecord, CoachingFeedback } from '../types';

export class RiderCoachingEngine {
  /**
   * Transparent mathematical scoring algorithm
   * Base: 100 points
   * Penalties:
   *  - Hard Braking: 4 points each (max 24)
   *  - Hard Cornering: 3 points each (max 18)
   *  - Potholes: 1 point each (awareness indicator, max 8)
   *  - Uncancelled Crash / Severe Impact: 30 points
   */
  public static calculateScore(eventCounts: {
    hardBraking: number;
    hardCornering: number;
    potholes: number;
    crashes: number;
  }): {
    score: number;
    breakdown: {
      base: number;
      hardBrakingPenalty: number;
      hardCorneringPenalty: number;
      potholePenalty: number;
      crashPenalty: number;
    };
  } {
    const hardBrakingPenalty = Math.min(24, eventCounts.hardBraking * 4);
    const hardCorneringPenalty = Math.min(18, eventCounts.hardCornering * 3);
    const potholePenalty = Math.min(8, eventCounts.potholes * 1);
    const crashPenalty = Math.min(40, eventCounts.crashes * 30);

    const totalPenalties = hardBrakingPenalty + hardCorneringPenalty + potholePenalty + crashPenalty;
    const score = Math.max(20, 100 - totalPenalties);

    return {
      score,
      breakdown: {
        base: 100,
        hardBrakingPenalty,
        hardCorneringPenalty,
        potholePenalty,
        crashPenalty,
      },
    };
  }

  /**
   * Generates actionable, constructive rider coaching recommendations
   */
  public static generateCoaching(ride: Partial<RideRecord>): CoachingFeedback[] {
    const tips: CoachingFeedback[] = [];
    const counts = ride.eventCounts || {
      hardBraking: 0,
      hardCornering: 0,
      potholes: 0,
      suddenAcceleration: 0,
      crashes: 0,
    };

    if (counts.hardBraking > 2) {
      tips.push({
        category: 'BRAKING',
        title: 'Following Distance Advisory',
        advice: `You had ${counts.hardBraking} hard braking events. Try maintaining a 3–4 second following distance from vehicles ahead to allow smoother deceleration.`,
        type: 'CAUTION',
      });
    } else {
      tips.push({
        category: 'BRAKING',
        title: 'Smooth Deceleration',
        advice: 'Excellent progressive braking technique observed throughout this ride.',
        type: 'POSITIVE',
      });
    }

    if (counts.hardCornering > 2) {
      tips.push({
        category: 'CORNERING',
        title: 'Apex & Lean Angle Stability',
        advice: `Detected ${counts.hardCornering} aggressive cornering transitions. Look through the turn and stabilize your throttle before initiating lean.`,
        type: 'CAUTION',
      });
    }

    if (counts.potholes > 3) {
      tips.push({
        category: 'GENERAL',
        title: 'Road Surface Hazard Awareness',
        advice: `${counts.potholes} road jolts detected. Scanning the pavement further ahead will give you more time to safely maneuver around road defects.`,
        type: 'INFO',
      });
    }

    if ((ride.safetyScore || 100) >= 90) {
      tips.push({
        category: 'PACE',
        title: 'Master Rider Recognition',
        advice: 'Outstanding ride consistency and protective instincts. Keep up the high safety standard!',
        type: 'POSITIVE',
      });
    }

    return tips;
  }
}
