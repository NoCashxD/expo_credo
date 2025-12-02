import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

export interface BiometricAuthResult {
  success: boolean;
  error?: string;
  biometricType?: 'fingerprint' | 'facial' | 'iris';
}

class BiometricAuthService {
  private readonly PIN_KEY = 'user_pin_hash';
  private readonly BIOMETRIC_KEY = 'biometric_enabled';

  /**
   * Checks if biometric authentication is available on the device
   */
  async isBiometricAvailable(): Promise<boolean> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      return hasHardware && isEnrolled;
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      return false;
    }
  }

  /**
   * Gets the type of biometric authentication available
   */
  async getBiometricType(): Promise<'fingerprint' | 'facial' | 'iris' | null> {
    try {
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      
      if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        return 'fingerprint';
      } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        return 'facial';
      } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
        return 'iris';
      }
      
      return null;
    } catch (error) {
      console.error('Error getting biometric type:', error);
      return null;
    }
  }

  /**
   * Authenticates using biometrics
   */
  async authenticateWithBiometrics(reason?: string): Promise<BiometricAuthResult> {
    try {
      const isAvailable = await this.isBiometricAvailable();
      if (!isAvailable) {
        return {
          success: false,
          error: 'Biometric authentication is not available on this device'
        };
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: reason || 'Authenticate to access your passwords',
        fallbackLabel: 'Use PIN',
        disableDeviceFallback: false,
        cancelLabel: 'Cancel'
      });

      if (result.success) {
        const biometricType = await this.getBiometricType();
        return {
          success: true,
          biometricType: biometricType || undefined
        };
      } else {
        return {
          success: false,
          error: result.error || 'Biometric authentication failed'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `Biometric authentication error: ${error}`
      };
    }
  }

  /**
   * Sets up PIN authentication
   */
  async setupPIN(pin: string): Promise<boolean> {
    try {
      // Hash the PIN before storing
      const hashedPIN = await this.hashPIN(pin);
      await SecureStore.setItemAsync(this.PIN_KEY, hashedPIN);
      return true;
    } catch (error) {
      console.error('Error setting up PIN:', error);
      return false;
    }
  }

  /**
   * Authenticates using PIN
   */
  async authenticateWithPIN(pin: string): Promise<boolean> {
    try {
      const storedHash = await SecureStore.getItemAsync(this.PIN_KEY);
      if (!storedHash) {
        return false;
      }

      const inputHash = await this.hashPIN(pin);
      return inputHash === storedHash;
    } catch (error) {
      console.error('Error authenticating with PIN:', error);
      return false;
    }
  }

  /**
   * Checks if PIN is set up
   */
  async isPINSetup(): Promise<boolean> {
    try {
      const storedHash = await SecureStore.getItemAsync(this.PIN_KEY);
      return storedHash !== null;
    } catch (error) {
      console.error('Error checking PIN setup:', error);
      return false;
    }
  }

  /**
   * Enables biometric authentication
   */
  async enableBiometric(): Promise<boolean> {
    try {
      await SecureStore.setItemAsync(this.BIOMETRIC_KEY, 'true');
      return true;
    } catch (error) {
      console.error('Error enabling biometric:', error);
      return false;
    }
  }

  /**
   * Disables biometric authentication
   */
  async disableBiometric(): Promise<boolean> {
    try {
      await SecureStore.deleteItemAsync(this.BIOMETRIC_KEY);
      return true;
    } catch (error) {
      console.error('Error disabling biometric:', error);
      return false;
    }
  }

  /**
   * Checks if biometric authentication is enabled
   */
  async isBiometricEnabled(): Promise<boolean> {
    try {
      const enabled = await SecureStore.getItemAsync(this.BIOMETRIC_KEY);
      return enabled === 'true';
    } catch (error) {
      console.error('Error checking biometric status:', error);
      return false;
    }
  }

  /**
   * Performs authentication with biometric or PIN fallback
   */
  async authenticate(reason?: string): Promise<BiometricAuthResult> {
    try {
      const isBiometricEnabled = await this.isBiometricEnabled();
      const isBiometricAvailable = await this.isBiometricAvailable();

      // Try biometric first if enabled and available
      if (isBiometricEnabled && isBiometricAvailable) {
        const biometricResult = await this.authenticateWithBiometrics(reason);
        if (biometricResult.success) {
          return biometricResult;
        }
        // If biometric fails, fall back to PIN
      }

      // Fall back to PIN authentication
      const isPINSetup = await this.isPINSetup();
      if (!isPINSetup) {
        return {
          success: false,
          error: 'No authentication method is set up'
        };
      }

      // For PIN authentication, we'll need to implement a PIN input UI
      // This is a placeholder - the actual PIN input will be handled in the UI
      return {
        success: false,
        error: 'PIN authentication required - implement PIN input UI'
      };
    } catch (error) {
      return {
        success: false,
        error: `Authentication error: ${error}`
      };
    }
  }

  /**
   * Hashes PIN using a secure method
   */
  private async hashPIN(pin: string): Promise<string> {
    // In a real implementation, use a proper hashing library
    // For this demo, we'll use a simple approach
    const encoder = new TextEncoder();
    const data = encoder.encode(pin + 'salt');
    
    // Use Web Crypto API if available, otherwise fallback
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } else {
      // Fallback for environments without Web Crypto API
      return btoa(pin + 'salt');
    }
  }

  /**
   * Clears all authentication data
   */
  async clearAuthData(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(this.PIN_KEY);
      await SecureStore.deleteItemAsync(this.BIOMETRIC_KEY);
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  }
}

export default new BiometricAuthService();
