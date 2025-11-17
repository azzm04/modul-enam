// sensor-simulator/index.js - FINAL WORKING VERSION
import mqtt from "mqtt";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const MQTT_BROKER = process.env.MQTT_BROKER || "mqtt://broker.hivemq.com";
const TOPIC = process.env.MQTT_TOPIC || "ppb/kel24/iot/temperature";
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";
const DEVICE_API_KEY = process.env.DEVICE_API_KEY;
const THRESHOLD_CHECK_INTERVAL = 5000;

// Validate configuration
if (!DEVICE_API_KEY) {
  console.error("❌ ERROR: DEVICE_API_KEY not found in .env file!");
  console.error("Please add: DEVICE_API_KEY=your-key-here");
  process.exit(1);
}

let currentThreshold = 30;

// Connect to MQTT broker
const client = mqtt.connect(MQTT_BROKER);

client.on("connect", () => {
  console.log(`✅ Connected to MQTT broker: ${MQTT_BROKER}`);
  console.log(`📡 Publishing to topic: ${TOPIC}`);
  console.log(`🔗 Backend API: ${BACKEND_URL}`);
  console.log(`🔑 Using Device API Key: ${DEVICE_API_KEY.substring(0, 10)}...`);
  console.log("");
  
  startSimulation();
  startThresholdChecker();
});

client.on("error", (err) => {
  console.error("❌ MQTT connection error:", err);
});

// Fetch current threshold from backend
async function fetchCurrentThreshold() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/thresholds/latest`);
    if (response.ok) {
      const data = await response.json();
      if (data && data.value !== undefined) {
        currentThreshold = data.value;
        console.log(`📊 Current threshold updated: ${currentThreshold}°C`);
      }
    }
  } catch (error) {
    console.error("⚠️ Failed to fetch threshold:", error.message);
  }
}

// Check threshold periodically
function startThresholdChecker() {
  fetchCurrentThreshold();
  setInterval(fetchCurrentThreshold, THRESHOLD_CHECK_INTERVAL);
}

// Generate random temperature
function generateTemperature() {
  return (Math.random() * 20 + 20).toFixed(2);
}

// Save reading to backend if threshold exceeded
async function saveReading(temperature, timestamp, thresholdValue) {
  const url = `${BACKEND_URL}/api/readings`;
  const headers = {
    "Content-Type": "application/json",
    "X-Device-API-Key": DEVICE_API_KEY,
  };
  
  console.log(`🔍 Saving to: ${url}`);
  console.log(`🔍 Headers:`, headers);
  
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify({
        temperature: parseFloat(temperature),
        timestamp: timestamp,
        threshold_value: parseFloat(thresholdValue),
      }),
    });

    const responseText = await response.text();
    console.log(`📥 Response status: ${response.status}`);
    console.log(`📥 Response body: ${responseText}`);

    if (!response.ok) {
      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch {
        errorData = { message: responseText };
      }
      throw new Error(`HTTP ${response.status}: ${JSON.stringify(errorData)}`);
    }

    console.log(`💾 ✅ Saved to database: ${temperature}°C (threshold: ${thresholdValue}°C)`);
    return JSON.parse(responseText);
  } catch (error) {
    console.error("❌ Failed to save reading:", error.message);
    throw error;
  }
}

// Send notification
async function sendNotification(temperature, threshold) {
  const url = `${BACKEND_URL}/api/notifications/send`;
  const headers = {
    "Content-Type": "application/json",
    "X-Device-API-Key": DEVICE_API_KEY,
  };
  
  console.log(`🔍 Sending notification to: ${url}`);
  
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify({
        title: "🚨 Temperature Alert!",
        body: `Temperature ${temperature}°C exceeded threshold ${threshold}°C`,
        data: { temperature, threshold, timestamp: new Date().toISOString() },
      }),
    });

    const responseText = await response.text();
    console.log(`📥 Notification response: ${response.status} - ${responseText}`);

    if (!response.ok) {
      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch {
        errorData = { message: responseText };
      }
      throw new Error(`HTTP ${response.status}: ${JSON.stringify(errorData)}`);
    }

    console.log(`🔔 ✅ Notification sent: ${temperature}°C > ${threshold}°C`);
    return JSON.parse(responseText);
  } catch (error) {
    console.error("❌ Failed to send notification:", error.message);
    throw error;
  }
}

// Main simulation loop
function startSimulation() {
  setInterval(async () => {
    const temperature = parseFloat(generateTemperature());
    const timestamp = new Date().toISOString();

    const payload = {
      temperature,
      timestamp,
    };

    // Publish to MQTT
    client.publish(TOPIC, JSON.stringify(payload), (err) => {
      if (err) {
        console.error("❌ Failed to publish:", err);
      } else {
        console.log(`📡 Published ${JSON.stringify(payload)} to ${TOPIC}`);
      }
    });

    // Check threshold and save if exceeded
    if (temperature > currentThreshold) {
      console.log(`⚠️ ALERT: Temperature ${temperature}°C exceeds threshold ${currentThreshold}°C`);
      console.log("");
      
      try {
        await saveReading(temperature, timestamp, currentThreshold);
        await sendNotification(temperature, currentThreshold);
        console.log("✅ Alert processing completed");
      } catch (error) {
        console.error("❌ Alert processing failed");
      }
      console.log("");
    }
  }, 5000);
}

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n👋 Shutting down sensor simulator...");
  client.end();
  process.exit();
});

console.log("🚀 Sensor Simulator Starting...");