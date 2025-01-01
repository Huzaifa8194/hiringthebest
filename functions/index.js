const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

exports.setCustomUserClaims = functions.auth.user().onCreate(async (user) => {
  const uid = user.uid;

  // Fetch user role from Firestore
  const userDoc = await admin.firestore().collection("Users").doc(uid).get();
  const userData = userDoc.data();

  if (userData && userData.role) {
    const role = userData.role;

    // Set custom claims based on the role
    await admin.auth().setCustomUserClaims(uid, { role });
  }
});
