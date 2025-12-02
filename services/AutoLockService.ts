import * as SecureStore from 'expo-secure-store';
import { AppState } from 'react-native';

export interface AutoLockSettings {
  enabled: boolean;
  timeoutMinutes: number;
}

class AutoLockService {
  private readonly AUTO_LOCK_KEY = 'auto_lock_settings';
  private readonly LAST_ACTIVITY_KEY = 'last_activity';
  private readonly DEFAULT_TIMEOUT = 5; // minutes
  
  private isLocked = false;
  private lastActivityTime: Date | null = null;
  private lockTimer: NodeJS.Timeout | null = null;
  private onLockCallback: (() => void) | null = null;
  private appStateSubscription: any;
  /**
   * Initializes the auto-lock service
   */
  async initialize(): Promise<void> {
    try {
      const settings = await this.getAutoLockSettings();
      const lastActivity = await this.getLastActivity();
  
      this.lastActivityTime = lastActivity;
  
      if (settings.enabled) {
        this.startAutoLockTimer(settings.timeoutMinutes);
      }
  
      // Use the new subscription API
      this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange);
    } catch (error) {
      console.error('Error initializing auto-lock service:', error);
    }
  }

  /**
   * Sets the callback to be called when the app should lock
   */
  setOnLockCallback(callback: () => void): void {
    this.onLockCallback = callback;
  }

  /**
   * Updates the last activity time
   */
  updateLastActivity(): void {
    this.lastActivityTime = new Date();
    this.saveLastActivity(this.lastActivityTime);
  }

  /**
   * Checks if the app should be locked based on timeout
   */
  async shouldLock(): Promise<boolean> {
    try {
      const settings = await this.getAutoLockSettings();
      
      if (!settings.enabled || !this.lastActivityTime) {
        return false;
      }
      
      const now = new Date();
      const timeDiff = now.getTime() - this.lastActivityTime.getTime();
      const timeoutMs = settings.timeoutMinutes * 60 * 1000;
      
      return timeDiff >= timeoutMs;
    } catch (error) {
      console.error('Error checking if should lock:', error);
      return false;
    }
  }

  /**
   * Locks the app
   */
  async lock(): Promise<void> {
    try {
      this.isLocked = true;
      this.clearLockTimer();
      
      if (this.onLockCallback) {
        this.onLockCallback();
      }
    } catch (error) {
      console.error('Error locking app:', error);
    }
  }

  /**
   * Unlocks the app
   */
  async unlock(): Promise<void> {
    try {
      this.isLocked = false;
      this.updateLastActivity();
      
      const settings = await this.getAutoLockSettings();
      if (settings.enabled) {
        this.startAutoLockTimer(settings.timeoutMinutes);
      }
    } catch (error) {
      console.error('Error unlocking app:', error);
    }
  }

  /**
   * Checks if the app is currently locked
   */
  isAppLocked(): boolean {
    return this.isLocked;
  }

  /**
   * Gets auto-lock settings
   */
  async getAutoLockSettings(): Promise<AutoLockSettings> {
    try {
      const settingsString = await SecureStore.getItemAsync(this.AUTO_LOCK_KEY);
      
      if (settingsString) {
        return JSON.parse(settingsString);
      }
      
      return {
        enabled: true,
        timeoutMinutes: this.DEFAULT_TIMEOUT
      };
    } catch (error) {
      console.error('Error getting auto-lock settings:', error);
      return {
        enabled: true,
        timeoutMinutes: this.DEFAULT_TIMEOUT
      };
    }
  }

  /**
   * Updates auto-lock settings
   */
  async updateAutoLockSettings(settings: Partial<AutoLockSettings>): Promise<boolean> {
    try {
      const currentSettings = await this.getAutoLockSettings();
      const newSettings = { ...currentSettings, ...settings };
      
      await SecureStore.setItemAsync(this.AUTO_LOCK_KEY, JSON.stringify(newSettings));
      
      // Restart timer with new settings
      this.clearLockTimer();
      if (newSettings.enabled) {
        this.startAutoLockTimer(newSettings.timeoutMinutes);
      }
      
      return true;
    } catch (error) {
      console.error('Error updating auto-lock settings:', error);
      return false;
    }
  }

  /**
   * Gets the last activity time
   */
  private async getLastActivity(): Promise<Date | null> {
    try {
      const lastActivityString = await SecureStore.getItemAsync(this.LAST_ACTIVITY_KEY);
      
      if (lastActivityString) {
        return new Date(lastActivityString);
      }
      
      return null;
    } catch (error) {
      console.error('Error getting last activity:', error);
      return null;
    }
  }

  /**
   * Saves the last activity time
   */
  private async saveLastActivity(lastActivity: Date): Promise<void> {
    try {
      await SecureStore.setItemAsync(this.LAST_ACTIVITY_KEY, lastActivity.toISOString());
    } catch (error) {
      console.error('Error saving last activity:', error);
    }
  }

  /**
   * Starts the auto-lock timer
   */
  private startAutoLockTimer(timeoutMinutes: number): void {
    this.clearLockTimer();
    
    const timeoutMs = timeoutMinutes * 60 * 1000;
    this.lockTimer = setTimeout(async () => {
      const shouldLock = await this.shouldLock();
      if (shouldLock) {
        await this.lock();
      }
    }, timeoutMs);
  }

  /**
   * Clears the auto-lock timer
   */
  private clearLockTimer(): void {
    if (this.lockTimer) {
      clearTimeout(this.lockTimer);
      this.lockTimer = null;
    }
  }

  /**
   * Handles app state changes
   */
  private handleAppStateChange = async (nextAppState: string): Promise<void> => {
    try {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        // App is going to background, start timer
        const settings = await this.getAutoLockSettings();
        if (settings.enabled) {
          this.startAutoLockTimer(settings.timeoutMinutes);
        }
      } else if (nextAppState === 'active') {
        // App is becoming active, check if it should be locked
        const shouldLock = await this.shouldLock();
        if (shouldLock) {
          await this.lock();
        } else {
          this.updateLastActivity();
        }
      }
    } catch (error) {
      console.error('Error handling app state change:', error);
    }
  };

  /**
   * Cleans up the service
   */
  cleanup(): void {
    this.clearLockTimer();
    this.appStateSubscription?.remove(); // ✅ modern cleanup
  }
}

export default new AutoLockService();
