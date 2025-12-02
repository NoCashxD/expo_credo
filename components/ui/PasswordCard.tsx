import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import React, { useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BorderRadius, Colors, Spacing, Typography } from '../../constants/theme';
import { PasswordEntry } from '../../types/PasswordTypes';
import PasswordUtils from '../../utils/PasswordUtils';

interface PasswordCardProps {
  password: PasswordEntry;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
  showPassword?: boolean;
}

export default function PasswordCard({
  password,
  onPress,
  onEdit,
  onDelete,
  showPassword = false,
}: PasswordCardProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(showPassword);

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await Clipboard.setStringAsync(text);
      // You could add a toast notification here
    } catch (error) {
      Alert.alert('Error', 'Failed to copy to clipboard');
    }
  };

  const handleCopyPassword = () => {
    copyToClipboard(password.password, 'password');
  };

  const handleCopyUsername = () => {
    copyToClipboard(password.username, 'username');
  };

  const getPasswordStrength = () => {
    return PasswordUtils.calculatePasswordStrength(password.password);
  };

  const getPasswordStrengthColor = () => {
    const strength = getPasswordStrength();
    return PasswordUtils.getPasswordStrengthColor(strength);
  };

  const getPasswordStrengthLabel = () => {
    const strength = getPasswordStrength();
    return PasswordUtils.getPasswordStrengthLabel(strength);
  };

  const formatPassword = () => {
    if (isPasswordVisible) {
      return password.password;
    }
    return PasswordUtils.maskPassword(password.password, 2);
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {password.username}
          </Text>
          {password.website && (
            <Text style={styles.website} numberOfLines={1}>
              {PasswordUtils.extractDomain(password.website)}
            </Text>
          )}
        </View>
        
        {/* <View style={styles.strengthIndicator}>
          <View 
            style={[
              styles.strengthBar, 
              { backgroundColor: getPasswordStrengthColor() }
            ]} 
          />
          <Text style={[styles.strengthText, { color: getPasswordStrengthColor() }]}>
            {getPasswordStrengthLabel()}
          </Text>
        </View> */}
      </View>
{/* 
      <View style={styles.content}>
        <View style={styles.usernameRow}>
          <Text style={styles.label}>Username:</Text>
          <Text style={styles.username} numberOfLines={1}>
            {password.username}
          </Text>
          <TouchableOpacity
            onPress={handleCopyUsername}
            style={styles.copyButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="copy-outline" size={16} color={Colors.light.secondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.passwordRow}>
          <Text style={styles.label}>Password:</Text>
          <Text style={styles.password} numberOfLines={1}>
            {formatPassword()}
          </Text>
          <TouchableOpacity
            onPress={togglePasswordVisibility}
            style={styles.eyeButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={16}
              color={Colors.light.secondary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleCopyPassword}
            style={styles.copyButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="copy-outline" size={16} color={Colors.light.secondary} />
          </TouchableOpacity>
        </View>

        {password.notes && (
          <Text style={styles.notes} numberOfLines={2}>
            {password.notes}
          </Text>
        )}
      </View> */}

      <View style={styles.actions}>
        <TouchableOpacity
          onPress={onEdit}
          style={styles.actionButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="pencil" size={20} color={Colors.light.primary} />
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => {
            Alert.alert(
              'Delete Password',
              'Are you sure you want to delete this password?',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: onDelete },
              ]
            );
          }}
          style={styles.actionButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="trash-outline" size={20} color={Colors.light.danger} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    borderRadius: BorderRadius.lg,
    padding: 5,
    paddingInline: Spacing.md,
    // marginBottom: Spacing.md,
    marginTop: Spacing.md,
    display : "flex",
    flexDirection : "row",
    justifyContent : "space-between",
    alignItems : "center",

  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width : 100,
    flexShrink : 1
  },
  titleContainer: {
    flex: 1,
    marginRight: Spacing.sm,
    padding : 10
  },
  title: {
    fontSize : 14,
    fontWeight : "600",
    color: Colors.light.text,
    marginBottom: Spacing.xs,
  },
  website: {
    ...Typography.caption,
    color: Colors.light.secondary,
  },
  strengthIndicator: {
    alignItems: 'flex-end',
  },
  strengthBar: {
    width: 60,
    height: 4,
    borderRadius: 2,
    marginBottom: Spacing.xs,
  },
  strengthText: {
    ...Typography.caption,
    fontSize: 10,
    fontWeight: '600',
  },
  content: {
    marginBottom: Spacing.md,
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  label: {
    ...Typography.caption,
    color: Colors.light.secondary,
    width: 80,
    marginRight: Spacing.sm,
  },
  username: {
    ...Typography.body,
    color: Colors.light.text,
    flex: 1,
    marginRight: Spacing.sm,
  },
  password: {
    ...Typography.body,
    color: Colors.light.text,
    flex: 1,
    marginRight: Spacing.sm,
    fontFamily: 'monospace',
  },
  eyeButton: {
    padding: Spacing.xs,
    marginRight: Spacing.xs,
  },
  copyButton: {
    padding: Spacing.xs,
  },
  notes: {
    ...Typography.caption,
    color: Colors.light.secondary,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    width : "50%"
  },
  actionButton: {
    padding: Spacing.sm,
    marginLeft: Spacing.sm,
  },
});
