/**
 * Week tab — read the whole week and jump to any gap.
 *
 * Twenty-one slots at a glance. Tapping any row hands a focus request to the
 * Plan tab, which selects that day and opens its picker.
 */
import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { usePlannerData } from '../context/PlannerData';
import { getWeekDates, weekdayIndex, formatWeekDayLabel } from '../utils/week';
import { MealType, DAYS_OF_WEEK } from '../types/meal';
import WeekDayBlock from '../components/week/WeekDayBlock';
import PlannerSkeleton from '../components/PlannerSkeleton';
import ScreenHeader from '../components/ui/ScreenHeader';
import FlatButton from '../components/ui/FlatButton';
import { color, type, font, GUTTER, RULE } from '../theme/tokens';

const TOTAL_SLOTS = 21;

function nudgeFor(filled: number): string {
  if (filled >= 18) return 'the week is basically sorted.';
  if (filled >= 12) return 'the backbone is there.';
  return 'plenty of room left.';
}

export default function WeekScreen() {
  const navigation = useNavigation<any>();
  const { plan, requestSlotFocus } = usePlannerData();
  const { meals, isLoading, hasError, clearWeek } = plan;

  const weekDates = useMemo(() => getWeekDates(new Date()), []);
  const todayIndex = weekdayIndex(new Date());
  const filled = meals.length;

  function handleSelectSlot(dayIndex: number, mealType: MealType): void {
    requestSlotFocus({ dayIndex, mealType });
    navigation.navigate('Plan');
  }

  function handleClearWeek(): void {
    if (meals.length === 0) {
      Alert.alert('Nothing to clear', 'This week has no meals planned yet.');
      return;
    }

    Alert.alert(
      'Start the week over',
      'This removes every planned meal and the shopping list built from it. Manually added items stay.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start over',
          style: 'destructive',
          onPress: async () => {
            try {
              // Emptying the plan is enough: the reconciler drops every derived
              // line on the next snapshot, and manual items are left alone.
              await clearWeek();
            } catch {
              Alert.alert('Error', 'Could not clear the week. Please try again.');
            }
          },
        },
      ]
    );
  }

  if (isLoading) return <PlannerSkeleton />;

  if (hasError) {
    return (
      <View style={styles.centeredState}>
        <Text style={styles.errorText}>Could not load your meal plan.</Text>
        <Text style={styles.errorSubText}>Check your connection and try again.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader
        kicker="This week"
        meta={`${filled}/${TOTAL_SLOTS}`}
        title="The week"
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.summary}>
          <Text style={type.stat}>{filled}</Text>
          <Text style={styles.summaryCopy}>
            of {TOTAL_SLOTS} meals planned — {nudgeFor(filled)}
          </Text>
        </View>

        {DAYS_OF_WEEK.map((dayName, index) => (
          <WeekDayBlock
            key={dayName}
            dayName={dayName}
            label={formatWeekDayLabel(weekDates[index])}
            meals={meals.filter((m) => m.dayOfWeek === dayName)}
            isSelected={index === todayIndex}
            onSelectSlot={(mealType) => handleSelectSlot(index, mealType)}
          />
        ))}

        <View style={styles.footer}>
          <FlatButton
            block
            variant="accent"
            label="See the shopping list"
            onPress={() => navigation.navigate('List')}
          />
          <FlatButton
            block
            variant="quiet"
            label="Start the week over"
            onPress={handleClearWeek}
          />
        </View>

        {/* Recipes and Profile are outside the designed three-cell tab bar, so
            this is where they are reachable from. */}
        <View style={styles.more}>
          <Text style={styles.moreLabel}>Elsewhere</Text>
          <FlatButton
            block
            variant="outline"
            label="Recipe library"
            onPress={() => navigation.navigate('Recipes')}
          />
          <FlatButton
            block
            variant="outline"
            label="Family & settings"
            onPress={() => navigation.navigate('Profile')}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: color.bg,
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: GUTTER,
    borderBottomWidth: RULE,
    borderBottomColor: color.text,
  },
  summaryCopy: {
    flex: 1,
    fontFamily: font.regular,
    fontSize: 12,
    lineHeight: 16,
    color: color.neutral700,
  },
  footer: {
    padding: GUTTER,
    gap: 10,
  },
  more: {
    paddingHorizontal: GUTTER,
    paddingBottom: 32,
    gap: 10,
    borderTopWidth: RULE,
    borderTopColor: color.text,
    paddingTop: 18,
  },
  moreLabel: {
    ...type.label,
    letterSpacing: 1.4,
    color: color.neutral600,
  },
  centeredState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: GUTTER,
    backgroundColor: color.bg,
  },
  errorText: {
    ...type.mealNameSmall,
    marginBottom: 4,
  },
  errorSubText: type.secondary,
});
