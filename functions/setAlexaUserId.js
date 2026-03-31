process.env.FIREBASE_TOKEN = "1//01Hg4nn-wyF1mCgYIARAAGAESNgF-L9IrmwZm8sSXyCFwhxlcftLkU-psXq2-KfE2-yAkP_fOfo9T2HSMCpVjeWGCjPSS7vn6Pg";

const admin = require("firebase-admin");
const { GoogleAuth } = require("google-auth-library");

admin.initializeApp({
  projectId: "family-meal-planner-b1421",
});

process.env.GOOGLE_CLOUD_PROJECT = "family-meal-planner-b1421";

const db = admin.firestore();
db.settings({ databaseId: "(default)" });

db.collection("families")
  .doc("XBgbknjMV4gmF4qhFqIAKAVQ0bH3")
  .update({
    alexaUserId: "amzn1.ask.account.AMASXGRQS4OY7QOGZQNPELO3JZH4YSW7TKKTRHYKELIFDC6YK42FJT363W77QY3Z57TX4HIBVXJPYR2AMJ6WBGA7RUUNGOEKI3X2KUIXKALLK5HVE3OLDEBAE6WIO4QGMHAQORG7BS2JXNEPZ6GMIPTT7RAQ3PEFK5UQ6TN6W62CLNEOYI5LBEZAHMX3HYOG5PLDTGKQ67VNUYLNPZOU4LD5SWQ4YDZQBNMXQRHJH4",
  })
  .then(() => {
    console.log("alexaUserId set successfully");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Error:", err.message);
    process.exit(1);
  });