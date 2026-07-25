/**
 * A single skeleton block — the building block for all skeleton screens.
 *
 * The design system is flat with zero radius, so this is a plain gray rectangle
 * that pulses rather than the previous gradient shimmer.
 */
import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle, StyleProp, DimensionValue } from 'react-native';
import { color } from '../theme/tokens';

interface SkeletonBlockProps {
  width?: DimensionValue;
  height?: number;
  style?: StyleProp<ViewStyle>;
}

export default function SkeletonBlock({
  width = '100%',
  height = 16,
  style,
}: SkeletonBlockProps) {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    // Stop on unmount — otherwise the animation keeps driving a dead view.
    return () => loop.stop();
  }, [shimmer]);

  const opacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          backgroundColor: color.neutral300,
          borderRadius: 0,
          opacity,
        },
        style,
      ]}
    />
  );
}
