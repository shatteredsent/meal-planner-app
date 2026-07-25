/**
 * Full-screen recipe detail: photo, time/feeds pair, intro, ingredients, method.
 *
 * The footer's two actions depend on context — "put this on <day> <slot>" only
 * appears when the sheet was opened from a slot that doesn't already hold this
 * recipe, and "swap the parts around" hands off to the builder.
 */
import React from 'react';
import { View, Text, Image, ScrollView, StyleSheet } from 'react-native';
import { Recipe } from '../../types/recipe';
import { MealType, MEAL_TYPE_LABELS } from '../../types/meal';
import { formatQuantity } from '../../utils/quantity';
import Overlay from '../ui/Overlay';
import ScreenHeader from '../ui/ScreenHeader';
import GroupHeader from '../ui/GroupHeader';
import FlatButton from '../ui/FlatButton';
import { color, type, font, GUTTER, RULE, HAIRLINE } from '../../theme/tokens';

interface RecipeDetailSheetProps {
  recipe: Recipe | null;
  /** The slot it was opened from, if any — drives the "put this on" action. */
  target: { dayOfWeek: string; mealType: MealType } | null;
  /** True when this recipe already occupies `target`. */
  alreadyPlanned: boolean;
  onAddToSlot: () => void;
  onSwapParts: () => void;
  /**
   * Overrides the second footer action's label. The library reuses that slot for
   * "Delete recipe", where swapping parts has no target to swap into.
   */
  swapPartsLabel?: string;
  onClose: () => void;
}

export default function RecipeDetailSheet({
  recipe,
  target,
  alreadyPlanned,
  onAddToSlot,
  onSwapParts,
  swapPartsLabel = 'Swap the parts around',
  onClose,
}: RecipeDetailSheetProps) {
  if (!recipe) {
    return <Overlay visible={false} onRequestClose={onClose}>{null}</Overlay>;
  }

  const canAdd = !!target && !alreadyPlanned;

  return (
    <Overlay visible onRequestClose={onClose}>
      <ScreenHeader
        titleStyle="recipe"
        kicker={`${MEAL_TYPE_LABELS[recipe.mealType]} · recipe`}
        title={recipe.name}
        action={{ label: 'Back', onPress: onClose }}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* The design requires grayscale imagery; recipes without a photo get
            the striped placeholder from the prototype. */}
        <View style={styles.photo}>
          {recipe.photoUrl ? (
            <Image
              source={{ uri: recipe.photoUrl }}
              style={styles.photoImage}
              resizeMode="cover"
              accessibilityIgnoresInvertColors
            />
          ) : (
            <>
              <View style={styles.stripes}>
                {Array.from({ length: 40 }, (_, i) => (
                  <View key={i} style={styles.stripe} />
                ))}
              </View>
              <Text style={styles.photoCaption}>finished dish photo · b&amp;w</Text>
            </>
          )}
        </View>

        <View style={styles.statPair}>
          <View style={[styles.statCell, styles.statCellDivider]}>
            <Text style={styles.statLabel}>Time</Text>
            <Text style={styles.statValue}>{recipe.prepTime || '—'}</Text>
          </View>
          <View style={styles.statCell}>
            <Text style={styles.statLabel}>Feeds</Text>
            <Text style={styles.statValue}>{recipe.servings} people</Text>
          </View>
        </View>

        {!!recipe.subtitle && (
          <View style={styles.intro}>
            <Text style={type.body}>{recipe.subtitle}</Text>
          </View>
        )}

        <View>
          <GroupHeader label="Ingredients" />
          {recipe.ingredients.map((ingredient, index) => (
            <View key={`${ingredient.name}-${index}`} style={styles.ingredientRow}>
              <Text style={styles.ingredientQty}>{formatQuantity(ingredient)}</Text>
              <Text style={styles.ingredientName}>{ingredient.name}</Text>
            </View>
          ))}
        </View>

        {recipe.steps.length > 0 && (
          <View>
            <GroupHeader label="Method" />
            {recipe.steps.map((step, index) => (
              <View key={index} style={styles.stepRow}>
                <Text style={styles.stepNumber}>{index + 1}</Text>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.footer}>
          {canAdd && (
            <FlatButton
              block
              variant="accent"
              onPress={onAddToSlot}
              label={`Put this on ${target!.dayOfWeek.slice(0, 3)} ${MEAL_TYPE_LABELS[
                target!.mealType
              ].toLowerCase()}`}
            />
          )}
          <FlatButton
            block
            variant="outline"
            onPress={onSwapParts}
            label={swapPartsLabel}
          />
        </View>
      </ScrollView>
    </Overlay>
  );
}

const styles = StyleSheet.create({
  photo: {
    height: 176,
    borderBottomWidth: RULE,
    borderBottomColor: color.text,
    justifyContent: 'flex-end',
    padding: 12,
    backgroundColor: color.neutral300,
    overflow: 'hidden',
  },
  photoImage: {
    ...StyleSheet.absoluteFillObject,
    // The system requires pure black and white. RN has no CSS filter, so real
    // photography must be desaturated before upload.
    width: undefined,
    height: undefined,
  },
  stripes: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    transform: [{ rotate: '-45deg' }, { scale: 2 }],
  },
  stripe: {
    width: 6,
    height: '100%',
    backgroundColor: color.surface,
    marginRight: 6,
  },
  photoCaption: {
    ...type.meta,
    letterSpacing: 0.8,
    color: color.neutral700,
    backgroundColor: color.bg,
    alignSelf: 'flex-start',
    paddingVertical: 5,
    paddingHorizontal: 7,
  },
  statPair: {
    flexDirection: 'row',
    borderBottomWidth: RULE,
    borderBottomColor: color.text,
  },
  statCell: {
    flex: 1,
    gap: 3,
    paddingVertical: 13,
    paddingHorizontal: GUTTER,
  },
  statCellDivider: {
    borderRightWidth: RULE,
    borderRightColor: color.text,
  },
  statLabel: {
    ...type.label,
    fontSize: 9,
    letterSpacing: 1.26,
    color: color.neutral600,
  },
  statValue: {
    fontFamily: font.bold,
    fontSize: 15,
    lineHeight: 16,
    color: color.text,
  },
  intro: {
    paddingVertical: 16,
    paddingHorizontal: GUTTER,
    borderBottomWidth: RULE,
    borderBottomColor: color.text,
  },
  ingredientRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: GUTTER,
    borderBottomWidth: HAIRLINE,
    borderBottomColor: color.neutral300,
  },
  ingredientQty: {
    fontFamily: font.bold,
    fontSize: 13,
    lineHeight: 17,
    color: color.text,
    width: 74,
  },
  ingredientName: {
    fontFamily: font.regular,
    fontSize: 13,
    lineHeight: 17,
    color: color.text,
    flex: 1,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: GUTTER,
    borderBottomWidth: HAIRLINE,
    borderBottomColor: color.neutral300,
  },
  stepNumber: {
    fontFamily: font.extrabold,
    fontSize: 15,
    lineHeight: 20,
    color: color.accent,
    width: 22,
  },
  stepText: {
    ...type.body,
    flex: 1,
  },
  footer: {
    paddingTop: 18,
    paddingBottom: 34,
    paddingHorizontal: GUTTER,
    gap: 10,
  },
});
