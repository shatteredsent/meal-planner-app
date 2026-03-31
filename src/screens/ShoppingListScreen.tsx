// Shopping list screen — shows items grouped by grocery category.
// Supports auto-generating from the meal plan and manual item addition.
import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, SafeAreaView,
  Alert, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { useShoppingList } from '../hooks/useShoppingList';
import { useMealPlan } from '../hooks/useMealPlan';
import { useRecipes } from '../hooks/useRecipes';
import { GROCERY_CATEGORIES } from '../types/shoppingItem';
import ShoppingCategorySection from '../components/ShoppingCategorySection';
import Header from '../components/Header';
import ShoppingListSkeleton from '../components/ShoppingListSkeleton';
import EmptyState from '../components/EmptyState';
import SendToAlexaModal from '../components/SendToAlexaModal';
import { Ionicons } from '@expo/vector-icons';

export default function ShoppingListScreen() {
  const { user } = useAuth();
  const familyId = user?.uid ?? '';

  const { items, isLoading, hasError, addItem, toggleItem, deleteItem,
    clearCheckedItems, generateFromMealPlan } = useShoppingList(familyId);
  const { meals } = useMealPlan(familyId);
  const { recipes } = useRecipes(familyId);

  const [isAlexaModalVisible, setIsAlexaModalVisible] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const checkedCount = items.filter((i) => i.isChecked).length;

  async function handleAddItem(): Promise<void> {
    if (!newItemName.trim()) return;
    try {
      await addItem(newItemName.trim());
      setNewItemName('');
    } catch {
      Alert.alert('Error', 'Could not add the item. Please try again.');
    }
  }

  async function handleGenerateFromMealPlan(): Promise<void> {
    setIsGenerating(true);
    try {
      await generateFromMealPlan(meals, recipes);
    } catch {
      Alert.alert('Error', 'Could not generate the shopping list. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleClearChecked(): Promise<void> {
    if (checkedCount === 0) return;
    Alert.alert(
      'Clear checked items',
      `Remove ${checkedCount} checked item${checkedCount > 1 ? 's' : ''}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearCheckedItems();
            } catch {
              Alert.alert('Error', 'Could not clear items. Please try again.');
            }
          },
        },
      ]
    );
  }

  if (isLoading) {
    return <ShoppingListSkeleton />;
  }

  if (hasError) {
    return (
      <View style={styles.centeredState}>
        <Text style={styles.errorText}>Could not load your shopping list.</Text>
        <Text style={styles.errorSubText}>Check your connection and try again.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Shopping List"
        rightLabel={checkedCount > 0 ? `Clear ${checkedCount} checked` : undefined}
        rightColor="#FF4444"
        onRightPress={handleClearChecked}
      />
      {items.length > 0 && (
        <TouchableOpacity
          style={styles.alexaButton}
          onPress={() => setIsAlexaModalVisible(true)}
        >
          <Ionicons name="send" size={14} color="#1D9E75" style={{ marginRight: 6 }} />
          <Text style={styles.alexaButtonText}>Sync with Alexa</Text>
        </TouchableOpacity>
      )}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Generate from meal plan button */}
          <TouchableOpacity
            style={styles.generateButton}
            onPress={handleGenerateFromMealPlan}
            disabled={isGenerating}
          >
            {isGenerating
              ? <ActivityIndicator color="#1D9E75" size="small" />
              : <Text style={styles.generateButtonText}>
                  ✦ Generate from this week's meals
                </Text>
            }
          </TouchableOpacity>

          {/* Manual add input */}
          <View style={styles.addRow}>
            <TextInput
              style={styles.addInput}
              placeholder="Add an item manually..."
              placeholderTextColor="#888780"
              value={newItemName}
              onChangeText={setNewItemName}
              autoCapitalize="sentences"
              returnKeyType="done"
              onSubmitEditing={handleAddItem}
            />
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddItem}
            >
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>

          {items.length === 0 && (
            <EmptyState
              icon="cart-outline"
              title="Your list is empty"
              subtitle="Tap 'Generate' to build your list from this week's meals, or add items manually."
            />
          )}

          {GROCERY_CATEGORIES.map((category) => (
            <ShoppingCategorySection
              key={category}
              category={category}
              items={items.filter((item) => item.category === category)}
              onToggle={toggleItem}
              onDelete={deleteItem}
            />
          ))}
        </ScrollView>
      </KeyboardAvoidingView>
      <SendToAlexaModal 
        isVisible={isAlexaModalVisible}
        items={items}
        onClose={() => setIsAlexaModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F6F2',
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  generateButton: {
    backgroundColor: '#F0FAF5',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: '#1D9E75',
  },
  generateButtonText: {
    fontSize: 14,
    color: '#1D9E75',
    fontWeight: '600',
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  addInput: {
    flex: 1,
    borderWidth: 0.5,
    borderColor: '#B4B2A9',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: '#2C2C2A',
    backgroundColor: '#fff',
  },
  addButton: {
    backgroundColor: '#1D9E75',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  centeredState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F6F2',
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2C2A',
    marginBottom: 4,
  },
  errorSubText: {
    fontSize: 14,
    color: '#888780',
  },
  alexaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FAF5',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E4E2D9',
    paddingVertical: 10,
  },
  alexaButtonText: {
    fontSize: 14,
    color: '#1D9E75',
    fontWeight: '600',
  },
});