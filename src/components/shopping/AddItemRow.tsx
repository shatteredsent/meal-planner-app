// The manual-add composite: a borderless input and a solid accent ADD button
// inside one 2px ink border, split by a 2px rule.
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { color, type, font, GUTTER } from '../../theme/tokens';

interface AddItemRowProps {
  onAdd: (name: string) => void;
}

export default function AddItemRow({ onAdd }: AddItemRowProps) {
  const [draft, setDraft] = useState('');

  function submit(): void {
    const trimmed = draft.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setDraft('');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Add something else</Text>

      <View style={styles.composite}>
        <TextInput
          style={styles.input}
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={submit}
          placeholder="Paper towels"
          placeholderTextColor={color.neutral500}
          autoCapitalize="sentences"
          returnKeyType="done"
          accessibilityLabel="Add an item to the shopping list"
        />
        <Pressable
          onPress={submit}
          accessibilityRole="button"
          style={({ pressed }) => [styles.addButton, pressed && styles.addButtonPressed]}
        >
          <Text style={styles.addLabel}>Add</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 16,
    paddingBottom: 28,
    paddingHorizontal: GUTTER,
    gap: 10,
  },
  label: {
    ...type.label,
    letterSpacing: 1.4,
    color: color.neutral600,
  },
  composite: {
    flexDirection: 'row',
    borderWidth: 2,
    borderColor: color.text,
  },
  input: {
    flex: 1,
    minWidth: 0,
    backgroundColor: color.bg,
    paddingVertical: 13,
    paddingHorizontal: 12,
    fontFamily: font.regular,
    fontSize: 13.5,
    color: color.text,
  },
  addButton: {
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderLeftWidth: 2,
    borderLeftColor: color.text,
    backgroundColor: color.accent,
  },
  addButtonPressed: {
    backgroundColor: color.accent600,
  },
  addLabel: {
    ...type.button,
    color: color.white,
  },
});
