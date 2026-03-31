/**
 * useFamily — loads the family document for the current user.
 */
import { useState, useEffect } from 'react';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

interface Family {
  name: string;
  adminUids: string[];
}

interface UseFamilyResult {
  family: Family | null;
  isLoading: boolean;
  updateFamilyName: (newName: string) => Promise<void>;
}

export function useFamily(familyId: string): UseFamilyResult {
  const [family, setFamily] = useState<Family | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!familyId) return;

    const familyRef = doc(db, 'families', familyId);
    const unsubscribe = onSnapshot(
      familyRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setFamily(snapshot.data() as Family);
        }
        setIsLoading(false);
      },
      () => setIsLoading(false)
    );

    return () => unsubscribe();
  }, [familyId]);

  async function updateFamilyName(newName: string): Promise<void> {
    await updateDoc(doc(db, 'families', familyId), { name: newName });
  }

  return { family, isLoading, updateFamilyName };
}