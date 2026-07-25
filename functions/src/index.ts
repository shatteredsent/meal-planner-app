import * as admin from "firebase-admin";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";

admin.initializeApp();

// ─── Join family via invite code ─────────────────────────────────
// Called after the new user's auth account is created.
// Validates the invite, adds the user to the family, and deletes the code.
export const joinFamily = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "You must be signed in.");
  }

  const { inviteCode } = request.data as { inviteCode: string };
  if (!inviteCode) {
    throw new HttpsError("invalid-argument", "Missing invite code.");
  }

  const db = admin.firestore();
  const code = (inviteCode as string).trim().toUpperCase();
  const inviteRef = db.collection("invites").doc(code);
  const inviteSnap = await inviteRef.get();

  if (!inviteSnap.exists) {
    throw new HttpsError("not-found", "This invite code does not exist.");
  }

  const inviteData = inviteSnap.data()!;
  if (new Date() > new Date(inviteData.expiresAt)) {
    throw new HttpsError("deadline-exceeded", "This invite code has expired. Ask your family admin to generate a new one.");
  }

  const uid = request.auth.uid;
  const familyId = inviteData.familyId as string;

  await db.collection("families").doc(familyId).update({
    adminUids: admin.firestore.FieldValue.arrayUnion(uid),
  });
  await inviteRef.delete();

  logger.info(`User ${uid} joined family ${familyId} via invite code`);
  return { familyId };
});
