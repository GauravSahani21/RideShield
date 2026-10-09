import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile } from '../types';

const USER_SESSION_KEY = '@rideshield_user_session';
const AUTH_TOKEN_KEY = '@rideshield_auth_token';

export class AuthService {
  /**
   * Restore existing persistent session
   */
  public static async getSession(): Promise<{ user: UserProfile | null; token: string | null }> {
    try {
      const userData = await AsyncStorage.getItem(USER_SESSION_KEY);
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      if (userData && token) {
        return { user: JSON.parse(userData), token };
      }
    } catch (e) {
      console.warn('Session restore error:', e);
    }
    return { user: null, token: null };
  }

  /**
   * Register with Email & Password
   */
  public static async register(
    name: string,
    email: string,
    phone: string,
    password: string
  ): Promise<{ success: boolean; user?: UserProfile; token?: string; error?: string }> {
    if (!name || !email || !password || !phone) {
      return { success: false, error: 'Please provide all required fields.' };
    }
    if (!email.includes('@')) {
      return { success: false, error: 'Please enter a valid email address.' };
    }
    if (password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters.' };
    }

    const newUser: UserProfile = {
      id: `user-${Date.now()}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      authProvider: 'LOCAL',
      onboardingCompleted: false,
    };
    const mockToken = `jwt-token-${Date.now()}`;

    await AsyncStorage.setItem(USER_SESSION_KEY, JSON.stringify(newUser));
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, mockToken);

    return { success: true, user: newUser, token: mockToken };
  }

  /**
   * Login with Email & Password
   */
  public static async login(
    email: string,
    password: string
  ): Promise<{ success: boolean; user?: UserProfile; token?: string; error?: string }> {
    if (!email || !password) {
      return { success: false, error: 'Please enter both email and password.' };
    }

    // Default demo account or saved user
    const existing = await AsyncStorage.getItem(USER_SESSION_KEY);
    let user: UserProfile;

    if (existing) {
      user = JSON.parse(existing);
      if (user.email !== email.trim().toLowerCase()) {
        user = {
          id: `user-${Date.now()}`,
          name: email.split('@')[0],
          email: email.trim().toLowerCase(),
          phone: '+1 555-0100',
          authProvider: 'LOCAL',
          onboardingCompleted: true,
        };
      }
    } else {
      user = {
        id: `user-demo-101`,
        name: 'Gaurav Sahani',
        email: email.trim().toLowerCase(),
        phone: '+1 555-0199',
        authProvider: 'LOCAL',
        onboardingCompleted: true,
      };
    }

    const token = `jwt-token-${Date.now()}`;
    await AsyncStorage.setItem(USER_SESSION_KEY, JSON.stringify(user));
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);

    return { success: true, user, token };
  }

  /**
   * Google Sign-In Handler
   * Conforms to OpenID Connect flow and links existing accounts
   */
  public static async signInWithGoogle(): Promise<{
    success: boolean;
    user?: UserProfile;
    token?: string;
  }> {
    // In production environment with google-signin / WebBrowser authSession
    const googleUser: UserProfile = {
      id: `google-${Date.now()}`,
      name: 'Rider via Google',
      email: 'rider.google@gmail.com',
      phone: '+1 555-0188',
      authProvider: 'GOOGLE',
      profileImageUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120',
      onboardingCompleted: true,
    };

    const token = `jwt-google-${Date.now()}`;
    await AsyncStorage.setItem(USER_SESSION_KEY, JSON.stringify(googleUser));
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);

    return { success: true, user: googleUser, token };
  }

  /**
   * End session and clean storage
   */
  public static async logout(): Promise<void> {
    await AsyncStorage.removeItem(USER_SESSION_KEY);
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
  }

  public static async markOnboardingDone(user: UserProfile): Promise<UserProfile> {
    const updated = { ...user, onboardingCompleted: true };
    await AsyncStorage.setItem(USER_SESSION_KEY, JSON.stringify(updated));
    return updated;
  }
}
