import React from 'react';
import {
  View,
  TextInput as RNTextInput,
  StyleSheet,
  TextInputProps as RNTextInputProps,
} from 'react-native';
import { Text, HelperText } from 'react-native-paper';

interface FormInputProps extends RNTextInputProps {
  label: string;
  error?: string;
  touched?: boolean;
  required?: boolean;
}

/**
 * 表单输入组件
 * 统一的输入框样式和错误提示
 */
export const FormInput: React.FC<FormInputProps> = React.forwardRef(
  ({ label, error, touched, required, ...props }, ref) => {
    const showError = touched && error;

    return (
      <View style={styles.container}>
        <RNTextInput
          ref={ref}
          style={[styles.input, showError && styles.inputError]}
          placeholder={required ? `${label} *` : label}
          {...props}
        />
        {showError && (
          <HelperText type="error" visible={showError}>
            {error}
          </HelperText>
        )}
      </View>
    );
  }
);

interface FormSelectProps {
  label: string;
  value: string;
  options: Array<{ label: string; value: string }>;
  onChange: (value: string) => void;
  error?: string;
  touched?: boolean;
  required?: boolean;
}

/**
 * 表单选择组件
 */
export const FormSelect: React.FC<FormSelectProps> = ({
  label,
  value,
  options,
  onChange,
  error,
  touched,
  required,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const showError = touched && error;

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {required ? `${label} *` : label}
      </Text>
      <View style={[styles.select, showError && styles.inputError]}>
        <Text onPress={() => setIsOpen(!isOpen)}>
          {selectedOption?.label || '请选择'}
        </Text>
      </View>
      {showError && (
        <HelperText type="error" visible={showError}>
          {error}
        </HelperText>
      )}
      {isOpen && (
        <View style={styles.options}>
          {options.map((option) => (
            <Text
              key={option.value}
              style={[
                styles.option,
                option.value === value && styles.optionSelected,
              ]}
              onPress={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
            >
              {option.label}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
};

interface FormSwitchProps {
  label: string;
  value: boolean;
  onToggle: () => void;
  description?: string;
}

/**
 * 表单开关组件
 */
export const FormSwitch: React.FC<FormSwitchProps> = ({
  label,
  value,
  onToggle,
  description,
}) => {
  return (
    <View style={styles.switchContainer}>
      <View style={styles.switchLabel}>
        <Text style={styles.label}>{label}</Text>
        {description && (
          <Text style={styles.description}>{description}</Text>
        )}
      </View>
      <View
        style={[styles.switch, value && styles.switchOn]}
        onTouchEnd={onToggle}
      >
        <View style={[styles.switchThumb, value && styles.switchThumbOn]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  inputError: {
    borderColor: '#FF4444',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  select: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
  },
  options: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    maxHeight: 200,
  },
  option: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  optionSelected: {
    backgroundColor: '#F0F0FF',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 8,
  },
  switchLabel: {
    flex: 1,
  },
  description: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  switch: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E0E0E0',
    padding: 2,
    justifyContent: 'center',
  },
  switchOn: {
    backgroundColor: '#6200EE',
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
  },
  switchThumbOn: {
    alignSelf: 'flex-end',
  },
});
