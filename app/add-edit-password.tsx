import Input from '@/components/ui/Input';
import PasswordGenerator from '@/components/ui/PasswordGenerator';
import { Colors, Spacing, Typography } from '@/constants/theme';
import PasswordManagerService from '@/services/PasswordManagerService';
import { PasswordEntry, PasswordFormData } from '@/types/PasswordTypes';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import PasswordUtils from '../utils/PasswordUtils';

interface AddEditPasswordScreenProps {
  navigation: any;
  route: {
    params: {
      mode: 'add' | 'edit';
      password?: PasswordEntry;
    };
  };
}

export default function AddEditPasswordScreen({  }: AddEditPasswordScreenProps) {
  const params = useLocalSearchParams();
  const { mode = 'add' } = params || {};
  const password: PasswordEntry | undefined = params.password ? JSON.parse(params.password as string) : undefined;
  console.log(params,"params");
  
  const isEdit = mode === 'edit';
  const router = useRouter();
  const [formData, setFormData] = useState<PasswordFormData>({
    title: '',
    username: '',
    password: '',
    website: '',
    notes: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [PassStrength, setPassStrength] = useState("");
  const [errors, setErrors] = useState<Partial<PasswordFormData>>({});
useEffect(()=>{
  console.log(router);
},[router])
  useEffect(() => {
    if (isEdit && password) {
      setFormData({
        title: password.title,
        username: password.username,
        password: password.password,
        website: password.website || '',
        notes: password.notes || '',
      });
    }
  }, [isEdit]);

  const validateForm = (): boolean => {
    const newErrors: Partial<PasswordFormData> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    }

    if (formData.website && !isValidUrl(formData.website)) {
      newErrors.website = 'Please enter a valid URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url.startsWith('http') ? url : `https://${url}`);
      return true;
    } catch {
      return false;
    }
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);

      if (isEdit && password) {
        const success = await PasswordManagerService.updatePassword(password.id, formData);
        if (success) {
          Alert.alert('Success', 'Password updated successfully', [
            { text: 'OK', onPress: () => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.navigate('./passwords');
              }
            }}
          ]);
        } else {
          Alert.alert('Error', 'Failed to update password');
        }
      } else {
        const success = await PasswordManagerService.addPassword(formData);
        if (success) {
          Alert.alert('Success', 'Password added successfully', [
            { text: 'OK', onPress: () => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.navigate('./passwords');
              }
            }}
          ]);
        } else {
          Alert.alert('Error', 'Failed to add password');
        }
      }
    } catch (error) {
      console.error('Error saving password:', error);
      Alert.alert('Error', 'Failed to save password');
    } finally {
      setIsLoading(false);
    }
  };
  const getPasswordStrength = () => {
      if (!formData.password) return null;
      return PasswordUtils.calculatePasswordStrength(formData.password);
    };
  
    const getPasswordStrengthColor = () => {
      const strength = getPasswordStrength();
      if (!strength) return Colors.light.secondary;
      return PasswordUtils.getPasswordStrengthColor(strength);
    };
  const handlePasswordGenerated = (generatedPassword: string) => {
    setFormData((prev: PasswordFormData) => ({ ...prev, password: generatedPassword }));
  };

  const updateField = (field: keyof PasswordFormData, value: string) => {
    setFormData((prev: PasswordFormData) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev: Partial<PasswordFormData>) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
          <View style={{ display : "flex",alignItems : "center",flexDirection : "row",justifyContent : "start", marginTop : "30",backgroundColor : "white",position : "fixed",top : 0,width : "100%",padding : 6,paddingInline : 30}}>
      <Image  source={require('../assets/images/top.png')} style={{width : 40,height : 40}}/>
        <Text style={{ color: "#6c6c6c", fontSize: 18,  marginTop: 0,padding : 16,fontWeight : "800",textAlign : "center" }}>Credo Manager</Text></View>
     
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.form}>
          <View style={{backgroundColor : "white",padding : 10,paddingInline :0,borderRadius : 10,marginBottom : 2}}>
            <Text style={{fontSize : 14 , marginLeft : 17,fontWeight : "bold",color : "#767676ff"}}>Title</Text>
          <Input
            placeholder="e.g., Gmail, Facebook, Bank Account"
            value={formData.title}
            onChangeText={(value: string) => updateField('title', value)}
            error={errors.title}
            style={{borderColor :"white !important",backgroundColor : "transparent",marginTop :-10}}
          />
          </View>
<View style={{backgroundColor : "white",padding : 10,paddingInline :0,borderRadius : 10,marginBottom : 2}}>
            <Text style={{fontSize : 14 , marginLeft : 20,fontWeight : "bold",color : "#767676ff"}}>Username/Email</Text>
          <Input
            placeholder="Enter username or email"
            value={formData.username}
            onChangeText={(value: string) => updateField('username', value)}
            keyboardType="email-address"
            autoCapitalize="none"
            style={{borderColor :"white !important",backgroundColor : "transparent",marginTop :-10}}
            error={errors.username}
          />
          </View>
<View style={{backgroundColor : "white",padding : 10,paddingInline :0 ,borderRadius : 10,marginBottom : 2}}>
         
          <Text style={{fontSize : 14,fontWeight : "bold",marginLeft : 20,color : "#767676ff"}}>Password<Text style={{color : getPasswordStrengthColor(),marginLeft : 10,textTransform : "capitalize",fontWeight : "500"}}> {getPasswordStrength() ? `(${getPasswordStrength()})` : ""}</Text></Text>
         <View style={{display : "flex",flexDirection : "row",justifyContent : "center"}}>  
          <Input
            placeholder="Enter password"
            value={formData.password}
            onChangeText={(value: string) => updateField('password', value)}
            secureTextEntry
            error={errors.password}
            style={{width : "90%",marginRight : -8,backgroundColor : "transparent",marginTop :-9}}
          />
            <PasswordGenerator onPasswordGenerated={handlePasswordGenerated}/>
          </View>   
          </View>
<View style={{backgroundColor : "white",padding : 10,paddingInline :0,borderRadius : 10,marginBottom : 2}}>
            <Text style={{fontSize : 14 , marginLeft : 20,fontWeight : "bold",color : "#767676ff"}}>Website</Text>
          <Input
            placeholder="https://example.com"
            value={formData.website || ""}
            onChangeText={(value: string) => updateField('website', value)}
            keyboardType="default"
            autoCapitalize="none"
            error={errors.website}
            style={{borderColor :"white !important",backgroundColor : "transparent",marginTop :-10}}
          />
          </View>
<View style={{backgroundColor : "white",padding : 10, paddingInline :0,borderRadius : 10,marginBottom : 2}}>
            <Text style={{fontSize : 14 , marginLeft : 20,fontWeight : "bold",color : "#767676ff"}}>Notes</Text>
          <Input
            placeholder="Additional notes (optional)"
            value={formData.notes || ""}
            onChangeText={(value: string) => updateField('notes', value)}
            multiline
            numberOfLines={3}
            style={{borderColor :"white !important",backgroundColor : "transparent",marginTop :-30}}
          />
        </View>
        </View>

      

        <View style={styles.actions}>
          <TouchableOpacity
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.navigate('./passwords');
              }
            }}
            style={styles.cancelButton}
          >
            <Text style={{fontSize : 14,textAlign :"center"}}>Cancel</Text>

            </TouchableOpacity>
          <TouchableOpacity onPress={handleSave}
            style={styles.saveButton}>
           <Text style={{fontSize : 14,textAlign :"center",color : "white"}}>
          {isEdit ? 'Update Password' : 'Save Password'}
           </Text>
            
            
            </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f4f4ff",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  title: {
    ...Typography.h1,
    color: Colors.light.text,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.light.secondary,
  },
  form: {
    marginBottom: Spacing.xl,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -Spacing.md,
  },
  cancelButton: {
    flex: 1,
    padding : 10,
    backgroundColor : "#D9E2FF",
    marginRight: Spacing.sm,
    borderRadius : 10
  },
  saveButton: {
    flex: 1,
    marginLeft: Spacing.sm,
    padding : 10,
    backgroundColor : "#008AFF",
    borderRadius : 10
  },
});
