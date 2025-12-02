import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/theme';
import PasswordManagerService from '@/services/PasswordManagerService';
import { PasswordEntry } from '@/types/PasswordTypes';
import PasswordUtils from '@/utils/PasswordUtils';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View
} from 'react-native';

interface PasswordDetailScreenProps {
  navigation: any;
  route: {
    params: {
      password: PasswordEntry;
    };
  };
}

export default function PasswordDetailScreen({}: PasswordDetailScreenProps) {
  const router = useRouter();
  const params = useLocalSearchParams();
  console.log(JSON.parse(params?.password as string),"params");
  
  const password: PasswordEntry = params?.password ? JSON.parse(params.password as string) : null;
  
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await Clipboard.setStringAsync(text);
      ToastAndroid.show('Copied to clipboard',10);
    } catch (error) {
      Alert.alert('Error', 'Failed to copy to clipboard');
    }
  };

  const handleEdit = () => {
     router.push({
      pathname: '/add-edit-password',
      params: {
        password: JSON.stringify(password),
        mode: 'edit',
      },
    });
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Password',
      'Are you sure you want to delete this password? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: async () => {
            try {
              const success = await PasswordManagerService.deletePassword(password.id);
              if (success) {
                Alert.alert('Success', 'Password deleted successfully', [
                  { text: 'OK', onPress: () => router.back() }
                ]);
              } else {
                Alert.alert('Error', 'Failed to delete password');
              }
            } catch (error) {
              console.error('Error deleting password:', error);
              Alert.alert('Error', 'Failed to delete password');
            }
          }
        },
      ]
    );
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

  const formatDate = (date: Date) => {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (<>
  
       <View style={{ display : "flex",alignItems : "center",flexDirection : "row",justifyContent : "start", marginTop : "30",backgroundColor : "white",position : "fixed",top : 0,width : "100%",padding : 6,paddingInline : 30}}>
         <Image  source={require('../assets/images/top.png')} style={{width : 40,height : 40}}/>
           <Text style={{ color: "#6c6c6c", fontSize: 18,  marginTop: 0,padding : 16,fontWeight : "800",textAlign : "center" }}>Credo Manager</Text></View>
      
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="shield-checkmark" size={32} color={Colors.light.primary} />
        </View>
        <Text style={styles.title}>{password.title}</Text>
        {password.website && (
          <Text style={styles.website}>{PasswordUtils.extractDomain(password.website)}</Text>
        )}
      </View> */}

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.label}>Username/Email</Text>
            <View style={styles.valueContainer}>
              <Text style={styles.value} numberOfLines={1}>
                {password.username}
              </Text>
              <TouchableOpacity
                onPress={() => copyToClipboard(password.username, 'Username')}
                style={styles.copyButton}
              >
                <Ionicons name="copy-outline" size={20} color={Colors.light.primary} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.valueContainer}>
              <Text style={[styles.value, styles.passwordText]} numberOfLines={1}>
                {formatPassword()}
              </Text>
              <TouchableOpacity
                onPress={togglePasswordVisibility}
                style={styles.eyeButton}
              >
                <Ionicons
                  name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={Colors.light.primary}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => copyToClipboard(password.password, 'Password')}
                style={styles.copyButton}
              >
                <Ionicons name="copy-outline" size={20} color={Colors.light.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {password.website && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Website</Text>
              <View style={styles.valueContainer}>
                <Text style={styles.value} numberOfLines={1}>
                  {password.website}
                </Text>
                <TouchableOpacity
                  onPress={() => copyToClipboard(password.website!, 'Website')}
                  style={styles.copyButton}
                >
                  <Ionicons name="copy-outline" size={20} color={Colors.light.primary} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* <View style={styles.section}>
          <Text style={styles.sectionTitle}>Password Strength</Text>
          <View style={styles.strengthContainer}>
            <View style={styles.strengthBar}>
              <View 
                style={[
                  styles.strengthFill, 
                  { 
                    backgroundColor: getPasswordStrengthColor(),
                    width: `${(getPasswordStrength() === 'weak' ? 25 : 
                              getPasswordStrength() === 'medium' ? 50 :
                              getPasswordStrength() === 'strong' ? 75 : 100)}%`
                  }
                ]} 
              />
            </View>
            <Text style={[styles.strengthText, { color: getPasswordStrengthColor() }]}>
              {getPasswordStrengthLabel()}
            </Text>
          </View>
          <Text style={styles.strengthHint}>
            {PasswordUtils.generatePasswordHint(password.password)}
          </Text>
        </View> */}

        {password.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.notes}>{password.notes}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Created</Text>
            <Text style={styles.value}>{formatDate(new Date(password.createdAt))}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Last Updated</Text>
            <Text style={styles.value}>{formatDate(new Date(password.updatedAt))}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafbfb',
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "white",
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
  website: {
    ...Typography.body,
    color: Colors.light.secondary,
    textAlign: 'center',
  },
  content: {
    marginBottom: Spacing.xl,
  },
  section: {
    backgroundColor: "white",
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.sm,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.light.text,
    marginBottom: Spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  label: {
    ...Typography.body,
    color: Colors.light.secondary,
    fontWeight: '600',
    flex: 1,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 2,
  },
  value: {
    ...Typography.body,
    color: Colors.light.text,
    flex: 1,
    marginRight: Spacing.sm,
  },
  passwordText: {
    fontFamily: 'monospace',
  },
  eyeButton: {
    padding: Spacing.sm,
    marginRight: Spacing.xs,
  },
  copyButton: {
    padding: Spacing.sm,
  },
  strengthContainer: {
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  strengthBar: {
    width: '100%',
    height: 8,
    backgroundColor: Colors.light.border,
    borderRadius: 4,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: 4,
  },
  strengthText: {
    ...Typography.body,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  strengthHint: {
    ...Typography.caption,
    color: Colors.light.secondary,
    textAlign: 'center',
  },
  notes: {
    ...Typography.body,
    color: Colors.light.text,
    lineHeight: 24,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.lg,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: Spacing.sm,
  },
});
