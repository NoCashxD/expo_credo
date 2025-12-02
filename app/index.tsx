import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, Typography } from '../constants/theme';
import PasswordManagerService from '../services/PasswordManagerService';
import AuthScreen from './auth';
import PasswordListScreen from './passwords';

export default function HomeScreen() {
  const router = useRouter();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      setIsLoading(true);
      
      // Initialize the password manager
      const initialized = await PasswordManagerService.initialize();
      setIsInitialized(initialized);

      if (initialized) {
        // Check if user is already authenticated
        const authState = PasswordManagerService.getAuthState();
        setIsAuthenticated(authState.isAuthenticated);
        
        // Set up auto-lock callback
        PasswordManagerService.setOnLockCallback(() => {
          setIsAuthenticated(false);
        });
      }
    } catch (error) {
      console.error('Error initializing app:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthenticated = () => {
    setIsAuthenticated(true);
    PasswordManagerService.setAuthenticated(true);
  };

  const handleLogout = () => {
    PasswordManagerService.lock();
    setIsAuthenticated(false);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Initializing Secure Password Manager...</Text>
      </View>
    );
  }

  if (!isInitialized) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          Failed to initialize the app. Please restart the application.
        </Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen onAuthenticated={handleAuthenticated} />;
  }

  return <PasswordListScreen navigation={{ navigate: router.push, goBack: router.back }} />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
  },
  loadingText: {
    ...Typography.body,
    color: Colors.light.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
    padding: 20,
  },
  errorText: {
    ...Typography.body,
    color: Colors.light.error,
    textAlign: 'center',
  },
});
