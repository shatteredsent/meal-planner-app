/**
 * Full-screen form for adding a recipe.
 *
 * Ingredients are typed as free text — "2 lb chicken thighs" — and parsed into
 * amount / unit / name / aisle on save. Typing a quantity is faster than filling
 * three fields per line, and `parseIngredientText` already has to handle exactly
 * this shape for the legacy library.
 */
import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { NewRecipe, parseIngredientText } from '../types/recipe';
import { MealType, MEAL_TYPES, MEAL_TYPE_LABELS } from '../types/meal';
import { categorizeIngredient } from '../utils/categorize';
import Overlay from './ui/Overlay';
import ScreenHeader from './ui/ScreenHeader';
import GroupHeader from './ui/GroupHeader';
import FlatButton from './ui/FlatButton';
import { color, type, font, GUTTER, RULE, HAIRLINE } from '../theme/tokens';
import { notify } from '../utils/dialog';

type RecipeDraft = Omit<NewRecipe, 'familyId' | 'createdBy'>;

interface AddRecipeModalProps {
  isVisible: boolean;
  onConfirm: (newRecipe: RecipeDraft) => Promise<void>;
  onCancel: () => void;
}

export default function AddRecipeModal({
  isVisible,
  onConfirm,
  onCancel,
}: AddRecipeModalProps) {
  const [name, setName] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [mealType, setMealType] = useState<MealType>('dinner');
  const [prepTime, setPrepTime] = useState('');
  const [servings, setServings] = useState('4');
  const [ingredients, setIngredients] = useState<string[]>(['']);
  const [steps, setSteps] = useState<string[]>(['']);
  const [isSaving, setIsSaving] = useState(false);

  function updateAt(
    list: string[],
    setList: (next: string[]) => void,
    index: number,
    text: string
  ): void {
    const next = [...list];
    next[index] = text;
    setList(next);
  }

  function removeAt(
    list: string[],
    setList: (next: string[]) => void,
    index: number
  ): void {
    // Always keep one field so the form never collapses to nothing.
    if (list.length === 1) {
      setList(['']);
      return;
    }
    setList(list.filter((_, i) => i !== index));
  }

  function resetForm(): void {
    setName('');
    setSubtitle('');
    setMealType('dinner');
    setPrepTime('');
    setServings('4');
    setIngredients(['']);
    setSteps(['']);
  }

  async function handleConfirm(): Promise<void> {
    if (!name.trim()) {
      notify('Missing name', 'Please enter a recipe name.');
      return;
    }

    const filledIngredients = ingredients.filter((i) => i.trim() !== '');
    if (filledIngredients.length === 0) {
      notify('Missing ingredients', 'Please add at least one ingredient.');
      return;
    }

    const parsedServings = Number(servings);

    setIsSaving(true);
    try {
      await onConfirm({
        name: name.trim(),
        subtitle: subtitle.trim(),
        mealType,
        prepTime: prepTime.trim(),
        servings:
          Number.isFinite(parsedServings) && parsedServings > 0 ? parsedServings : 4,
        ingredients: filledIngredients.map((raw) => {
          const parsed = parseIngredientText(raw);
          return { ...parsed, category: categorizeIngredient(parsed.name) };
        }),
        steps: steps.map((s) => s.trim()).filter(Boolean),
        isKetoFriendly: false,
      });
      resetForm();
    } catch {
      notify('Error', 'Could not save the recipe. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  function handleCancel(): void {
    resetForm();
    onCancel();
  }

  return (
    <Overlay visible={isVisible} onRequestClose={handleCancel}>
      <ScreenHeader
        titleStyle="overlay"
        kicker="Recipe library"
        title="New recipe"
        action={{ label: 'Cancel', onPress: handleCancel }}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.fields}>
            <Field label="Name" value={name} onChangeText={setName} placeholder="Sheet-Pan Chicken & Roots" />
            <Field
              label="One-line description"
              value={subtitle}
              onChangeText={setSubtitle}
              placeholder="One pan, one rack, no fuss."
            />

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Meal</Text>
              <View style={styles.segmented}>
                {MEAL_TYPES.map((option, index) => {
                  const isActive = mealType === option;
                  return (
                    <Pressable
                      key={option}
                      onPress={() => setMealType(option)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isActive }}
                      style={({ pressed }) => [
                        styles.segment,
                        index < MEAL_TYPES.length - 1 && styles.segmentDivider,
                        isActive && styles.segmentActive,
                        pressed && !isActive && styles.segmentPressed,
                      ]}
                    >
                      <Text
                        style={[styles.segmentLabel, isActive && styles.segmentLabelActive]}
                      >
                        {MEAL_TYPE_LABELS[option]}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.pair}>
              <View style={styles.pairCell}>
                <Field label="Time" value={prepTime} onChangeText={setPrepTime} placeholder="50 min" />
              </View>
              <View style={styles.pairCell}>
                <Field
                  label="Feeds"
                  value={servings}
                  onChangeText={setServings}
                  placeholder="4"
                  keyboardType="number-pad"
                />
              </View>
            </View>
          </View>

          <GroupHeader label="Ingredients" meta="one per line" ruleAbove />
          {ingredients.map((ingredient, index) => (
            <ListField
              key={index}
              value={ingredient}
              placeholder={index === 0 ? '2 lb chicken thighs' : 'Another ingredient'}
              onChangeText={(text) => updateAt(ingredients, setIngredients, index, text)}
              onRemove={() => removeAt(ingredients, setIngredients, index)}
            />
          ))}
          <AddLineButton
            label="Add ingredient"
            onPress={() => setIngredients((prev) => [...prev, ''])}
          />

          <GroupHeader label="Method" meta="optional" ruleAbove />
          {steps.map((step, index) => (
            <ListField
              key={index}
              value={step}
              multiline
              prefix={String(index + 1)}
              placeholder="Heat the oven to 425°F."
              onChangeText={(text) => updateAt(steps, setSteps, index, text)}
              onRemove={() => removeAt(steps, setSteps, index)}
            />
          ))}
          <AddLineButton label="Add step" onPress={() => setSteps((prev) => [...prev, ''])} />

          <View style={styles.footer}>
            <FlatButton
              block
              variant="accent"
              disabled={isSaving}
              onPress={handleConfirm}
              label={isSaving ? 'Saving…' : 'Save recipe'}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Overlay>
  );
}

// ── Form pieces ───────────────────────────────────────────────────

interface FieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'number-pad';
}

function Field({ label, value, onChangeText, placeholder, keyboardType }: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={color.neutral500}
        keyboardType={keyboardType ?? 'default'}
        accessibilityLabel={label}
      />
    </View>
  );
}

interface ListFieldProps {
  value: string;
  placeholder: string;
  onChangeText: (text: string) => void;
  onRemove: () => void;
  multiline?: boolean;
  prefix?: string;
}

function ListField({
  value,
  placeholder,
  onChangeText,
  onRemove,
  multiline,
  prefix,
}: ListFieldProps) {
  return (
    <View style={styles.listRow}>
      {!!prefix && <Text style={styles.listPrefix}>{prefix}</Text>}
      <TextInput
        style={[styles.listInput, multiline && styles.listInputMultiline]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={color.neutral500}
        multiline={multiline}
      />
      <Pressable
        onPress={onRemove}
        accessibilityRole="button"
        accessibilityLabel="Remove this line"
        style={({ pressed }) => [styles.removeButton, pressed && styles.removePressed]}
      >
        <Text style={styles.removeLabel}>✕</Text>
      </Pressable>
    </View>
  );
}

function AddLineButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.addLine, pressed && styles.addLinePressed]}
    >
      <Text style={styles.addLinePlus}>+</Text>
      <Text style={styles.addLineLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  fields: {
    padding: GUTTER,
    gap: 14,
  },
  field: {
    gap: 6,
  },
  fieldLabel: {
    ...type.label,
    letterSpacing: 1.4,
    color: color.neutral600,
  },
  input: {
    borderWidth: 2,
    borderColor: color.text,
    paddingVertical: 12,
    paddingHorizontal: 12,
    fontFamily: font.regular,
    fontSize: 13.5,
    color: color.text,
    backgroundColor: color.bg,
  },
  pair: {
    flexDirection: 'row',
    gap: 12,
  },
  pairCell: {
    flex: 1,
  },
  segmented: {
    flexDirection: 'row',
    borderWidth: 2,
    borderColor: color.text,
  },
  segment: {
    flex: 1,
    paddingVertical: 11,
    paddingHorizontal: 10,
  },
  segmentDivider: {
    borderRightWidth: 2,
    borderRightColor: color.text,
  },
  segmentActive: {
    backgroundColor: color.accent,
  },
  segmentPressed: {
    backgroundColor: color.accent100,
  },
  segmentLabel: {
    ...type.button,
    color: color.neutral700,
  },
  segmentLabelActive: {
    color: color.white,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: GUTTER,
    borderBottomWidth: HAIRLINE,
    borderBottomColor: color.neutral300,
  },
  listPrefix: {
    fontFamily: font.extrabold,
    fontSize: 15,
    lineHeight: 40,
    color: color.accent,
    width: 18,
  },
  listInput: {
    flex: 1,
    borderWidth: HAIRLINE,
    borderColor: color.neutral400,
    paddingVertical: 10,
    paddingHorizontal: 10,
    fontFamily: font.regular,
    fontSize: 13.5,
    color: color.text,
    backgroundColor: color.bg,
  },
  listInputMultiline: {
    minHeight: 68,
    textAlignVertical: 'top',
  },
  removeButton: {
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  removePressed: {
    backgroundColor: color.neutral200,
  },
  removeLabel: {
    ...type.meta,
    fontSize: 13,
    color: color.neutral500,
  },
  addLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 14,
    marginHorizontal: GUTTER,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: color.neutral400,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  addLinePressed: {
    borderColor: color.accent,
    backgroundColor: color.accent100,
  },
  addLinePlus: {
    fontFamily: font.extrabold,
    fontSize: 18,
    lineHeight: 20,
    color: color.accent,
  },
  addLineLabel: {
    ...type.button,
    color: color.neutral700,
  },
  footer: {
    padding: GUTTER,
    paddingTop: 4,
    paddingBottom: 40,
    borderTopWidth: RULE,
    borderTopColor: color.text,
    marginTop: 4,
  },
});
