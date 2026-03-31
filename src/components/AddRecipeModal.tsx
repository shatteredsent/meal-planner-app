// Modal for adding a new recipe.
// Supports dynamic ingredient fields — tap "+ Add Ingredient" to add more.
import React, { useState } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform, ScrollView, Switch,
} from 'react-native';
import { NewRecipe } from '../types/recipe';

interface AddRecipeModalProps {
  isVisible: boolean;
  onConfirm: (newRecipe: Omit<NewRecipe, 'familyId' | 'createdBy'>) => Promise<void>;
  onCancel: () => void;
}

const EMPTY_INGREDIENT = '';

export default function AddRecipeModal({
  isVisible,
  onConfirm,
  onCancel,
}: AddRecipeModalProps) {
  const [recipeName, setRecipeName] = useState('');
  const [ingredients, setIngredients] = useState<string[]>(['']);
  const [isKetoFriendly, setIsKetoFriendly] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  function handleIngredientChange(text: string, index: number): void {
    const updated = [...ingredients];
    updated[index] = text;
    setIngredients(updated);
  }

  function handleAddIngredient(): void {
    setIngredients((prev) => [...prev, EMPTY_INGREDIENT]);
  }

  function handleRemoveIngredient(index: number): void {
    // Always keep at least one ingredient field
    if (ingredients.length === 1) return;
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  }

  function resetForm(): void {
    setRecipeName('');
    setIngredients(['']);
    setIsKetoFriendly(false);
  }

  async function handleConfirm(): Promise<void> {
    if (!recipeName.trim()) {
      Alert.alert('Missing name', 'Please enter a recipe name.');
      return;
    }

    const filledIngredients = ingredients.filter((i) => i.trim() !== '');
    if (filledIngredients.length === 0) {
      Alert.alert('Missing ingredients', 'Please add at least one ingredient.');
      return;
    }

    setIsLoading(true);
    try {
      await onConfirm({
        name: recipeName.trim(),
        ingredients: filledIngredients,
        isKetoFriendly,
      });
      resetForm();
    } catch {
      Alert.alert('Error', 'Could not save the recipe. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  function handleCancel(): void {
    resetForm();
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
          <Text style={styles.title}>New Recipe</Text>

          <ScrollView showsVerticalScrollIndicator={false}>
            <TextInput
              style={styles.input}
              placeholder="Recipe name"
              placeholderTextColor="#888780"
              value={recipeName}
              onChangeText={setRecipeName}
              autoCapitalize="words"
              autoFocus
            />

            <Text style={styles.sectionLabel}>Ingredients</Text>

            {ingredients.map((ingredient, index) => (
              <View key={index} style={styles.ingredientRow}>
                <TextInput
                  style={styles.ingredientInput}
                  placeholder={`Ingredient ${index + 1}`}
                  placeholderTextColor="#888780"
                  value={ingredient}
                  onChangeText={(text) => handleIngredientChange(text, index)}
                  autoCapitalize="sentences"
                />
                <TouchableOpacity
                  onPress={() => handleRemoveIngredient(index)}
                  style={styles.removeButton}
                >
                  <Text style={styles.removeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity
              style={styles.addIngredientButton}
              onPress={handleAddIngredient}
            >
              <Text style={styles.addIngredientText}>+ Add Ingredient</Text>
            </TouchableOpacity>

            <View style={styles.ketoRow}>
              <Text style={styles.ketoLabel}>Keto-friendly</Text>
              <Switch
                value={isKetoFriendly}
                onValueChange={setIsKetoFriendly}
                trackColor={{ false: '#D4D2C9', true: '#1D9E75' }}
                thumbColor="#fff"
              />
            </View>
          </ScrollView>

          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handleConfirm}
            disabled={isLoading}
          >
            {isLoading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.confirmButtonText}>Save Recipe</Text>
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
    maxHeight: '90%',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C2C2A',
    marginBottom: 16,
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
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888780',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ingredientInput: {
    flex: 1,
    borderWidth: 0.5,
    borderColor: '#B4B2A9',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: '#2C2C2A',
  },
  removeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  removeButtonText: {
    fontSize: 14,
    color: '#B4B2A9',
  },
  addIngredientButton: {
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D4D2C9',
    borderStyle: 'dashed',
    borderRadius: 10,
    marginBottom: 16,
  },
  addIngredientText: {
    fontSize: 14,
    color: '#1D9E75',
    fontWeight: '500',
  },
  ketoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    marginBottom: 16,
  },
  ketoLabel: {
    fontSize: 15,
    color: '#2C2C2A',
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