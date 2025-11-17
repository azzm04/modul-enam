import express from "express";

const router = express.Router();

router.post("/", async (req, res) => {
  const { token, title, message } = req.body;

  if (!token) {
    return res.status(400).json({ error: "Token notifikasi tidak ditemukan" });
  }

  try {
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: token,
        sound: "default",
        title,
        body: message,
      }),
    });

    if (!response.ok) {
      throw new Error(`Expo push error ${response.status}`);
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Push notification error:", error.message);
    res.status(500).json({ error: "Gagal mengirim notifikasi" });
  }
});

export default router;
