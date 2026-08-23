/**
 * Who is signed in, and which family they belong to.
 *
 * The family is *stored* on the user document rather than looked up by querying
 * every family for one containing your uid. One document read at a known path,
 * no query, no ambiguity about which family is yours.
 */

import { useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { arrayUnion, doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

export type SessionStatus = 'loading' | 'signed-out' | 'no-family' | 'ready';

export interface Session {
  status: SessionStatus;
  user: User | null;
  familyId: string;
}

export function useSession(): Session {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [familyId, setFamilyId] = useState('');
  const [familyReady, setFamilyReady] = useState(false);

  useEffect(
    // Fires immediately with the cached session, or null.
    () => onAuthStateChanged(auth, (next) => {
      setUser(next);
      setAuthReady(true);
    }),
    []
  );

  useEffect(() => {
    if (!user) {
      setFamilyId('');
      setFamilyReady(false);
      return;
    }

    setFamilyReady(false);

    // Live, so joining a family takes effect without a reload.
    return onSnapshot(
      doc(db, 'users', user.uid),
      (snap) => {
        setFamilyId(snap.data()?.familyId ?? '');
        setFamilyReady(true);
      },
      () => setFamilyReady(true)
    );
  }, [user]);

  const status: SessionStatus = !authReady
    ? 'loading'
    : !user
      ? 'signed-out'
      : !familyReady
        ? 'loading'
        : familyId
          ? 'ready'
          : 'no-family';

  return { status, user, familyId };
}

export interface Family {
  name: string;
  members: string[];
}

/** The family document — its name, and who is in it. */
export function useFamily(familyId: string) {
  const [family, setFamily] = useState<Family | null>(null);

  useEffect(() => {
    if (!familyId) return;

    return onSnapshot(doc(db, 'families', familyId), (snap) => {
      const data = snap.data();
      setFamily(data ? { name: data.name ?? '', members: data.members ?? [] } : null);
    });
  }, [familyId]);

  return {
    family,
    rename: (name: string) =>
      setDoc(doc(db, 'families', familyId), { name: name.trim() }, { merge: true }),
  };
}

/** Unambiguous alphabet — no O/0, no I/1. */
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** The family's document id, which doubles as the code you share to join it. */
export function generateFamilyCode(): string {
  return Array.from(
    { length: 6 },
    () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
  ).join('');
}

export function normalizeCode(raw: string): string {
  return raw.trim().toUpperCase();
}

/** Creates a family with a fresh code and points the user at it. */
export async function createFamily(uid: string, name: string): Promise<string> {
  const code = generateFamilyCode();

  await setDoc(doc(db, 'families', code), {
    name: name.trim() || 'My Family',
    members: [uid],
  });
  await setDoc(doc(db, 'users', uid), { familyId: code });

  return code;
}

/**
 * Joins an existing family by its code.
 *
 * Deliberately a blind write — the code is the secret, so there is no need to
 * read the family first. `updateDoc` (never `setDoc`, which would happily
 * *create* a family for a mistyped code) fails when the document doesn't
 * exist, and that failure is exactly the error worth reporting.
 */
export async function joinFamily(uid: string, rawCode: string): Promise<void> {
  const code = normalizeCode(rawCode);
  if (!code) throw new Error('Enter the family code.');

  try {
    await updateDoc(doc(db, 'families', code), { members: arrayUnion(uid) });
  } catch {
    throw new Error("That code didn't work. Check it and try again.");
  }

  await setDoc(doc(db, 'users', uid), { familyId: code });
}
