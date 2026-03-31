// Shared header component used across all tab screens.
// Displays a title and optional right-side action button.
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';

interface HeaderProps {
  title: string;
  rightLabel?: string;
  rightColor?: string;
  onRightPress?: () => void;
}

export default function Header({
  title,
  rightLabel,
  rightColor = '#1D9E75',
  onRightPress,
}: HeaderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {rightLabel && onRightPress && (
        <TouchableOpacity onPress={onRightPress}>
          <Text style={[styles.rightLabel, { color: rightColor }]}>{rightLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 12 : 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E4E2D9',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2C2C2A',
  },
  rightLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
});