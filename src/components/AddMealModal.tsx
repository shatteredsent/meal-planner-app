// Modal that appears when the user taps "+ Add" on a meal slot.
// For Sprint 2, the user types a meal name manually.
// In Sprint 3 this will be replaced with a recipe picker.
import React, { useState } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { MealType } from '../types/meal';

interface AddMealModalProps {
  isVisible: boolean;
  day: string;
  mealType: MealType;
  onConfirm: (recipeName: string) => Promise<void>;
  onCancel: () => void;
}

export default function AddMealModal({
  isVisible,
  day,
  mealType,
  onConfirm,
  onCancel,
}: AddMealModalProps) {
  const [recipeName, setRecipeName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const mealTypeLabel = mealType === 'lunch' ? 'Lunch' : 'Dinner';

  async function handleConfirm(): Promise<void> {
    if (!recipeName.trim()) {
      Alert.alert('Missing name', 'Please enter a meal name.');
      return;
    }

    setIsLoading(true);
    try {
      await onConfirm(recipeName.trim());
      setRecipeName('');
    } catch {
      Alert.alert('Error', 'Could not save the meal. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  function handleCancel(): void {
    setRecipeName('');
    onCancel();
  }

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={handleCancel}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.sheet}>
          <Text style={styles.title}>Add {mealTypeLabel}</Text>
          <Text style={styles.subtitle}>{day}</Text>

          <TextInput
            style={styles.input}
            placeholder="Meal name e.g. Grilled Chicken"
            placeholderTextColor="#888780"
            value={recipeName}
            onChangeText={setRecipeName}
            autoCapitalize="words"
            autoFocus
          />

          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handleConfirm}
            disabled={isLoading}
          >
            {isLoading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.confirmButtonText}>Add Meal</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C2C2A',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#888780',
    marginBottom: 20,
  },
  input: {
    borderWidth: 0.5,
    borderColor: '#B4B2A9',
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: '#2C2C2A',
    marginBottom: 16,
  },
  confirmButton: {
    backgroundColor: '#1D9E75',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  cancelButton: {
    padding: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#888780',
    fontSize: 15,
  },
});