const express = require("express");
const admin = require("firebase-admin");

const app = express();
app.use(express.json());

const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;

if (!serviceAccountJson) {
  throw new Error("Missing FIREBASE_SERVICE_ACCOUNT environment variable");
}

const serviceAccount = JSON.parse(serviceAccountJson);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

app.get("/", (req, res) => {
  res.send("Vigilix backend is running");
});

app.post("/send-emergency", async (req, res) => {
  try {
    const { fcmToken, message, mapsLink } = req.body;

    if (!fcmToken) {
      return res.status(400).json({
        success: false,
        error: "Missing FCM token"
      });
    }

    const messageId = await admin.messaging().send({
      token: fcmToken,
      data: {
        alertType: "ACCIDENT",
        message: String(message || "Emergency alert!"),
        mapsLink: String(mapsLink || "")
      },
      android: {
        priority: "high"
      }
    });

    res.json({ success: true, messageId });
  } catch (error) {
    console.error("FCM send failed:", error.message);
    res.status(500).json({
      success: false,
      error: "Failed to send emergency alert"
    });
  }
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Vigilix backend running on port ${PORT}`);
});
