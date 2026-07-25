/**
 * The seven-column day selector across the top of the Plan tab.
 *
 * Each cell shows the weekday abbreviation, the calendar date, and a 5×5 square
 * status dot: solid when all three slots are filled, faint when some are, and
 * invisible when the day is empty.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { color, type, font, RULE, HAIRLINE } from '../../theme/tokens';

export interface DayStripDay {
  /** Full day name, the value stored on a meal. */
  name: string;
  /** Day-of-month, as displayed. */
  date: string;
  /** How many of the three slots are filled, 0–3. */
  filledSlots: number;
}

interface DayStripProps {
  days: DayStripDay[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}

function dotOpacity(filledSlots: number): number {
  if (filledSlots >= 3) return 1;
  return filledSlots > 0 ? 0.4 : 0;
}

export default function DayStrip({ days, selectedIndex, onSelect }: DayStripProps) {
  return (
    <View style={styles.strip}>
      {days.map((day, index) => {
        const isSelected = index === selectedIndex;
        const ink = isSelected ? color.white : color.text;

        return (
          <Pressable
            key={day.name}
            onPress={() => onSelect(index)}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={`${day.name} ${day.date}, ${day.filledSlots} of 3 planned`}
            style={({ pressed }) => [
              styles.cell,
              index < days.length - 1 && styles.cellDivider,
              isSelected && styles.cellSelected,
              pressed && !isSelected && styles.cellPressed,
            ]}
          >
            <Text style={[styles.dow, { color: ink }]}>
              {day.name.slice(0, 3).toUpperCase()}
            </Text>
            <Text style={[styles.date, { color: ink }]}>{day.date}</Text>
            <View
              style={[
                styles.dot,
                { backgroundColor: ink, opacity: dotOpacity(day.filledSlots) },
              ]}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    flexDirection: 'row',
    borderBottomWidth: RULE,
    borderBottomColor: color.text,
  },
  cell: {
    flex: 1,
    alignItems: 'flex-start',
    gap: 4,
    paddingVertical: 10,
    paddingLeft: 8,
  },
  cellDivider: {
    borderRightWidth: HAIRLINE,
    borderRightColor: color.neutral300,
  },
  cellSelected: {
    backgroundColor: color.accent,
  },
  cellPressed: {
    backgroundColor: color.accent200,
  },
  dow: {
    ...type.meta,
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.54,
    opacity: 0.7,
  },
  date: {
    // Weight has to come from the family, not fontWeight — RN ignores
    // fontWeight on a custom font on both platforms.
    fontFamily: font.bold,
    fontSize: 15,
    lineHeight: 16,
  },
  dot: {
    width: 5,
    height: 5,
  },
});
