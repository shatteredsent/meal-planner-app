/**
 * Full-screen overlay for the picker and recipe detail.
 *
 * The design covers the whole screen rather than sliding a bottom sheet up, so
 * there is no backdrop and no rounded top corners — just the ground fill edge to
 * edge, above the tab bar.
 */
import React from 'react';
import { Modal, View, StyleSheet } from 'react-native';
import { color } from '../../theme/tokens';

interface OverlayProps {
  visible: boolean;
  onRequestClose: () => void;
  children: React.ReactNode;
}

export default function Overlay({ visible, onRequestClose, children }: OverlayProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="overFullScreen"
      onRequestClose={onRequestClose}
    >
      <View style={styles.container}>{children}</View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: color.bg,
  },
});
