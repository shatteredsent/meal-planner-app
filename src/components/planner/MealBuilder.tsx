/**
 * "Build your own" — four independent groups of options, then the composed
 * result and the save button.
 *
 * Every pick is optional and tapping a selected option deselects it; the meal
 * becomes saveable as soon as a protein *or* a vegetable is chosen.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import {
  PART_GROUPS, PART_GROUP_KEYS, PartGroupKey, PartSelection, describeSelection,
} from '../../data/builderParts';
import { formatQuantity } from '../../utils/quantity';
import FlatButton from '../ui/FlatButton';
import { color, type, font, GUTTER, RULE, HAIRLINE } from '../../theme/tokens';

interface MealBuilderProps {
  selection: PartSelection;
  onToggleOption: (group: PartGroupKey, optionId: string) => void;
  /** Slot label used in the save button, e.g. 'dinner'. */
  slotLabel: string;
  onSave: () => void;
}

export default function MealBuilder({
  selection,
  onToggleOption,
  slotLabel,
  onSave,
}: MealBuilderProps) {
  const { name, subtitle, isReady } = describeSelection(selection);

  return (
    <View>
      <View style={styles.intro}>
        <Text style={type.secondarySmall}>
          Pick a protein, a vegetable, something to serve it on, and how to season
          it. Skip anything you don't need.
        </Text>
      </View>

      {PART_GROUP_KEYS.map((key) => {
        const group = PART_GROUPS[key];
        const selectedId = selection[key];

        return (
          <View key={key} style={styles.group}>
            <View style={styles.groupHeader}>
              <Text style={styles.groupLabel}>{group.label}</Text>
              <Text style={styles.groupMeta}>{selectedId ? 'chosen' : 'optional'}</Text>
            </View>

            <View style={styles.grid}>
              {group.options.map((option, index) => {
                const isSelected = selectedId === option.id;
                const meta = option.ingredients
                  .map((i) => formatQuantity(i))
                  .filter(Boolean)
                  .join(' · ');

                return (
                  <Pressable
                    key={option.id}
                    onPress={() => onToggleOption(key, option.id)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    style={({ pressed }) => [
                      styles.option,
                      // Hairline only on the left column so the grid's outer
                      // edge stays clean.
                      index % 2 === 0 && styles.optionRightRule,
                      isSelected && styles.optionSelected,
                      pressed && !isSelected && styles.optionPressed,
                    ]}
                  >
                    <Text
                      style={[styles.optionLabel, isSelected && styles.optionTextSelected]}
                    >
                      {option.label}
                    </Text>
                    <Text
                      style={[styles.optionMeta, isSelected && styles.optionTextSelected]}
                    >
                      {meta}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        );
      })}

      <View style={styles.result}>
        <View style={styles.resultText}>
          <Text style={styles.resultKicker}>Your meal</Text>
          <Text style={type.buildName}>{name}</Text>
          <Text style={type.secondarySmall}>{subtitle}</Text>
        </View>

        <FlatButton
          block
          variant="accent"
          disabled={!isReady}
          onPress={onSave}
          label={isReady ? `Add to ${slotLabel}` : 'Choose at least one part'}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  intro: {
    paddingVertical: 14,
    paddingHorizontal: GUTTER,
    backgroundColor: color.neutral200,
    borderBottomWidth: RULE,
    borderBottomColor: color.text,
  },
  group: {
    borderBottomWidth: RULE,
    borderBottomColor: color.text,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingVertical: 11,
    paddingHorizontal: GUTTER,
    borderBottomWidth: HAIRLINE,
    borderBottomColor: color.neutral300,
  },
  groupLabel: {
    ...type.label,
    fontWeight: '700',
    color: color.text,
  },
  groupMeta: {
    ...type.meta,
    color: color.neutral600,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  option: {
    width: '50%',
    alignItems: 'flex-start',
    gap: 4,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: HAIRLINE,
    borderBottomColor: color.neutral300,
  },
  optionRightRule: {
    borderRightWidth: HAIRLINE,
    borderRightColor: color.neutral300,
  },
  optionSelected: {
    backgroundColor: color.accent,
  },
  optionPressed: {
    backgroundColor: color.accent100,
  },
  optionLabel: {
    fontFamily: font.semibold,
    fontSize: 13,
    lineHeight: 16,
    color: color.text,
  },
  optionMeta: {
    ...type.meta,
    color: color.neutral600,
    opacity: 0.7,
  },
  optionTextSelected: {
    color: color.white,
    opacity: 1,
  },
  result: {
    paddingTop: 18,
    paddingBottom: 30,
    paddingHorizontal: GUTTER,
    gap: 12,
  },
  resultText: {
    gap: 4,
  },
  resultKicker: {
    ...type.label,
    letterSpacing: 1.4,
    color: color.neutral600,
  },
});
