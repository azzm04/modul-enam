// backend/src/controllers/notificationsController.js
import fetch from "node-fetch";

export const NotificationsController = {
  async send(req, res) {
    try {
      const { token, title, body, message, data } = req.body;

      // If no token provided (e.g., from IoT device), return success without sending
      if (!token) {
        console.log("ℹ️ No push token provided - skipping notification");
        return res.json({ 
          success: true,
          skipped: true,
          message: "No push token provided - notification skipped"
        });
      }

      const notificationTitle = title || "IOTWatch Notification";
      const notificationBody = body || message || "New notification";

      // Send to Expo Push Notification Service
      const response = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          to: token,
          sound: "default",
          title: notificationTitle,
          body: notificationBody,
          data: data || {},
          priority: "high",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Expo push error ${response.status}: ${JSON.stringify(errorData)}`);
      }

      const result = await response.json();

      // Log for debugging
      console.log("📤 Notification sent:", {
        to: token.substring(0, 20) + "...",
        title: notificationTitle,
        status: result.data?.[0]?.status || "sent",
      });

      res.json({ 
        success: true,
        result,
        message: "Notification sent successfully"
      });
    } catch (error) {
      console.error("❌ Push notification error:", error.message);
      res.status(500).json({ 
        error: "Failed to send notification",
        message: error.message 
      });
    }
  },
};