// Modal that lets the user select which shopping list items to send to Alexa.
import React, { useState } from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';
import { ShoppingItem } from '../types/shoppingItem';

interface SendToAlexaModalProps {
  isVisible: boolean;
  items: ShoppingItem[];
  onClose: () => void;
}

export default function SendToAlexaModal({
  isVisible,
  items,
  onClose,
}: SendToAlexaModalProps) {
  const uncheckedItems = items.filter((item) => !item.isChecked);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(uncheckedItems.map((item) => item.id))
  );
  const [isSending, setIsSending] = useState(false);

  function toggleItem(itemId: string): void {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  }

  function toggleAll(): void {
    if (selectedIds.size === uncheckedItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(uncheckedItems.map((item) => item.id)));
    }
  }

  async function handleSend(): Promise<void> {
    console.log('[Alexa] handleSend fired, selected items:', selectedIds.size);
    if (selectedIds.size === 0) {
      Alert.alert('No items selected', 'Please select at least one item to send.');
      return;
    }

    const selectedItems = uncheckedItems
      .filter((item) => selectedIds.has(item.id))
      .map((item) => item.name);

    setIsSending(true);
    try {
      const sendToAlexa = httpsCallable(functions, 'sendToAlexaList');
      const result = await sendToAlexa({ items: selectedItems }) as any;

      const { successCount, failCount } = result.data;

      if (failCount === 0) {
        Alert.alert(
          'Done! ✓',
          `${successCount} item${successCount > 1 ? 's' : ''} added to your Alexa shopping list.`
        );
      } else {
        Alert.alert(
          'Partially sent',
          `${successCount} items added, ${failCount} failed.`
        );
      }
      onClose();
    } catch (error: any) {
      const message = error?.message?.includes('not linked')
        ? 'Please link your Alexa account in the Profile tab first.'
        : 'Could not send to Alexa. Please try again.';
      Alert.alert('Error', message);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Send to Alexa</Text>
          <Text style={styles.subtitle}>
            Select items to add to your Alexa shopping list
          </Text>

          {/* Select all toggle */}
          <TouchableOpacity style={styles.selectAllRow} onPress={toggleAll}>
            <Text style={styles.selectAllText}>
              {selectedIds.size === uncheckedItems.length ? 'Deselect all' : 'Select all'}
            </Text>
            <Text style={styles.selectedCount}>
              {selectedIds.size} of {uncheckedItems.length} selected
            </Text>
          </TouchableOpacity>

          <ScrollView
            style={styles.itemList}
            showsVerticalScrollIndicator={false}
          >
            {uncheckedItems.length === 0 ? (
              <Text style={styles.emptyText}>No unchecked items on your list.</Text>
            ) : (
              uncheckedItems.map((item, index) => (
                <View key={item.id}>
                  <TouchableOpacity
                    style={styles.itemRow}
                    onPress={() => toggleItem(item.id)}
                  >
                    <View style={[
                      styles.checkbox,
                      selectedIds.has(item.id) && styles.checkboxSelected
                    ]}>
                      {selectedIds.has(item.id) && (
                        <Ionicons name="checkmark" size={14} color="#fff" />
                      )}
                    </View>
                    <Text style={styles.itemName}>{item.name}</Text>
                  </TouchableOpacity>
                  {index < uncheckedItems.length - 1 && (
                    <View style={styles.divider} />
                  )}
                </View>
              ))
            )}
          </ScrollView>

          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleSend}
            disabled={isSending}
          >
            {isSending
              ? <ActivityIndicator color="#fff" />
              : <>
                  <Ionicons name="send" size={16} color="#fff" style={styles.sendIcon} />
                  <Text style={styles.sendButtonText}>Send to Alexa</Text>
                </>
            }
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '85%',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2C2C2A',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#888780',
    marginBottom: 16,
  },
  selectAllRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E4E2D9',
  },
  selectAllText: {
    fontSize: 14,
    color: '#1D9E75',
    fontWeight: '600',
  },
  selectedCount: {
    fontSize: 13,
    color: '#888780',
  },
  itemList: {
    maxHeight: 300,
    marginBottom: 16,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#B4B2A9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxSelected: {
    backgroundColor: '#1D9E75',
    borderColor: '#1D9E75',
  },
  itemName: {
    fontSize: 15,
    color: '#2C2C2A',
    flex: 1,
  },
  divider: {
    height: 0.5,
    backgroundColor: '#E4E2D9',
  },
  emptyText: {
    fontSize: 14,
    color: '#888780',
    textAlign: 'center',
    paddingVertical: 20,
  },
  sendButton: {
    backgroundColor: '#1D9E75',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
  },
  sendIcon: {
    marginRight: 8,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  cancelButton: {
    padding: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#888780',
    fontSize: 15,
  },
});