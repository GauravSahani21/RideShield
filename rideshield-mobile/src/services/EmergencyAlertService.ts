import * as Haptics from 'expo-haptics';
import * as SMS from 'expo-sms';
import { Linking, Platform } from 'react-native';
import { EmergencyContact, IncidentEvent, LocationData } from '../types';

let AudioModule: any = null;
try {
  AudioModule = require('expo-av').Audio;
} catch {
  AudioModule = null;
}

class EmergencyAlertService {
  private soundObject: any = null;
  private hapticInterval: any = null;
  private isAlarmPlaying = false;

  /**
   * Play high-pitch emergency siren sound using audio synthesizer / tone
   */
  public async startAlarm(): Promise<void> {
    if (this.isAlarmPlaying) return;
    this.isAlarmPlaying = true;

    if (AudioModule) {
      try {
        await AudioModule.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
        });

        const { sound } = await AudioModule.Sound.createAsync(
          { uri: 'https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg' },
          { shouldPlay: true, isLooping: true, volume: 1.0 }
        );
        this.soundObject = sound;
        await this.soundObject.playAsync();
      } catch (e) {
        console.warn('Audio play fallback:', e);
      }
    }

    // Heavy pulsing vibration
    this.startEmergencyVibration();
  }

  private startEmergencyVibration(): void {
    if (this.hapticInterval) clearInterval(this.hapticInterval);

    this.hapticInterval = setInterval(() => {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch (err) {
        // Safe fallback
      }
    }, 600);
  }

  /**
   * Stop alarm sound and cancel haptics
   */
  public async stopAlarm(): Promise<void> {
    this.isAlarmPlaying = false;

    if (this.hapticInterval) {
      clearInterval(this.hapticInterval);
      this.hapticInterval = null;
    }

    if (this.soundObject) {
      try {
        await this.soundObject.stopAsync();
        await this.soundObject.unloadAsync();
      } catch (err) {
        // Already unloaded
      }
      this.soundObject = null;
    }

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {}
  }

  /**
   * Build emergency SMS message text with GPS coordinates and Google Maps link
   */
  public formatSosMessage(
    incident: IncidentEvent,
    location?: LocationData | null,
    customTemplate?: string
  ): string {
    const timeStr = new Date(incident.timestamp).toLocaleTimeString();
    const dateStr = new Date(incident.timestamp).toLocaleDateString();

    let locStr = 'Location: Unavailable';
    let mapUrl = '';

    if (location) {
      const lat = location.latitude.toFixed(6);
      const lng = location.longitude.toFixed(6);
      locStr = `Lat: ${lat}, Lng: ${lng}`;
      mapUrl = `https://maps.google.com/?q=${lat},${lng}`;
    }

    return (
      `🚨 [RIDESHIELD SOS ALERT] 🚨\n\n` +
      `A motorcycle crash / critical incident has been detected for the rider!\n\n` +
      `📅 Time: ${dateStr} ${timeStr}\n` +
      `📍 Coordinates: ${locStr}\n` +
      (mapUrl ? `🗺️ Live Map: ${mapUrl}\n` : '') +
      `💥 Peak Impact: ${incident.peakAccelG.toFixed(1)}G (Speed: ${incident.speedAtEventKmh.toFixed(0)} km/h)\n\n` +
      `Please contact or dispatch emergency help immediately!`
    );
  }

  /**
   * Dispatch SOS via SMS to all emergency contacts
   */
  public async dispatchSos(
    contacts: EmergencyContact[],
    incident: IncidentEvent,
    location?: LocationData | null
  ): Promise<{ success: boolean; method: string }> {
    if (!contacts || contacts.length === 0) {
      return { success: false, method: 'No contacts configured' };
    }

    const message = this.formatSosMessage(incident, location);
    const phoneNumbers = contacts.map((c) => c.phone.trim()).filter(Boolean);

    try {
      const isAvailable = await SMS.isAvailableAsync();
      if (isAvailable && phoneNumbers.length > 0) {
        await SMS.sendSMSAsync(phoneNumbers, message);
        return { success: true, method: 'SMS' };
      }
    } catch (e) {
      console.warn('SMS dispatch error, falling back to tel/sms URI:', e);
    }

    // Fallback: Open system dialer or SMS link
    const primary = contacts.find((c) => c.priority === 1) || contacts[0];
    if (primary && primary.phone) {
      const separator = Platform.OS === 'ios' ? '&' : '?';
      const uri = `sms:${primary.phone}${separator}body=${encodeURIComponent(message)}`;
      Linking.openURL(uri).catch(() => {
        // Fallback to phone call
        Linking.openURL(`tel:${primary.phone}`);
      });
      return { success: true, method: 'Native SMS/Call Fallback' };
    }

    return { success: false, method: 'Failed to dispatch' };
  }
}

export const emergencyAlertService = new EmergencyAlertService();
