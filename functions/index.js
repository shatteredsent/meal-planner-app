const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');

admin.initializeApp();

exports.syncToAlexa = functions.https.onCall(async (data, context) => {
  // data.accessToken MUST be provided by the client (via Account Linking flow)
  const alexaAccessToken = data.accessToken;

  if (!alexaAccessToken) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Alexa Access Token is missing. Please link your Amazon account.'
    );
  }

  try {
    // 1. Get current items from Firestore
    const shoppingListSnapshot = await admin.firestore().collection('shopping_list').get();
    const items = shoppingListSnapshot.docs.map(doc => doc.data());

    console.log(`Starting sync of ${items.length} items to Alexa...`);

    // 2. Fetch User's Household Lists to find the Shopping List
    const listsResponse = await axios.get('https://api.amazonalexa.com/v2/householdlists/', {
      headers: {
        'Authorization': `Bearer ${alexaAccessToken}`,
        'Content-Type': 'application/json'
      }
    });

    const lists = listsResponse.data.lists;
    // Look for the default content (state: active) and name "Alexa shopping list" 
    // or just the first active one if specific name isn't guaranteed, 
    // usually name is "Alexa shopping list" or type is "SHOPPING_LIST" (v2 might not show generic type) 
    // Actually v2 householdlists usually returns { "lists": [ { "listId": "...", "name": "Alexa shopping list", "state": "active", "version": 1, "statusMap": ... } ] }

    // We try to find the one named "Alexa shopping list" or fallback to the first active one.
    const shoppingList = lists.find(l => l.name === 'Alexa shopping list' && l.state === 'active') ||
      lists.find(l => l.state === 'active');

    if (!shoppingList) {
      throw new functions.https.HttpsError('not-found', 'Could not find an active Alexa shopping list.');
    }

    const listId = shoppingList.listId;
    console.log(`Found Alexa List ID: ${listId}`);

    // 3. Post items to the list
    // Note: To avoid duplicates, a real sync would fetch existing list items first and diff.
    // For this "Add" operation, we will just attempt to add active items.

    let addedCount = 0;

    // Parallelize requests for speed, but be mindful of rate limits.
    const promises = items
      .filter(item => !item.isChecked) // Only add unchecked items
      .map(async (item) => {
        try {
          await axios.post(
            `https://api.amazonalexa.com/v2/householdlists/${listId}/items`,
            {
              value: item.name,
              status: 'active'
            },
            {
              headers: {
                'Authorization': `Bearer ${alexaAccessToken}`,
                'Content-Type': 'application/json'
              }
            }
          );
          return 1;
        } catch (err) {
          console.error(`Failed to add item ${item.name}`, err.response?.data || err.message);
          return 0;
        }
      });

    const results = await Promise.all(promises);
    addedCount = results.reduce((a, b) => a + b, 0);

    // Write log for debugging
    await admin.firestore().collection('sync_logs').add({
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      target: 'Alexa',
      itemsCount: items.length,
      uploaded: addedCount,
      status: 'Synced'
    });

    return {
      success: true,
      message: `Assuming you are authenticated, synced ${addedCount} items to your Alexa list ("${shoppingList.name}").`,
    };

  } catch (error) {
    console.error("Error syncing to Alexa:", error.response?.data || error);
    if (error.response?.status === 403 || error.response?.status === 401) {
      throw new functions.https.HttpsError('permission-denied', 'Invalid Alexa Access Token. Relink account.');
    }
    throw new functions.https.HttpsError('internal', `Unable to sync to Alexa: ${error.message}`);
  }
});
