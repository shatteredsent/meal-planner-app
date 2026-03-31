// Profile screen — shows family info, invite management, and sign out.
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Alert, ActivityIndicator, TextInput, Modal,
} from 'react-native';
import { signOut } from 'firebase/auth';
import {
  doc, setDoc, updateDoc, arrayUnion, getDoc, deleteDoc,
} from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../config/firebase';
import { useAuth } from '../hooks/useAuth';
import { useFamily } from '../hooks/useFamily';
import Header from '../components/Header';
import { useAlexaLink } from '../hooks/useAlexaLink';


const APP_VERSION = '1.0.0';

// Generates a random 6-digit alphanumeric invite code
function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('');
}

export default function ProfileScreen() {
  const { user } = useAuth();
  const familyId = user?.uid ?? '';
  const { family, isLoading, updateFamilyName } = useFamily(familyId);
  const { isLinked: isAlexaLinked, isLinking, startAlexaLink: linkAlexa } = useAlexaLink();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newFamilyName, setNewFamilyName] = useState('');

  async function handleSignOut(): Promise<void> {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          setIsSigningOut(true);
          try {
            await signOut(auth);
          } catch (e: any) {
            console.log('Invite error:', e.message);
            Alert.alert('Error', 'Could not sign out. Please try again.');
          } finally {
            setIsSigningOut(false);
          }
        },
      },
    ]);
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
      Alert.alert('Error', 'Could not generate invite code. Please try again.');
    } finally {
      setIsGeneratingCode(false);
    }
  }

  async function handleUpdateFamilyName(): Promise<void> {
    if (!newFamilyName.trim()) {
      Alert.alert('Missing name', 'Please enter a family name.');
      return;
    }
    try {
      await updateFamilyName(newFamilyName.trim());
      setIsEditingName(false);
      setNewFamilyName('');
    } catch {
      Alert.alert('Error', 'Could not update family name. Please try again.');
    }
  }

  if (isLoading) {
    return (
      <View style={styles.centeredState}>
        <ActivityIndicator size="large" color="#1D9E75" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Profile" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Family avatar + info */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarCircle}>
            <Ionicons name="people" size={36} color="#1D9E75" />
          </View>
          <Text style={styles.familyName}>{family?.name ?? 'My Family'}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        {/* Family section */}
        <Text style={styles.sectionLabel}>Family</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.row}
            onPress={() => {
              setNewFamilyName(family?.name ?? '');
              setIsEditingName(true);
            }}
          >
            <View style={styles.rowLeft}>
              <Ionicons name="pencil-outline" size={20} color="#1D9E75" style={styles.rowIcon} />
              <Text style={styles.rowLabel}>Family Name</Text>
            </View>
            <View style={styles.rowRight}>
              <Text style={styles.rowValue}>{family?.name ?? '—'}</Text>
              <Ionicons name="chevron-forward" size={16} color="#B4B2A9" />
            </View>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.row}
            onPress={handleGenerateInvite}
            disabled={isGeneratingCode}
          >
            <View style={styles.rowLeft}>
              <Ionicons name="person-add-outline" size={20} color="#1D9E75" style={styles.rowIcon} />
              <Text style={styles.rowLabel}>Invite Member</Text>
            </View>
            <View style={styles.rowRight}>
              {isGeneratingCode
                ? <ActivityIndicator size="small" color="#1D9E75" />
                : <Ionicons name="chevron-forward" size={16} color="#B4B2A9" />
              }
            </View>
          </TouchableOpacity>
        </View>

        {/* Alexa section */}
        <Text style={styles.sectionLabel}>Alexa</Text>
        <View style={styles.card}>
            <TouchableOpacity
                style={styles.row}
                onPress={linkAlexa}
                disabled={isLinking || isAlexaLinked}
            >
        <View style={styles.rowLeft}>
            <Ionicons
                name={isAlexaLinked ? 'checkmark-circle' : 'link-outline'}
                size={20}
                color={isAlexaLinked ? '#1D9E75' : '#1D9E75'}
                style={styles.rowIcon}
            />
            <Text style={styles.rowLabel}>
             {isAlexaLinked ? 'Alexa Linked' : 'Link Alexa Account'}
            </Text>
        </View>
        <View style={styles.rowRight}>
            {isLinking
                ? <ActivityIndicator size="small" color="#1D9E75" />
                : isAlexaLinked
                    ? <Text style={styles.linkedBadge}>Connected ✓</Text>
                    : <Ionicons name="chevron-forward" size={16} color="#B4B2A9" />
            }
        </View>
    </TouchableOpacity>
    </View>

        {/* About section */}
        <Text style={styles.sectionLabel}>About</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons name="information-circle-outline" size={20} color="#1D9E75" style={styles.rowIcon} />
              <Text style={styles.rowLabel}>Version</Text>
            </View>
            <Text style={styles.rowValue}>{APP_VERSION}</Text>
          </View>
        </View>

        {/* Sign out */}
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
          disabled={isSigningOut}
        >
          {isSigningOut
            ? <ActivityIndicator color="#FF4444" />
            : <Text style={styles.signOutText}>Sign Out</Text>
          }
        </TouchableOpacity>
      </ScrollView>

      {/* Invite code modal */}
      <Modal
        visible={!!inviteCode}
        transparent
        animationType="slide"
        onRequestClose={() => setInviteCode(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Ionicons name="checkmark-circle" size={48} color="#1D9E75" style={styles.modalIcon} />
            <Text style={styles.modalTitle}>Invite Code</Text>
            <Text style={styles.modalSubtitle}>
              Share this code with your family member. It expires in 24 hours.
            </Text>
            <View style={styles.codeBox}>
              <Text style={styles.codeText}>{inviteCode}</Text>
            </View>
            <TouchableOpacity
              style={styles.modalDoneButton}
              onPress={() => setInviteCode(null)}
            >
              <Text style={styles.modalDoneText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Edit family name modal */}
      <Modal
        visible={isEditingName}
        transparent
        animationType="slide"
        onRequestClose={() => setIsEditingName(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Family Name</Text>
            <TextInput
              style={styles.nameInput}
              value={newFamilyName}
              onChangeText={setNewFamilyName}
              autoCapitalize="words"
              autoFocus
              placeholder="Enter family name"
              placeholderTextColor="#888780"
            />
            <TouchableOpacity
              style={styles.modalDoneButton}
              onPress={handleUpdateFamilyName}
            >
              <Text style={styles.modalDoneText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setIsEditingName(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F6F2',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  centeredState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F6F2',
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 8,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F0FAF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: '#1D9E75',
  },
  familyName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2C2C2A',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#888780',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888780',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 16,
    borderWidth: 0.5,
    borderColor: '#E4E2D9',
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rowIcon: {
    marginRight: 12,
  },
  rowLabel: {
    fontSize: 15,
    color: '#2C2C2A',
  },
  rowValue: {
    fontSize: 14,
    color: '#888780',
  },
  divider: {
    height: 0.5,
    backgroundColor: '#E4E2D9',
  },
  signOutButton: {
    borderWidth: 1,
    borderColor: '#FF4444',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    marginTop: 8,
  },
  signOutText: {
    color: '#FF4444',
    fontWeight: '600',
    fontSize: 15,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  modalIcon: {
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2C2C2A',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#888780',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  codeBox: {
    backgroundColor: '#F0FAF5',
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 16,
    marginBottom: 24,
    borderWidth: 0.5,
    borderColor: '#1D9E75',
  },
  codeText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1D9E75',
    letterSpacing: 8,
  },
  modalDoneButton: {
    backgroundColor: '#1D9E75',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    width: '100%',
    marginBottom: 10,
  },
  modalDoneText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  modalCancelButton: {
    padding: 12,
    alignItems: 'center',
    width: '100%',
  },
  modalCancelText: {
    color: '#888780',
    fontSize: 15,
  },
  nameInput: {
    borderWidth: 0.5,
    borderColor: '#B4B2A9',
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: '#2C2C2A',
    width: '100%',
    marginBottom: 16,
  },
  linkedBadge: {
    fontSize: 13,
    color: '#1D9E75',
    fontWeight: '600',
  },
});