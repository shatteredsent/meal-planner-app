// Modal for picking a recipe when adding a meal to the planner.
// Falls back to free-text input if the family has no recipes yet.
import React, { useState } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  StyleSheet, FlatList, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { Recipe } from '../types/recipe';
import { MealType } from '../types/meal';

interface RecipePickerModalProps {
  isVisible: boolean;
  day: string;
  mealType: MealType;
  recipes: Recipe[];
  onConfirm: (recipeName: string) => Promise<void>;
  onCancel: () => void;
}

export default function RecipePickerModal({
  isVisible,
  day,
  mealType,
  recipes,
  onConfirm,
  onCancel,
}: RecipePickerModalProps) {
  const [freeTextName, setFreeTextName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const mealTypeLabel = mealType === 'lunch' ? 'Lunch' : 'Dinner';
  const hasRecipes = recipes.length > 0;

  async function handleSelectRecipe(recipeName: string): Promise<void> {
    setIsLoading(true);
    try {
      await onConfirm(recipeName);
    } catch {
      Alert.alert('Error', 'Could not add the meal. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleFreeTextConfirm(): Promise<void> {
    if (!freeTextName.trim()) {
      Alert.alert('Missing name', 'Please enter a meal name.');
      return;
    }
    setIsLoading(true);
    try {
      await onConfirm(freeTextName.trim());
      setFreeTextName('');
    } catch {
      Alert.alert('Error', 'Could not add the meal. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  function handleCancel(): void {
    setFreeTextName('');
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

          {hasRecipes ? (
            <>
              <Text style={styles.sectionLabel}>Pick a recipe</Text>
              <FlatList
                data={recipes}
                keyExtractor={(item) => item.id}
                style={styles.recipeList}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.recipeRow}
                    onPress={() => handleSelectRecipe(item.name)}
                    disabled={isLoading}
                  >
                    <View style={styles.recipeRowContent}>
                      <Text style={styles.recipeName}>{item.name}</Text>
                      {item.isKetoFriendly && (
                        <View style={styles.ketoBadge}>
                          <Text style={styles.ketoBadgeText}>Keto</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.recipeIngredientCount}>
                      {item.ingredients.length} ingredients
                    </Text>
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
              />
            </>
          ) : (
            <>
              <Text style={styles.sectionLabel}>Meal name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Grilled Chicken"
                placeholderTextColor="#888780"
                value={freeTextName}
                onChangeText={setFreeTextName}
                autoCapitalize="words"
                autoFocus
              />
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleFreeTextConfirm}
                disabled={isLoading}
              >
                {isLoading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.confirmButtonText}>Add Meal</Text>
                }
              </TouchableOpacity>
            </>
          )}

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
    maxHeight: '80%',
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
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888780',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  recipeList: {
    maxHeight: 300,
    marginBottom: 8,
  },
  recipeRow: {
    paddingVertical: 12,
  },
  recipeRowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  recipeName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#2C2C2A',
    flex: 1,
  },
  recipeIngredientCount: {
    fontSize: 12,
    color: '#888780',
  },
  ketoBadge: {
    backgroundColor: '#F0FAF5',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginLeft: 8,
    borderWidth: 0.5,
    borderColor: '#1D9E75',
  },
  ketoBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1D9E75',
  },
  separator: {
    height: 0.5,
    backgroundColor: '#E4E2D9',
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