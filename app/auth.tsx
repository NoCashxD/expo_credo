import { Colors, Spacing, Typography } from '@/constants/theme';
import BiometricAuthService from '@/services/BiometricAuthService';
import PasswordManagerService from '@/services/PasswordManagerService';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

interface AuthScreenProps {
  onAuthenticated: () => void;
}

export default function AuthScreen({ onAuthenticated }: AuthScreenProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<'fingerprint' | 'facial' | 'iris' | null>(null);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const isPINSetup = await BiometricAuthService.isPINSetup();
      const isBiometricAvailable = await BiometricAuthService.isBiometricAvailable();
      const biometricType = await BiometricAuthService.getBiometricType();

      setIsFirstTime(!isPINSetup);
      setBiometricAvailable(isBiometricAvailable);
      setBiometricType(biometricType);

      // If PIN is set up, try biometric authentication first
      if (isPINSetup && isBiometricAvailable) {
        await handleBiometricAuth();
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
    }
  };

  const handleBiometricAuth = async () => {
    try {
      setIsLoading(true);
      const result = await BiometricAuthService.authenticateWithBiometrics(
        'Authenticate to access your passwords'
      );

      if (result.success) {
        onAuthenticated();
      } else {
        // Biometric failed, show PIN input
        setIsFirstTime(false);
      }
    } catch (error) {
      console.error('Error with biometric auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePINSetup = async () => {
    if (pin.length < 4) {
      Alert.alert('Error', 'PIN must be at least 4 digits');
      return;
    }

    if (pin !== confirmPin) {
      Alert.alert('Error', 'PINs do not match');
      return;
    }

    try {
      setIsLoading(true);
      const success = await BiometricAuthService.setupPIN(pin);
      
      if (success) {
        // Enable biometric if available
        if (biometricAvailable) {
          await BiometricAuthService.enableBiometric();
        }
        
        Alert.alert(
          'Setup Complete',
          'Your PIN has been set up successfully. You can now access your passwords.',
          [{ text: 'OK', onPress: onAuthenticated }]
        );
      } else {
        Alert.alert('Error', 'Failed to set up PIN. Please try again.');
      }
    } catch (error) {
      console.error('Error setting up PIN:', error);
      Alert.alert('Error', 'Failed to set up PIN. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePINAuth = async () => {
    if (pin.length < 4) {
      Alert.alert('Error', 'Please enter a valid PIN');
      return;
    }

    try {
      setIsLoading(true);
      const success = await PasswordManagerService.authenticateWithPIN(pin);
      
      if (success) {
        onAuthenticated();
      } else {
        Alert.alert('Error', 'Invalid PIN. Please try again.');
        setPin('');
      }
    } catch (error) {
      console.error('Error with PIN auth:', error);
      Alert.alert('Error', 'Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderBiometricButton = () => {
    if (!biometricAvailable) return null;

    const getBiometricIcon = () => {
      switch (biometricType) {
        case 'fingerprint':
          return 'finger-print';
        case 'facial':
          return 'face-recognition';
        case 'iris':
          return 'eye';
        default:
          return 'shield-checkmark';
      }
    };

    const getBiometricText = () => {
      switch (biometricType) {
        case 'fingerprint':
          return 'Use Fingerprint';
        case 'facial':
          return 'Use Face Recognition';
        case 'iris':
          return 'Use Iris Scan';
        default:
          return 'Use Biometric';
      }
    };

    return (
      <Button
        title={getBiometricText()}
        onPress={handleBiometricAuth}
        variant="secondary"
        fullWidth
        style={styles.biometricButton}
      />
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Image style={{ width : "80",height : "80" }} source={require('../assets/images/top.png')}/>
          </View>
          <Text style={styles.title}>Credo Manager</Text>
          <Text style={styles.subtitle}>
            {isFirstTime 
              ? 'Set up your PIN to get started' 
              : 'Enter your PIN to continue'
            }
          </Text>
        </View>

        <View style={styles.formContainer}>
          {isFirstTime ? (
            <>
              <Input
                label="Create PIN"
                placeholder="Enter 4+ digit PIN"
                value={pin}
                onChangeText={setPin}
                keyboardType="numeric"
                secureTextEntry
              />
              <Input
                label="Confirm PIN"
                placeholder="Confirm your PIN"
                value={confirmPin}
                onChangeText={setConfirmPin}
                keyboardType="numeric"
                secureTextEntry
              />
              <Button
                title="Set Up PIN"
                onPress={handlePINSetup}
                loading={isLoading}
                fullWidth
                style={styles.submitButton}
              />
            </>
          ) : (
            <>
              <Input
                label="Enter PIN"
                placeholder="Enter your PIN"
                value={pin}
                onChangeText={setPin}
                keyboardType="numeric"
                secureTextEntry
              />
              <Button
                title="Unlock"
                onPress={handlePINAuth}
                loading={isLoading}
                fullWidth
                style={styles.submitButton}
              />
              {renderBiometricButton()}
            </>
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Your passwords are encrypted and stored securely on your device.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  iconContainer: {
   
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.h1,
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.light.secondary,
    textAlign: 'center',
  },
  formContainer: {
    marginBottom: Spacing.xxl,
  },
  submitButton: {
    marginTop: Spacing.md,
    backgroundColor : "#2A9EFF"
  },
  biometricButton: {
    marginTop: Spacing.md,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    ...Typography.caption,
    color: Colors.light.secondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
