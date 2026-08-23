/**
 * Sign in / create account.
 *
 * Not part of the redesign, so the flow is unchanged — this is the Modernist
 * token pass: square corners, 2px rules, Archivo, periwinkle accent.
 */
import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable,
  StyleSheet,
  KeyboardAvoidingView, ScrollView, Platform,
} from 'react-native';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import {
  doc, setDoc, serverTimestamp,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { auth, db, functions } from '../config/firebase';
import FlatButton from '../components/ui/FlatButton';
import { color, type, font, GUTTER } from '../theme/tokens';
import { notify } from '../utils/dialog';

type SignUpMode = 'new'| 'join';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [signUpMode, setSignUpMode] = useState<SignUpMode>('new');

  async function handleSubmit(): Promise<void> {
    if (!email || !password) {
      notify('Missing fields', 'Please enter your email and password.');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        if (signUpMode === 'join') {
          await handleJoinFamily();
        } else {
          await handleCreateFamily();
        }
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (e: any) {
      notify('Error', e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateFamily(): Promise<void> {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = credential.user.uid;

    await setDoc(doc(db, 'families', uid), {
      name: `${email.split('@')[0]}'s Family`,
      adminUids: [uid],
      createdAt: serverTimestamp(),
      createdBy: uid,
    });
  }

  async function handleJoinFamily(): Promise<void> {
    if (!inviteCode.trim()) {
      notify('Missing code', 'Please enter your invite code.');
      return;
    }

    const code = inviteCode.trim().toUpperCase();

    await createUserWithEmailAndPassword(auth, email, password);
    await httpsCallable(functions, 'joinFamily')({ inviteCode: code });
  }

  const submitLabel = isSignUp
    ? signUpMode === 'join' ? 'Join family' : 'Create account'
    : 'Sign in';

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.kicker}>Family meal planner</Text>
        <Text style={styles.title}>
          {isSignUp ? 'Create an account' : 'Sign in'}
        </Text>

        {/* Sign-up mode toggle */}
        {isSignUp && (
          <View style={styles.segmented}>
            {(['new', 'join'] as SignUpMode[]).map((mode, index) => {
              const isActive = signUpMode === mode;
              return (
                <Pressable
                  key={mode}
                  onPress={() => setSignUpMode(mode)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                  style={({ pressed }) => [
                    styles.segment,
                    index === 0 && styles.segmentDivider,
                    isActive && styles.segmentActive,
                    pressed && !isActive && styles.segmentPressed,
                  ]}
                >
                  <Text
                    style={[styles.segmentLabel, isActive && styles.segmentLabelActive]}
                  >
                    {mode === 'new' ? 'New family' : 'Join family'}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}

        <View style={styles.fields}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={color.neutral500}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            accessibilityLabel="Email"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={color.neutral500}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            accessibilityLabel="Password"
          />

          {/* Invite code field — only shown when joining */}
          {isSignUp && signUpMode === 'join' && (
            <TextInput
              style={styles.input}
              placeholder="Invite code (e.g. ABC123)"
              placeholderTextColor={color.neutral500}
              autoCapitalize="characters"
              value={inviteCode}
              onChangeText={setInviteCode}
              accessibilityLabel="Invite code"
            />
          )}
        </View>

        <FlatButton
          block
          variant="accent"
          disabled={loading}
          onPress={handleSubmit}
          label={loading ? 'Just a moment…' : submitLabel}
        />

        <Pressable
          onPress={() => {
            setIsSignUp((v) => !v);
            setSignUpMode('new');
          }}
          accessibilityRole="button"
          style={styles.toggleButton}
        >
          {({ pressed }) => (
            <Text style={[styles.toggle, pressed && styles.togglePressed]}>
              {isSignUp
                ? 'Already have an account? Sign in'
                : "Don't have an account? Create one"}
            </Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: color.bg,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: GUTTER,
    backgroundColor: color.bg,
  },
  kicker: {
    ...type.label,
    letterSpacing: 1.6,
    color: color.accent700,
  },
  title: {
    ...type.screenTitle,
    marginTop: 8,
    marginBottom: 24,
  },
  segmented: {
    flexDirection: 'row',
    borderWidth: 2,
    borderColor: color.text,
    marginBottom: 16,
  },
  segment: {
    flex: 1,
    paddingVertical: 13,
    paddingHorizontal: 14,
  },
  segmentDivider: {
    borderRightWidth: 2,
    borderRightColor: color.text,
  },
  segmentActive: {
    backgroundColor: color.text,
  },
  segmentPressed: {
    backgroundColor: color.accent100,
  },
  segmentLabel: {
    ...type.button,
    color: color.neutral700,
  },
  segmentLabelActive: {
    color: color.bg,
  },
  fields: {
    gap: 12,
    marginBottom: 16,
  },
  input: {
    borderWidth: 2,
    borderColor: color.text,
    paddingVertical: 13,
    paddingHorizontal: 12,
    fontFamily: font.regular,
    fontSize: 13.5,
    color: color.text,
    backgroundColor: color.bg,
  },
  toggleButton: {
    paddingVertical: 16,
  },
  toggle: {
    ...type.secondarySmall,
    color: color.accent700,
  },
  togglePressed: {
    color: color.accent,
  },
});
