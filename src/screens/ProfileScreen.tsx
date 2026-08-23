/**
 * Profile — family info, invite management, sign out.
 *
 * Not part of the redesign, so it keeps its existing structure and gets the
 * Modernist token pass: flat rows separated by rules, square corners, no icons.
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  ActivityIndicator, TextInput, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { signOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { useAuth } from '../hooks/useAuth';
import { useFamily } from '../hooks/useFamily';
import { usePlannerData } from '../context/PlannerData';
import ScreenHeader from '../components/ui/ScreenHeader';
import GroupHeader from '../components/ui/GroupHeader';
import FlatButton from '../components/ui/FlatButton';
import { color, type, font, GUTTER, RULE, HAIRLINE } from '../theme/tokens';
import { confirm, notify } from '../utils/dialog';

const APP_VERSION = '1.0.0';

// Generates a random 6-digit alphanumeric invite code
function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('');
}

interface RowProps {
  label: string;
  value?: string;
  onPress?: () => void;
  isBusy?: boolean;
  /** Closes the group with a 2px rule instead of a hairline. */
  isLast?: boolean;
}

function Row({ label, value, onPress, isBusy, isLast }: RowProps) {
  const content = (
    <>
      <Text style={styles.rowLabel}>{label}</Text>
      {isBusy ? (
        <ActivityIndicator size="small" color={color.accent} />
      ) : (
        !!value && <Text style={styles.rowValue}>{value}</Text>
      )}
    </>
  );

  if (!onPress) {
    return <View style={[styles.row, isLast && styles.rowLast]}>{content}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.row,
        isLast && styles.rowLast,
        pressed && styles.rowPressed,
      ]}
    >
      {content}
    </Pressable>
  );
}

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  // Shares the resolved family with the rest of the app, so an invited member
  // sees and renames the family they actually belong to.
  const { familyId } = usePlannerData();
  const { family, isLoading, updateFamilyName } = useFamily(familyId);

  const [isSigningOut, setIsSigningOut] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newFamilyName, setNewFamilyName] = useState('');

  function handleSignOut(): void {
    confirm({
      title: 'Sign out',
      message: 'Are you sure you want to sign out?',
      confirmLabel: 'Sign out',
      destructive: true,
      onConfirm: async () => {
        setIsSigningOut(true);
        try {
          await signOut(auth);
        } catch {
          notify('Error', 'Could not sign out. Please try again.');
        } finally {
          setIsSigningOut(false);
        }
      },
    });
  }

  async function handleGenerateInvite(): Promise<void> {
    setIsGeneratingCode(true);
    try {
      const code = generateInviteCode();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      // Store invite in Firestore — expires in 24 hours
      await setDoc(doc(db, 'invites', code), {
        familyId,
        createdBy: user?.uid,
        expiresAt: expiresAt.toISOString(),
      });

      setInviteCode(code);
    } catch {
      notify('Error', 'Could not generate invite code. Please try again.');
    } finally {
      setIsGeneratingCode(false);
    }
  }

  async function handleUpdateFamilyName(): Promise<void> {
    if (!newFamilyName.trim()) {
      notify('Missing name', 'Please enter a family name.');
      return;
    }
    try {
      await updateFamilyName(newFamilyName.trim());
      setIsEditingName(false);
      setNewFamilyName('');
    } catch {
      notify('Error', 'Could not update family name. Please try again.');
    }
  }

  if (isLoading) {
    return (
      <View style={styles.centeredState}>
        <ActivityIndicator size="large" color={color.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader
        kicker={family?.name ?? 'My family'}
        title="Family & settings"
        action={{ label: 'Back', onPress: () => navigation.goBack() }}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.identity}>
          <Text style={styles.identityLabel}>Signed in as</Text>
          <Text style={type.mealName}>{family?.name ?? 'My Family'}</Text>
          <Text style={type.secondary}>{user?.email}</Text>
        </View>

        <GroupHeader label="Family" />
        <Row
          label="Family Name"
          value={family?.name ?? '—'}
          onPress={() => {
            setNewFamilyName(family?.name ?? '');
            setIsEditingName(true);
          }}
        />
        <Row
          label="Invite Member"
          onPress={handleGenerateInvite}
          isBusy={isGeneratingCode}
          isLast
        />

        <GroupHeader label="About" ruleAbove />
        <Row label="Version" value={APP_VERSION} isLast />

        <View style={styles.footer}>
          <FlatButton
            block
            variant="quiet"
            label={isSigningOut ? 'Signing out…' : 'Sign out'}
            onPress={handleSignOut}
            disabled={isSigningOut}
          />
        </View>
      </ScrollView>

      {/* Invite code modal */}
      <Modal
        visible={!!inviteCode}
        transparent
        animationType="fade"
        onRequestClose={() => setInviteCode(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalKicker}>Invite code</Text>
            <Text style={styles.codeText}>{inviteCode}</Text>
            <Text style={type.secondary}>
              Share this with your family member. It expires in 24 hours.
            </Text>
            <FlatButton
              block
              variant="accent"
              label="Done"
              onPress={() => setInviteCode(null)}
            />
          </View>
        </View>
      </Modal>

      {/* Edit family name modal */}
      <Modal
        visible={isEditingName}
        transparent
        animationType="fade"
        onRequestClose={() => setIsEditingName(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View testID="family-name-sheet" style={styles.modalSheet}>
            <Text style={styles.modalKicker}>Family Name</Text>
            <TextInput
              style={styles.nameInput}
              value={newFamilyName}
              onChangeText={setNewFamilyName}
              autoCapitalize="words"
              placeholder="Enter family name"
              placeholderTextColor={color.neutral500}
            />
            <FlatButton
              block
              variant="accent"
              label="Save"
              onPress={handleUpdateFamilyName}
            />
            <FlatButton
              block
              variant="quiet"
              label="Cancel"
              onPress={() => setIsEditingName(false)}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: color.bg,
  },
  centeredState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: color.bg,
  },
  identity: {
    paddingVertical: 20,
    paddingHorizontal: GUTTER,
    gap: 3,
    borderBottomWidth: RULE,
    borderBottomColor: color.text,
  },
  identityLabel: {
    ...type.label,
    letterSpacing: 1.4,
    color: color.neutral600,
    marginBottom: 3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: GUTTER,
    borderBottomWidth: HAIRLINE,
    borderBottomColor: color.neutral300,
  },
  rowLast: {
    borderBottomWidth: RULE,
    borderBottomColor: color.text,
  },
  rowPressed: {
    backgroundColor: color.accent100,
  },
  rowLabel: {
    fontFamily: font.regular,
    fontSize: 15,
    lineHeight: 19,
    color: color.text,
  },
  rowValue: {
    ...type.secondary,
    textAlign: 'right',
    flexShrink: 1,
  },
  footer: {
    padding: GUTTER,
    paddingBottom: 40,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(32,30,29,0.5)',
  },
  modalSheet: {
    backgroundColor: color.bg,
    borderTopWidth: RULE,
    borderTopColor: color.text,
    padding: GUTTER,
    paddingBottom: 40,
    gap: 12,
  },
  modalKicker: {
    ...type.label,
    letterSpacing: 1.4,
    color: color.accent700,
  },
  codeText: {
    fontFamily: font.extrabold,
    fontSize: 32,
    lineHeight: 36,
    letterSpacing: 8,
    color: color.accent,
  },
  nameInput: {
    borderWidth: 2,
    borderColor: color.text,
    paddingVertical: 13,
    paddingHorizontal: 12,
    fontFamily: font.regular,
    fontSize: 13.5,
    color: color.text,
    backgroundColor: color.bg,
  },
});
