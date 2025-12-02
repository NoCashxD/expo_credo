import { Ionicons } from '@expo/vector-icons';
import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { BorderRadius, Colors, Spacing, Typography } from '../../constants/theme';

interface InputProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  secureTextEntry?: boolean;
  error?: string;
  disabled?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  style?: ViewStyle;
  inputStyle?: TextStyle;
  rightIcon?: string;
  onRightIconPress?: () => void;
}

// Forward ref to expose getValue
const Input = forwardRef(({
  label,
  placeholder,
  value = '',
  onChangeText,
  secureTextEntry = false,
  error,
  disabled = false,
  multiline = false,
  numberOfLines = 1,
  keyboardType = 'default',
  autoCapitalize = 'none',
  style,
  inputStyle,
  rightIcon,
  onRightIconPress,
}: InputProps, ref) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const textRef = useRef<string>(value);           // store current value
  const textInputRef = useRef<TextInput>(null);

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  // Expose getValue to parent
  useImperativeHandle(ref, () => ({
    getValue: () => textRef.current,
    focus: () => textInputRef.current?.focus(),
    clear: () => {
      textRef.current = '';
      textInputRef.current?.clear();
    },
  }));

  return (
    <View style={{  ...style }}>
      {label && (
        <Text style={{ ...Typography.body, fontWeight: '600', color: Colors.light.text, marginBottom: Spacing.sm }}>
          {label}
        </Text>
      )}

      <View style={{
        flexDirection: 'row',
        alignItems: multiline ? 'flex-start' : 'center',
        
        borderRadius: BorderRadius.md,
        // backgroundColor: disabled ? Colors.light.card : Colors.light.surface,
        paddingHorizontal: Spacing.md,
        paddingVertical: multiline ? Spacing.md : 0,
        minHeight: multiline ? 80 : 48,
      }}>
        <TextInput
          ref={textInputRef}
          style={{ ...Typography.body, flex: 1, color: Colors.light.text, paddingVertical: Spacing.md, textAlignVertical: multiline ? 'top' : 'center', ...inputStyle }}
          placeholder={placeholder}
          placeholderTextColor={Colors.light.secondary}
          defaultValue={value}                     // uncontrolled input
          onChangeText={(text) => {
            textRef.current = text;               // update ref
            onChangeText?.(text);                 // optional callback
          }}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          editable={!disabled}
          multiline={multiline}
          numberOfLines={numberOfLines}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />

        {secureTextEntry && (
          <TouchableOpacity onPress={togglePasswordVisibility} style={styles.iconButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name={isPasswordVisible ? 'eye-off' : 'eye'} size={20} color={Colors.light.secondary} />
          </TouchableOpacity>
        )}

        {rightIcon && (
          <TouchableOpacity
            onPress={onRightIconPress}
            style={styles.iconButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name={rightIcon as any} size={20} color={Colors.light.secondary} />
          </TouchableOpacity>
        )}
      </View>

      {error && <Text style={{ ...Typography.caption, color: Colors.light.error, marginTop: Spacing.xs }}>{error}</Text>}
    </View>
  );
});

const styles = StyleSheet.create({
  iconButton: {
    padding: Spacing.sm,
    marginLeft: Spacing.sm,
  },
});

export default Input;
