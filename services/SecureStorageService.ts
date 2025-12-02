import * as SecureStore from 'expo-secure-store';
import EncryptionService from './EncryptionService';

export interface StoredPassword {
  id: string;
  title: string;
  username: string;
  password: string;
  website?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PasswordEntry {
  id: string;
  title: string;
  username: string;
  password: string;
  website?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

class SecureStorageService {
  private readonly PASSWORDS_KEY = 'encrypted_passwords';
  private readonly MASTER_KEY_KEY = 'master_key_data';

  /**
   * Initializes secure storage with biometric-derived encryption key
   */
  async initialize(): Promise<boolean> {
  try {
    // Check if already initialized
    const existingData = await SecureStore.getItemAsync(this.PASSWORDS_KEY);
    if (existingData) {
      console.log('Secure storage already initialized.');
      return true; // ✅ Do NOT overwrite
    }

    // Only run this code once (first install / reset)
    const emptyData = JSON.stringify([]);
    const biometricData = await this.getBiometricData();
    
    if (!biometricData) {
      throw new Error('Biometric authentication not available');
    }

    const encryptedResult = await EncryptionService.encrypt(emptyData, biometricData);
    await this.storeEncryptedData(encryptedResult);

    console.log('Secure storage initialized successfully.');
    return true;
  } catch (error) {
    console.error('Error initializing secure storage:', error);
    return false;
  }
}


  /**
   * Gets biometric data for key derivation
   */
  private async getBiometricData(): Promise<string | null> {
    try {
      // In a real implementation, you would derive this from actual biometric data
      // For this demo, we'll use a device-specific identifier
      const deviceId = await SecureStore.getItemAsync('device_id');
      
      if (!deviceId) {
        // Generate a device-specific identifier
        const newDeviceId = this.generateDeviceId();
        await SecureStore.setItemAsync('device_id', newDeviceId);
        return newDeviceId;
      }
      
      return deviceId;
    } catch (error) {
      console.error('Error getting biometric data:', error);
      return null;
    }
  }

  /**
   * Generates a device-specific identifier
   */
  private generateDeviceId(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2);
    return btoa(timestamp + random);
  }

  /**
   * Stores encrypted data
   */
  private async storeEncryptedData(encryptedData: any): Promise<void> {
    const dataString = JSON.stringify(encryptedData);
    await SecureStore.setItemAsync(this.PASSWORDS_KEY, dataString);
  }

  /**
   * Retrieves and decrypts stored passwords
   */
  async getPasswords(): Promise<PasswordEntry[]> {
    try {
      const biometricData = await this.getBiometricData();
      if (!biometricData) {
        throw new Error('Biometric authentication not available');
      }

      const encryptedDataString = await SecureStore.getItemAsync(this.PASSWORDS_KEY);
      if (!encryptedDataString) {
        return [];
      }

      let encryptedData;
      try {
        encryptedData = JSON.parse(encryptedDataString);
      } catch (parseError) {
        console.error('Error parsing encrypted data:', parseError);
        // Clear corrupted data
        await SecureStore.deleteItemAsync(this.PASSWORDS_KEY);
        return [];
      }

      const decryptedResult = await EncryptionService.decrypt(
        encryptedData.encryptedData,
        biometricData,
        encryptedData.salt
      );

      let storedPasswords: StoredPassword[];
      try {
        storedPasswords = JSON.parse(decryptedResult.decryptedData);
      } catch (parseError) {
        console.error('Error parsing decrypted data:', parseError);
        // Clear corrupted data
        await SecureStore.deleteItemAsync(this.PASSWORDS_KEY);
        return [];
      }
      
      // Convert to PasswordEntry format
      return storedPasswords.map(pwd => ({
        ...pwd,
        createdAt: new Date(pwd.createdAt),
        updatedAt: new Date(pwd.updatedAt)
      }));
    } catch (error) {
      console.error('Error getting passwords:', error);
      return [];
    }
  }

  /**
   * Saves passwords with encryption
   */
  async savePasswords(passwords: PasswordEntry[]): Promise<boolean> {
    try {
      const biometricData = await this.getBiometricData();
      if (!biometricData) {
        throw new Error('Biometric authentication not available');
      }

      // Convert to StoredPassword format
      const storedPasswords: StoredPassword[] = passwords.map(pwd => ({
        ...pwd,
        createdAt: pwd.createdAt.toISOString(),
        updatedAt: pwd.updatedAt.toISOString()
      }));

      const dataString = JSON.stringify(storedPasswords);
      const encryptedResult = await EncryptionService.encrypt(dataString, biometricData);
      await this.storeEncryptedData(encryptedResult);

      return true;
    } catch (error) {
      console.error('Error saving passwords:', error);
      return false;
    }
  }

  /**
   * Adds a new password entry
   */
  async addPassword(passwordData: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> {
    try {
      const passwords = await this.getPasswords();
      
      const newPassword: PasswordEntry = {
        ...passwordData,
        id: this.generateId(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      passwords.push(newPassword);
      return await this.savePasswords(passwords);
    } catch (error) {
      console.error('Error adding password:', error);
      return false;
    }
  }

  /**
   * Updates an existing password entry
   */
  async updatePassword(id: string, updates: Partial<Omit<PasswordEntry, 'id' | 'createdAt'>>): Promise<boolean> {
    try {
      const passwords = await this.getPasswords();
      const index = passwords.findIndex(pwd => pwd.id === id);
      
      if (index === -1) {
        return false;
      }

      passwords[index] = {
        ...passwords[index],
        ...updates,
        updatedAt: new Date()
      };

      return await this.savePasswords(passwords);
    } catch (error) {
      console.error('Error updating password:', error);
      return false;
    }
  }

  /**
   * Deletes a password entry
   */
  async deletePassword(id: string): Promise<boolean> {
    try {
      const passwords = await this.getPasswords();
      const filteredPasswords = passwords.filter(pwd => pwd.id !== id);
      
      if (filteredPasswords.length === passwords.length) {
        return false; // Password not found
      }

      return await this.savePasswords(filteredPasswords);
    } catch (error) {
      console.error('Error deleting password:', error);
      return false;
    }
  }

  /**
   * Searches passwords by title, username, or website
   */
  async searchPasswords(query: string): Promise<PasswordEntry[]> {
    try {
      const passwords = await this.getPasswords();
      const lowercaseQuery = query.toLowerCase();
      
      return passwords.filter(pwd => 
        pwd.title.toLowerCase().includes(lowercaseQuery) ||
        pwd.username.toLowerCase().includes(lowercaseQuery) ||
        (pwd.website && pwd.website.toLowerCase().includes(lowercaseQuery)) ||
        (pwd.notes && pwd.notes.toLowerCase().includes(lowercaseQuery))
      );
    } catch (error) {
      console.error('Error searching passwords:', error);
      return [];
    }
  }

  /**
   * Generates a unique ID
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  /**
   * Clears all stored data
   */
 async clearAllData(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(this.PASSWORDS_KEY);
      await SecureStore.deleteItemAsync(this.MASTER_KEY_KEY);
      await SecureStore.deleteItemAsync('device_id');
    } catch (error) {
      console.error('Error clearing all data:', error);
    }
  }

  /**
   * Exports passwords (for backup purposes)
   */
  async exportPasswords(): Promise<string> {
    try {
      const passwords = await this.getPasswords();
      return JSON.stringify(passwords, null, 2);
    } catch (error) {
      console.error('Error exporting passwords:', error);
      return '';
    }
  }

  /**
   * Imports passwords from backup
   */
  async importPasswords(jsonData: string): Promise<boolean> {
    try {
      const importedPasswords: PasswordEntry[] = JSON.parse(jsonData);
      
      // Validate the imported data
      if (!Array.isArray(importedPasswords)) {
        throw new Error('Invalid data format');
      }

      // Add timestamps if missing
      const passwordsWithTimestamps = importedPasswords.map(pwd => ({
        ...pwd,
        id: pwd.id || this.generateId(),
        createdAt: pwd.createdAt ? new Date(pwd.createdAt) : new Date(),
        updatedAt: pwd.updatedAt ? new Date(pwd.updatedAt) : new Date()
      }));

      return await this.savePasswords(passwordsWithTimestamps);
    } catch (error) {
      console.error('Error importing passwords:', error);
      return false;
    }
  }
}

export default new SecureStorageService();
