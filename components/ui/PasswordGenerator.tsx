import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import React, { useState } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '../../constants/theme';
import PasswordManagerService from '../../services/PasswordManagerService';
import { PasswordGeneratorOptions } from '../../types/PasswordTypes';
import PasswordUtils from '../../utils/PasswordUtils';

interface PasswordGeneratorProps {
  onPasswordGenerated?: (password: string) => void;
  initialOptions?: Partial<PasswordGeneratorOptions>;
}

export default function PasswordGenerator({
  onPasswordGenerated,
  initialOptions = {},
}: PasswordGeneratorProps) {
  const [options, setOptions] = useState<PasswordGeneratorOptions>({
    length: 16,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: true,
    ...initialOptions,
  });

  const [generatedPassword, setGeneratedPassword] = useState('');

  const generatePassword = () => {
    try {
      const password = PasswordManagerService.generatePassword(options);
      setGeneratedPassword(password);
      onPasswordGenerated?.(password);
    } catch (error) {
      console.error('Error generating password:', error);
    }
  };

  const copyPassword = async () => {
    if (generatedPassword) {
      try {
        await Clipboard.setStringAsync(generatedPassword);
        // You could add a toast notification here
      } catch (error) {
        console.error('Error copying password:', error);
      }
    }
  };

  const updateOption = <K extends keyof PasswordGeneratorOptions>(
    key: K,
    value: PasswordGeneratorOptions[K]
  ) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };

  const getPasswordStrength = () => {
    if (!generatedPassword) return null;
    return PasswordUtils.calculatePasswordStrength(generatedPassword);
  };

  const getPasswordStrengthColor = () => {
    const strength = getPasswordStrength();
    if (!strength) return Colors.light.secondary;
    return PasswordUtils.getPasswordStrengthColor(strength);
  };

  const getPasswordStrengthLabel = () => {
    const strength = getPasswordStrength();
    if (!strength) return '';
    return PasswordUtils.getPasswordStrengthLabel(strength);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {/* <Text style={styles.title}>Password Generator</Text> */}
        <TouchableOpacity
          onPress={generatePassword}
          style={styles.generateButton}
        >
          <Ionicons name="refresh" size={20} color={Colors.light.primary} />
        </TouchableOpacity>
      </View>

      {/* {generatedPassword && (
        <View style={styles.passwordContainer}>
          <View style={styles.passwordDisplay}>
            <Text style={styles.passwordText} selectable>
              {generatedPassword}
            </Text>
            <TouchableOpacity
              onPress={copyPassword}
              style={styles.copyButton}
            >
              <Ionicons name="copy-outline" size={20} color={Colors.light.primary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.strengthIndicator}>
            <View 
              style={[
                styles.strengthBar, 
                { backgroundColor: getPasswordStrengthColor() }
              ]} 
            />
            <Text style={[styles.strengthText, { color: getPasswordStrengthColor() }]}>
              {getPasswordStrengthLabel()}
            </Text>
          </View>
        </View>
      )} */}

      {/* <View style={styles.optionsContainer}>
        <View style={styles.optionRow}>
          <Text style={styles.optionLabel}>Length: {options.length}</Text>
          <View style={styles.lengthControls}>
            <TouchableOpacity
              onPress={() => updateOption('length', Math.max(4, options.length - 1))}
              style={styles.lengthButton}
            >
              <Ionicons name="remove" size={16} color={Colors.light.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => updateOption('length', Math.min(128, options.length + 1))}
              style={styles.lengthButton}
            >
              <Ionicons name="add" size={16} color={Colors.light.primary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.optionRow}>
          <Text style={styles.optionLabel}>Uppercase (A-Z)</Text>
          <Switch
            value={options.includeUppercase}
            onValueChange={(value) => updateOption('includeUppercase', value)}
            trackColor={{ false: Colors.light.border, true: Colors.light.primary }}
            thumbColor={Colors.light.surface}
          />
        </View>

        <View style={styles.optionRow}>
          <Text style={styles.optionLabel}>Lowercase (a-z)</Text>
          <Switch
            value={options.includeLowercase}
            onValueChange={(value) => updateOption('includeLowercase', value)}
            trackColor={{ false: Colors.light.border, true: Colors.light.primary }}
            thumbColor={Colors.light.surface}
          />
        </View>

        <View style={styles.optionRow}>
          <Text style={styles.optionLabel}>Numbers (0-9)</Text>
          <Switch
            value={options.includeNumbers}
            onValueChange={(value) => updateOption('includeNumbers', value)}
            trackColor={{ false: Colors.light.border, true: Colors.light.primary }}
            thumbColor={Colors.light.surface}
          />
        </View>

        <View style={styles.optionRow}>
          <Text style={styles.optionLabel}>Symbols (!@#$...)</Text>
          <Switch
            value={options.includeSymbols}
            onValueChange={(value) => updateOption('includeSymbols', value)}
            trackColor={{ false: Colors.light.border, true: Colors.light.primary }}
            thumbColor={Colors.light.surface}
          />
        </View>
      </View> */}

      {/* <TouchableOpacity
        onPress={generatePassword}
        style={styles.generateButtonLarge}
      >
        <Ionicons name="refresh" size={20} color={Colors.light.surface} />
        <Text style={styles.generateButtonText}>Generate Password</Text>
      </TouchableOpacity> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // backgroundColor: "white",
    borderRadius: BorderRadius.lg,
    paddingLeft : 5,
    // borderColor:"#e3e3e6",
    // borderWidth:1,
    marginTop : -10
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: "#9fa1ac",
  },
  generateButton: {
    marginTop: 18,
    marginRight: 15
  },
  // passwordContainer: {
  //   marginBottom: Spacing.md,
  // },
  passwordDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  passwordText: {
    ...Typography.body,
    color: Colors.light.text,
    flex: 1,
    fontFamily: 'monospace',
  },
  copyButton: {
    padding: Spacing.sm,
    marginLeft: Spacing.sm,
  },
  strengthIndicator: {
    alignItems: 'center',
  },
  strengthBar: {
    width: 100,
    height: 4,
    borderRadius: 2,
    marginBottom: Spacing.xs,
  },
  strengthText: {
    ...Typography.caption,
    fontSize: 10,
    fontWeight: '600',
  },
  optionsContainer: {
    marginBottom: Spacing.md,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  optionLabel: {
    
    color: Colors.light.text,
  },
  lengthControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lengthButton: {
    padding: Spacing.sm,
    marginHorizontal: Spacing.xs,
    backgroundColor: Colors.light.card,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  generateButtonLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  generateButtonText: {
    ...Typography.button,
    color: Colors.light.surface,
    marginLeft: Spacing.sm,
  },
});
