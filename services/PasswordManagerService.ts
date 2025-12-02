import { AppSettings, AuthState, PasswordFormData, PasswordGeneratorOptions } from '../types/PasswordTypes';
import PasswordUtils from '../utils/PasswordUtils';
import AutoLockService from './AutoLockService';
import BiometricAuthService from './BiometricAuthService';
import EncryptionService from './EncryptionService';
import SecureStorageService, { PasswordEntry } from './SecureStorageService';

class PasswordManagerService {
  private isInitialized = false;
  private currentAuthState: AuthState = {
    isAuthenticated: false,
    isInitialized: false
  };

  /**
   * Initializes the password manager
   */
  async initialize(): Promise<boolean> {
    try {
      // Initialize secure storage
      const storageInitialized = await SecureStorageService.initialize();
      if (!storageInitialized) {
        throw new Error('Failed to initialize secure storage');
      }

      // Initialize auto-lock service
      await AutoLockService.initialize();

      this.isInitialized = true;
      this.currentAuthState.isInitialized = true;

      return true;
    } catch (error) {
      console.error('Error initializing password manager:', error);
      return false;
    }
  }

  /**
   * Authenticates the user
   */
  async authenticate(reason?: string): Promise<AuthState> {
    try {
      if (!this.isInitialized) {
        throw new Error('Password manager not initialized');
      }

      const authResult = await BiometricAuthService.authenticate(reason);
      
      this.currentAuthState = {
        isAuthenticated: authResult.success,
        isInitialized: true,
        biometricType: authResult.biometricType,
        error: authResult.error
      };

      if (authResult.success) {
        await AutoLockService.unlock();
      }

      return this.currentAuthState;
    } catch (error) {
      this.currentAuthState = {
        isAuthenticated: false,
        isInitialized: true,
        error: `Authentication failed: ${error}`
      };
      return this.currentAuthState;
    }
  }

  /**
   * Sets up PIN authentication
   */
  async setupPIN(pin: string): Promise<boolean> {
    try {
      return await BiometricAuthService.setupPIN(pin);
    } catch (error) {
      console.error('Error setting up PIN:', error);
      return false;
    }
  }

  /**
   * Authenticates with PIN
   */
  async authenticateWithPIN(pin: string): Promise<boolean> {
    try {
      const success = await BiometricAuthService.authenticateWithPIN(pin);
      
      if (success) {
        this.currentAuthState.isAuthenticated = true;
        this.currentAuthState.error = undefined;
        await AutoLockService.unlock();
      }
      
      return success;
    } catch (error) {
      console.error('Error authenticating with PIN:', error);
      return false;
    }
  }

  /**
   * Gets all passwords
   */
  async getPasswords(): Promise<PasswordEntry[]> {
    try {
      if (!this.currentAuthState.isAuthenticated) {
        throw new Error('User not authenticated');
      }

      // Add timeout to prevent indefinite loading
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Operation timeout')), 10000); // 10 second timeout
      });

      const passwordsPromise = SecureStorageService.getPasswords();
      
      const passwords = await Promise.race([passwordsPromise, timeoutPromise]);
      AutoLockService.updateLastActivity();
      
      return passwords;
    } catch (error) {
      console.error('Error getting passwords:', error);
      return [];
    }
  }

  /**
   * Adds a new password
   */
  async addPassword(passwordData: PasswordFormData): Promise<boolean> {
    try {
      if (!this.currentAuthState.isAuthenticated) {
        throw new Error('User not authenticated');
      }

      const success = await SecureStorageService.addPassword(passwordData);
      
      if (success) {
        AutoLockService.updateLastActivity();
      }
      
      return success;
    } catch (error) {
      console.error('Error adding password:', error);
      return false;
    }
  }

  /**
   * Updates an existing password
   */
  async updatePassword(id: string, updates: Partial<PasswordFormData>): Promise<boolean> {
    try {
      if (!this.currentAuthState.isAuthenticated) {
        throw new Error('User not authenticated');
      }

      const success = await SecureStorageService.updatePassword(id, updates);
      
      if (success) {
        AutoLockService.updateLastActivity();
      }
      
      return success;
    } catch (error) {
      console.error('Error updating password:', error);
      return false;
    }
  }

  /**
   * Deletes a password
   */
  async deletePassword(id: string): Promise<boolean> {
    try {
      if (!this.currentAuthState.isAuthenticated) {
        throw new Error('User not authenticated');
      }

      const success = await SecureStorageService.deletePassword(id);
      
      if (success) {
        AutoLockService.updateLastActivity();
      }
      
      return success;
    } catch (error) {
      console.error('Error deleting password:', error);
      return false;
    }
  }

  /**
   * Searches passwords
   */
  async searchPasswords(query: string): Promise<PasswordEntry[]> {
    try {
      if (!this.currentAuthState.isAuthenticated) {
        throw new Error('User not authenticated');
      }

      const passwords = await SecureStorageService.searchPasswords(query);
      AutoLockService.updateLastActivity();
      
      return passwords;
    } catch (error) {
      console.error('Error searching passwords:', error);
      return [];
    }
  }

  /**
   * Sets the callback to be called when the app should lock
   */
  setOnLockCallback(callback: () => void): void {
    AutoLockService.setOnLockCallback(callback);
  }

  /**
   * Generates a secure password
   */
  generatePassword(options: Partial<PasswordGeneratorOptions> = {}): string {
    try {
      const defaultOptions = {
        length: 16,
        includeUppercase: true,
        includeLowercase: true,
        includeNumbers: true,
        includeSymbols: true
      };

      const finalOptions = { ...defaultOptions, ...options };
      return EncryptionService.generatePassword(finalOptions);
    } catch (error) {
      console.error('Error generating password:', error);
      return '';
    }
  }

  /**
   * Gets password strength
   */
  getPasswordStrength(password: string) {
    return PasswordUtils.calculatePasswordStrength(password);
  }

  /**
   * Validates password
   */
  validatePassword(password: string, requirements: any) {
    return PasswordUtils.validatePassword(password, requirements);
  }

  /**
   * Gets app settings
   */
  async getAppSettings(): Promise<AppSettings> {
    try {
      const autoLockSettings = await AutoLockService.getAutoLockSettings();
      const biometricEnabled = await BiometricAuthService.isBiometricEnabled();
      
      return {
        autoLockTimeout: autoLockSettings.timeoutMinutes,
        biometricEnabled,
        theme: 'auto' // Default theme
      };
    } catch (error) {
      console.error('Error getting app settings:', error);
      return {
        autoLockTimeout: 5,
        biometricEnabled: false,
        theme: 'auto'
      };
    }
  }

  /**
   * Updates app settings
   */
  async updateAppSettings(settings: Partial<AppSettings>): Promise<boolean> {
    try {
      if (settings.autoLockTimeout !== undefined) {
        await AutoLockService.updateAutoLockSettings({
          timeoutMinutes: settings.autoLockTimeout
        });
      }

      if (settings.biometricEnabled !== undefined) {
        if (settings.biometricEnabled) {
          await BiometricAuthService.enableBiometric();
        } else {
          await BiometricAuthService.disableBiometric();
        }
      }

      return true;
    } catch (error) {
      console.error('Error updating app settings:', error);
      return false;
    }
  }

  /**
   * Exports passwords
   */
  async exportPasswords(): Promise<string> {
    try {
      if (!this.currentAuthState.isAuthenticated) {
        throw new Error('User not authenticated');
      }

      return await SecureStorageService.exportPasswords();
    } catch (error) {
      console.error('Error exporting passwords:', error);
      return '';
    }
  }

  /**
   * Imports passwords
   */
  async importPasswords(jsonData: string): Promise<boolean> {
    try {
      if (!this.currentAuthState.isAuthenticated) {
        throw new Error('User not authenticated');
      }

      return await SecureStorageService.importPasswords(jsonData);
    } catch (error) {
      console.error('Error importing passwords:', error);
      return false;
    }
  }

  /**
   * Clears all data
   */
  async clearAllData(): Promise<void> {
    try {
      await SecureStorageService.clearAllData();
      await BiometricAuthService.clearAuthData();
      this.currentAuthState.isAuthenticated = false;
    } catch (error) {
      console.error('Error clearing all data:', error);
    }
  }

  /**
   * Locks the app
   */
  async lock(): Promise<void> {
    try {
      this.currentAuthState.isAuthenticated = false;
      await AutoLockService.lock();
    } catch (error) {
      console.error('Error locking app:', error);
    }
  }

  /**
   * Sets the authentication state
   */
  setAuthenticated(authenticated: boolean): void {
    this.currentAuthState.isAuthenticated = authenticated;
    if (authenticated) {
      this.currentAuthState.error = undefined;
    }
  }

  /**
   * Gets current authentication state
   */
  getAuthState(): AuthState {
    return { ...this.currentAuthState };
  }

  /**
   * Checks if app is locked
   */
  isLocked(): boolean {
    return AutoLockService.isAppLocked();
  }

  /**
   * Updates last activity
   */
  updateLastActivity(): void {
    AutoLockService.updateLastActivity();
  }

  /**
   * Checks if biometric is available
   */
  async isBiometricAvailable(): Promise<boolean> {
    return await BiometricAuthService.isBiometricAvailable();
  }

  /**
   * Checks if PIN is set up
   */
  async isPINSetup(): Promise<boolean> {
    return await BiometricAuthService.isPINSetup();
  }

  /**
   * Cleans up the service
   */
  cleanup(): void {
    AutoLockService.cleanup();
  }
}

export default new PasswordManagerService();
