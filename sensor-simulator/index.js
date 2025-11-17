import mqtt from "mqtt";
import dotenv from "dotenv";

dotenv.config();

const BROKER_URL = "mqtt://broker.hivemq.com:1883";
const TOPIC = "ppb/kel24/iot/temperature";
const BACKEND_BASE_URL = "http://localhost:5000";
const PUBLISH_INTERVAL_MS = 5000;

// Ganti token ini dengan Expo Push Token perangkat kamu
// (bisa didapat dari app React Native menggunakan expo-notifications)
const EXPO_PUSH_TOKEN = "ExponentPushToken[DoPwVLGiDwAfdEeJJsVPTx]";

// Optional shared API key for authenticating with the backend
const SENSOR_API_KEY = process.env.SENSOR_API_KEY || null;

const clientId = `simulator-${Math.random().toString(16).slice(2)}`;
const client = mqtt.connect(BROKER_URL, {
  clientId,
  clean: true,
  reconnectPeriod: 5000,
});

client.on("connect", () => {
  console.log(`✅ MQTT connected as ${clientId}`);
});

client.on("reconnect", () => {
  console.log("♻️ Reconnecting to MQTT broker...");
});

client.on("error", (error) => {
  console.error("❌ MQTT error:", error.message);
});

async function fetchLatestThreshold() {
  try {
    const response = await fetch(`${BACKEND_BASE_URL}/api/thresholds/latest`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return data?.value ?? null;
  } catch (error) {
    console.error("⚠️ Failed to fetch threshold:", error.message);
    return null;
  }
}

async function publishLoop() {
  let latestThreshold = await fetchLatestThreshold();

  setInterval(async () => {
    const temperature = Number((Math.random() * 15 + 20).toFixed(2));
    const payload = JSON.stringify({
      temperature,
      timestamp: new Date().toISOString(),
    });

    // Publikasi suhu ke MQTT
    client.publish(TOPIC, payload, { qos: 0 }, (error) => {
      if (error) {
        console.error("Failed to publish temperature:", error.message);
      } else {
        console.log(`📡 Published ${payload} to ${TOPIC}`);
      }
    });

    // Ambil threshold baru kadang-kadang (simulasi dinamis)
    if (latestThreshold === null || Math.random() < 0.2) {
      latestThreshold = await fetchLatestThreshold();
    }

    // Cek apakah suhu melampaui ambang batas
    if (typeof latestThreshold === "number" && temperature >= latestThreshold) {
      try {
        // Simpan data ke backend (sudah ada)
        const readingsHeaders = {
          "Content-Type": "application/json",
          ...(SENSOR_API_KEY && { "x-api-key": SENSOR_API_KEY }),
        };

        const response = await fetch(`${BACKEND_BASE_URL}/api/readings`, {
          method: "POST",
          headers: readingsHeaders,
          body: JSON.stringify({
            temperature,
            threshold_value: latestThreshold,
          }),
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(`HTTP ${response.status}: ${text}`);
        }

        console.log(
          `🔥 Saved triggered reading ${temperature}°C (threshold ${latestThreshold}°C)`
        );

        // Kirim notifikasi ke backend untuk diteruskan ke Expo API
        const notifHeaders = {
          "Content-Type": "application/json",
          ...(SENSOR_API_KEY && { "x-api-key": SENSOR_API_KEY }),
        };

        await fetch(`${BACKEND_BASE_URL}/api/notifications`, {
          method: "POST",
          headers: notifHeaders,
          body: JSON.stringify({
            token: EXPO_PUSH_TOKEN,
            title: "⚠️ Suhu Melebihi Batas!",
            message: `Suhu ${temperature}°C melampaui ambang ${latestThreshold}°C.`,
          }),
        });

        console.log("📨 Notification request sent to backend");
      } catch (error) {
        console.error("❌ Failed to save or notify:", error.message);
      }
    }
  }, PUBLISH_INTERVAL_MS);
}

publishLoop().catch((error) => {
  console.error("🚫 Simulator failed to start:", error.message);
  process.exit(1);
});
