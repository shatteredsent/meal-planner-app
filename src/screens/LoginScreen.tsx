import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import {
  doc, setDoc, serverTimestamp, getDoc, updateDoc, arrayUnion, deleteDoc,
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';

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
      Alert.alert('Missing fields', 'Please enter your email and password.');
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
      Alert.alert('Error', e.message);
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
      Alert.alert('Missing code', 'Please enter your invite code.');
      return;
    }

    const code = inviteCode.trim().toUpperCase();

    // Look up the invite code
    const inviteRef = doc(db, 'invites', code);
    const inviteSnap = await getDoc(inviteRef);

    if (!inviteSnap.exists()) {
      Alert.alert('Invalid code', 'This invite code does not exist.');
      return;
    }

    const inviteData = inviteSnap.data();

    // Check expiry
    const expiresAt = new Date(inviteData.expiresAt);
    if (new Date() > expiresAt) {
      Alert.alert('Expired code', 'This invite code has expired. Ask your family admin to generate a new one.');
      return;
    }

    // Create the Auth account
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = credential.user.uid;

    // Add the new user to the existing family's adminUids
    await updateDoc(doc(db, 'families', inviteData.familyId), {
      adminUids: arrayUnion(uid),
    });

    // Delete the invite code so it can't be reused
    await deleteDoc(inviteRef);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Family Meal Planner</Text>
      <Text style={styles.subtitle}>
        {isSignUp ? 'Create account' : 'Sign in'}
      </Text>

      {/* Sign-up mode toggle */}
      {isSignUp && (
        <View style={styles.modeToggle}>
          <TouchableOpacity
            style={[styles.modeButton, signUpMode === 'new' && styles.modeButtonActive]}
            onPress={() => setSignUpMode('new')}
          >
            <Text style={[styles.modeButtonText, signUpMode === 'new' && styles.modeButtonTextActive]}>
              New Family
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeButton, signUpMode === 'join' && styles.modeButtonActive]}
            onPress={() => setSignUpMode('join')}
          >
            <Text style={[styles.modeButtonText, signUpMode === 'join' && styles.modeButtonTextActive]}>
              Join Family
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#888780"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#888780"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {/* Invite code field — only shown when joining */}
      {isSignUp && signUpMode === 'join' && (
        <TextInput
          style={styles.input}
          placeholder="Invite code (e.g. ABC123)"
          placeholderTextColor="#888780"
          autoCapitalize="characters"
          value={inviteCode}
          onChangeText={setInviteCode}
        />
      )}

      <TouchableOpacity
        style={styles.btn}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.btnText}>
              {isSignUp
                ? signUpMode === 'join' ? 'Join Family' : 'Create Account'
                : 'Sign In'
              }
            </Text>
        }
      </TouchableOpacity>

      <TouchableOpacity onPress={() => {
        setIsSignUp(v => !v);
        setSignUpMode('new');
      }}>
        <Text style={styles.toggle}>
          {isSignUp
            ? 'Already have an account? Sign in'
            : "Don't have an account? Create one"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 28,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 26,
    fontWeight: '600',
    color: '#1D9E75',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: '#888780',
    marginBottom: 28,
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: '#F0EEE6',
    borderRadius: 10,
    padding: 4,
    marginBottom: 16,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  modeButtonActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  modeButtonText: {
    fontSize: 14,
    color: '#888780',
    fontWeight: '500',
  },
  modeButtonTextActive: {
    color: '#2C2C2A',
    fontWeight: '600',
  },
  input: {
    borderWidth: 0.5,
    borderColor: '#B4B2A9',
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    marginBottom: 12,
    color: '#2C2C2A',
  },
  btn: {
    backgroundColor: '#1D9E75',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 8,
  },
  btnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  toggle: {
    textAlign: 'center',
    color: '#1D9E75',
    marginTop: 20,
    fontSize: 13,
  },
});
