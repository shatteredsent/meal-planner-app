/**
 * Resolves which family's data the signed-in user should see.
 *
 * Every collection is scoped by `familyId`, and the app previously used
 * `user.uid` for that. That silently broke sharing: `joinFamily` adds the
 * joiner's uid to the target family's `adminUids`, but a client querying
 * `familyId == ownUid` never sees the family it was invited into — an invited
 * member got their own empty planner instead of the shared one.
 *
 * So the family is looked up rather than assumed: find the family whose
 * `adminUids` contains this user.
 */
import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';

interface UseFamilyIdResult {
  /** '' until resolved — callers should treat that as "not ready". */
  familyId: string;
  isResolving: boolean;
}

export function useFamilyId(uid: string): UseFamilyIdResult {
  const [familyId, setFamilyId] = useState('');
  const [isResolving, setIsResolving] = useState(true);

  useEffect(() => {
    if (!uid) {
      setFamilyId('');
      setIsResolving(false);
      return;
    }

    // Live, so redeeming an invite code swaps the user onto the shared family
    // without needing a restart.
    const familiesQuery = query(
      collection(db, 'families'),
      where('adminUids', 'array-contains', uid)
    );

    const unsubscribe = onSnapshot(
      familiesQuery,
      (snapshot) => {
        const ids = snapshot.docs.map((d) => d.id);

        // A user can legitimately belong to more than one family (they created
        // one, then joined a partner's). Prefer the family they created — the
        // doc whose id is their own uid — so this never silently moves someone
        // off their own data. Otherwise take the one they were invited into.
        setFamilyId(ids.find((id) => id === uid) ?? ids[0] ?? uid);
        setIsResolving(false);
      },
      () => {
        // If the lookup fails, fall back to the old behaviour rather than
        // leaving the app with no family at all.
        setFamilyId(uid);
        setIsResolving(false);
      }
    );

    return () => unsubscribe();
  }, [uid]);

  return { familyId, isResolving };
}
