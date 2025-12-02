import { PASSWORD_STRENGTH_LEVELS, PasswordStrength } from '../types/PasswordTypes';

export class PasswordUtils {
  /**
   * Calculates password strength based on various criteria
   */
  static calculatePasswordStrength(password: string): PasswordStrength {
    if (password.length < 8) {
      return PASSWORD_STRENGTH_LEVELS.WEAK;
    }

    let score = 0;
    
    // Length scoring
    if (password.length >= 12) score += 1;
    if (password.length >= 16) score += 1;
    if (password.length >= 20) score += 1;

    // Character variety scoring
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^a-zA-Z0-9]/.test(password)) score += 1;

    // Pattern detection (penalties)
    if (/(.)\1{2,}/.test(password)) score -= 1; // Repeated characters
    if (/123|abc|qwe/i.test(password)) score -= 1; // Common sequences
    if (/password|123456|qwerty/i.test(password)) score -= 2; // Common passwords

    if (score <= 2) return PASSWORD_STRENGTH_LEVELS.WEAK;
    if (score <= 4) return PASSWORD_STRENGTH_LEVELS.MEDIUM;
    if (score <= 6) return PASSWORD_STRENGTH_LEVELS.STRONG;
    return PASSWORD_STRENGTH_LEVELS.VERY_STRONG;
  }

  /**
   * Gets password strength color for UI
   */
  static getPasswordStrengthColor(strength: PasswordStrength): string {
    switch (strength) {
      case PASSWORD_STRENGTH_LEVELS.WEAK:
        return '#ff4444';
      case PASSWORD_STRENGTH_LEVELS.MEDIUM:
        return '#ffaa00';
      case PASSWORD_STRENGTH_LEVELS.STRONG:
        return '#00aa00';
      case PASSWORD_STRENGTH_LEVELS.VERY_STRONG:
        return '#0066cc';
      default:
        return '#666666';
    }
  }

  /**
   * Gets password strength label for UI
   */
  static getPasswordStrengthLabel(strength: PasswordStrength): string {
    switch (strength) {
      case PASSWORD_STRENGTH_LEVELS.WEAK:
        return 'Weak';
      case PASSWORD_STRENGTH_LEVELS.MEDIUM:
        return 'Medium';
      case PASSWORD_STRENGTH_LEVELS.STRONG:
        return 'Strong';
      case PASSWORD_STRENGTH_LEVELS.VERY_STRONG:
        return 'Very Strong';
      default:
        return 'Unknown';
    }
  }

  /**
   * Validates password requirements
   */
  static validatePassword(password: string, requirements: {
    minLength?: number;
    requireUppercase?: boolean;
    requireLowercase?: boolean;
    requireNumbers?: boolean;
    requireSymbols?: boolean;
  } = {}): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const {
      minLength = 8,
      requireUppercase = false,
      requireLowercase = false,
      requireNumbers = false,
      requireSymbols = false
    } = requirements;

    if (password.length < minLength) {
      errors.push(`Password must be at least ${minLength} characters long`);
    }

    if (requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (requireNumbers && !/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (requireSymbols && !/[^a-zA-Z0-9]/.test(password)) {
      errors.push('Password must contain at least one symbol');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Masks password for display
   */
  static maskPassword(password: string, visibleChars: number = 2): string {
    if (password.length <= visibleChars) {
      return '·'.repeat(password.length);
    }
    return password.substring(0, visibleChars) + '·'.repeat(password.length - visibleChars);
  }

  /**
   * Generates a secure random string
   */
  static generateSecureString(length: number, charset: string): string {
    let result = '';
    const randomValues = new Uint8Array(length);
    crypto.getRandomValues(randomValues);
    
    for (let i = 0; i < length; i++) {
      result += charset[randomValues[i] % charset.length];
    }
    
    return result;
  }

  /**
   * Checks if password is commonly used
   */
  static isCommonPassword(password: string): boolean {
    const commonPasswords = [
      'password', '123456', '123456789', 'qwerty', 'abc123',
      'password123', 'admin', 'letmein', 'welcome', 'monkey',
      '1234567890', 'password1', 'qwerty123', 'dragon', 'master'
    ];
    
    return commonPasswords.includes(password.toLowerCase());
  }

  /**
   * Calculates password entropy
   */
  static calculateEntropy(password: string): number {
    let charsetSize = 0;
    
    if (/[a-z]/.test(password)) charsetSize += 26;
    if (/[A-Z]/.test(password)) charsetSize += 26;
    if (/[0-9]/.test(password)) charsetSize += 10;
    if (/[^a-zA-Z0-9]/.test(password)) charsetSize += 32; // Common symbols
    
    return Math.log2(Math.pow(charsetSize, password.length));
  }

  /**
   * Formats password for display in lists
   */
  static formatPasswordForDisplay(password: string, isVisible: boolean = false): string {
    if (isVisible) {
      return password;
    }
    return this.maskPassword(password, 1);
  }

  /**
   * Extracts domain from URL
   */
  static extractDomain(url: string): string {
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return url;
    }
  }

  /**
   * Generates password hint
   */
  static generatePasswordHint(password: string): string {
    const length = password.length;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    const hasSymbols = /[^a-zA-Z0-9]/.test(password);
    
    const parts = [];
    if (hasUpper) parts.push('uppercase');
    if (hasLower) parts.push('lowercase');
    if (hasNumbers) parts.push('numbers');
    if (hasSymbols) parts.push('symbols');
    
    return `${length} characters with ${parts.join(', ')}`;
  }
}

export default PasswordUtils;
