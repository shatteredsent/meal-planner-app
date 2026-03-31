import * as admin from "firebase-admin";
import { onCall, HttpsError, onRequest } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";

admin.initializeApp();

// ─── Alfred: Skill HTTP handler ───────────────────────────────────
// Alexa skill endpoint for "The Butler" skill.
// Handles:
//   - LaunchRequest: announces item count, keeps session open
//   - ReadListIntent: reads all unchecked items aloud
//   - AddItemIntent: adds a new item to the family shopping list
//   - AMAZON.StopIntent / AMAZON.CancelIntent: exits gracefully
export const alexaSkillHandler = onRequest(async (req, res) => {
  const body = req.body;

  const alexaUserId = body?.session?.user?.userId;
  const requestType = body?.request?.type;
  const intentName = body?.request?.intent?.name;
  const slots = body?.request?.intent?.slots;

  logger.info("Alfred skill request", { requestType, intentName, hasUserId: !!alexaUserId });

  function buildAlexaResponse(speechText: string, shouldEndSession = true) {
    return {
      version: "1.0",
      response: {
        outputSpeech: { type: "PlainText", text: speechText },
        shouldEndSession,
      },
    };
  }

  if (!alexaUserId) {
    res.json(buildAlexaResponse("I couldn't identify your account. Please try again."));
    return;
  }

  try {
    const db = admin.firestore();

    // Look up familyId from alexaUserId
    const alexaUserIdDoc = await db
      .collection("alexaUserIdMap")
      .doc(alexaUserId)
      .get();

    if (!alexaUserIdDoc.exists) {
      res.json(buildAlexaResponse(
        "I couldn't find your Family Meal Planner account. Please link your account in the app first."
      ));
      return;
    }

    const familyId = alexaUserIdDoc.data()!.familyId;

    // ── LaunchRequest: announce item count, keep session open ────
    if (requestType === "LaunchRequest") {
      const snapshot = await db
        .collection("shoppingItems")
        .where("familyId", "==", familyId)
        .where("isChecked", "==", false)
        .get();

      const count = snapshot.size;
      const countText = count === 0
        ? "Your shopping list is empty."
        : `You have ${count} item${count > 1 ? "s" : ""} on your shopping list.`;

      res.json(buildAlexaResponse(
        `${countText} Say we need, followed by an item to add something, or say read my list to hear everything.`,
        false
      ));
      return;
    }

    // ── ReadListIntent: read all unchecked items aloud ───────────
    if (requestType === "IntentRequest" && intentName === "ReadListIntent") {
      const snapshot = await db
        .collection("shoppingItems")
        .where("familyId", "==", familyId)
        .where("isChecked", "==", false)
        .get();

      if (snapshot.empty) {
        res.json(buildAlexaResponse("Your shopping list is empty.", false));
        return;
      }

      const items = snapshot.docs.map(doc => doc.data().name as string);
      const itemList = items.join(", ");
      res.json(buildAlexaResponse(
        `You have ${items.length} item${items.length > 1 ? "s" : ""}: ${itemList}.`,
        false
      ));
      return;
    }

    // ── AddItemIntent: add item to shopping list ─────────────────
    if (requestType === "IntentRequest" && intentName === "AddItemIntent") {
      const itemName = slots?.itemName?.value;

      if (!itemName) {
        res.json(buildAlexaResponse(
          "I didn't catch that. Say we need, followed by the item name.",
          false
        ));
        return;
      }

      await db.collection("shoppingItems").add({
        name: itemName,
        familyId,
        category: "Other",
        count: 1,
        isChecked: false,
        isManual: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      logger.info("Alfred added item", { familyId, itemName });
      res.json(buildAlexaResponse(
        `Added ${itemName}. Say we need to add another item, or goodbye to exit.`,
        false
      ));
      return;
    }

    // ── AMAZON.StopIntent / AMAZON.CancelIntent ──────────────────
    if (requestType === "IntentRequest" &&
      (intentName === "AMAZON.StopIntent" || intentName === "AMAZON.CancelIntent")) {
      res.json(buildAlexaResponse("Goodbye!"));
      return;
    }

    // ── SessionEndedRequest ──────────────────────────────────────
    if (requestType === "SessionEndedRequest") {
      res.json({ version: "1.0", response: {} });
      return;
    }

    // ── Fallback ─────────────────────────────────────────────────
    res.json(buildAlexaResponse(
      "Say we need, followed by an item name to add something, read my list to hear your list, or goodbye to exit.",
      false
    ));

  } catch (error: any) {
    logger.error("Alfred skill handler error", error?.message ?? error);
    res.json(buildAlexaResponse("Something went wrong. Please try again."));
  }
});

// ─── Alfred: Link account ─────────────────────────────────────────
// Called from the app after the user links their Amazon account.
// Maps the Alexa skill userId to the family document.
export const exchangeAlexaToken = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "You must be signed in.");
  }

  const { alexaUserId } = request.data as { alexaUserId: string };

  if (!alexaUserId) {
    throw new HttpsError("invalid-argument", "Missing alexaUserId.");
  }

  try {
    const db = admin.firestore();

    await db.collection("alexaUserIdMap").doc(alexaUserId).set({
      familyId: request.auth.uid,
    });

    await db.collection("families").doc(request.auth.uid).update({
      alexaUserId,
      alexaLinked: true,
    });

    logger.info(`Alfred account linked for user ${request.auth.uid}`);
    return { success: true };
  } catch (error: any) {
    logger.error("Failed to link Alfred account", error?.message ?? error);
    throw new HttpsError("internal", "Failed to link account.");
  }
});