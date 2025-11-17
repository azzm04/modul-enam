import { useCallback, useState, useEffect, useRef } from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Switch,
  Dimensions,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useMqttSensor } from "../hooks/useMqttSensor.js";
import { useNotifications } from "../hooks/useNotifications.js";
import { Api } from "../services/api.js";
import { DataTable } from "../components/DataTable.js";
import { Pagination } from "../components/Pagination.js";
import { SafeAreaView } from "react-native-safe-area-context";
import { LineChart } from "react-native-chart-kit";

const screenWidth = Dimensions.get("window").width;
const ITEMS_PER_PAGE = 10; // Show 10 items per page

export function MonitoringScreen() {
  const {
    temperature,
    timestamp,
    connectionState,
    error: mqttError,
  } = useMqttSensor();
  const { sendLocalNotification, expoPushToken } = useNotifications();

  const [readings, setReadings] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [currentThreshold, setCurrentThreshold] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const previousTemperature = useRef(null);

  // === Ambil threshold saat ini ===
  const fetchCurrentThreshold = useCallback(async () => {
    try {
      const thresholds = await Api.getThresholds();
      if (thresholds && thresholds.length > 0) {
        setCurrentThreshold(thresholds[0].value);
      }
    } catch (err) {
      console.error("Failed to fetch threshold:", err);
    }
  }, []);

  // === Ambil data histori dari API ===
  const fetchReadings = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      const data = await Api.getSensorReadings();
      setReadings(data ?? []);
      
      // Calculate total pages
      const total = Math.ceil((data?.length || 0) / ITEMS_PER_PAGE);
      setTotalPages(total || 1);
      
      // Reset to page 1 if current page exceeds total
      if (currentPage > total && total > 0) {
        setCurrentPage(1);
      }
    } catch (err) {
      setApiError(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  useFocusEffect(
    useCallback(() => {
      fetchReadings();
      fetchCurrentThreshold();
    }, [fetchReadings, fetchCurrentThreshold])
  );

  // === Kirim notifikasi saat ada pembaruan suhu ===
  useEffect(() => {
    if (
      notificationsEnabled &&
      temperature !== null &&
      previousTemperature.current !== temperature
    ) {
      sendLocalNotification(
        "📊 Temperature Update",
        `New reading: ${temperature.toFixed(2)}°C`,
        { temperature, timestamp }
      );

      if (currentThreshold !== null && temperature > currentThreshold) {
        sendLocalNotification(
          "🚨 Temperature Alert!",
          `Temperature ${temperature.toFixed(
            2
          )}°C exceeded threshold ${currentThreshold.toFixed(2)}°C`,
          {
            temperature,
            threshold: currentThreshold,
            timestamp,
            alert: true,
          }
        );
      }

      previousTemperature.current = temperature;
    }
  }, [
    temperature,
    notificationsEnabled,
    currentThreshold,
    sendLocalNotification,
    timestamp,
  ]);

  // === Realtime Chart Data (max 10 titik) ===
  useEffect(() => {
    if (typeof temperature === "number") {
      setChartData((prevData) => {
        const newData = [
          ...prevData,
          {
            temperature,
            timestamp: new Date(timestamp || Date.now()).toLocaleTimeString(
              [],
              {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              }
            ),
          },
        ];
        if (newData.length > 10) newData.shift();
        return newData;
      });
    }
  }, [temperature, timestamp]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchReadings();
      await fetchCurrentThreshold();
    } finally {
      setRefreshing(false);
    }
  }, [fetchReadings, fetchCurrentThreshold]);

  // === Pagination Logic ===
  const paginatedData = useCallback(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return readings.slice(startIndex, endIndex);
  }, [readings, currentPage]);

  const handlePageChange = useCallback((newPage) => {
    setCurrentPage(newPage);
  }, []);

  // === Konfigurasi Chart ===
  const chartConfig = {
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    decimalPlaces: 2,
    style: {
      borderRadius: 12,
    },
    propsForDots: {
      r: "4",
      strokeWidth: "2",
      stroke: "#2563eb",
    },
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* === Card Realtime Temperature === */}
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Realtime Temperature</Text>
            <View style={styles.notificationToggle}>
              <Text style={styles.toggleLabel}>🔔</Text>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: "#d0d0d0", true: "#2563eb" }}
                thumbColor={notificationsEnabled ? "#fff" : "#f4f4f4"}
              />
            </View>
          </View>

          <View style={styles.valueRow}>
            <Text style={styles.temperatureText}>
              {typeof temperature === "number"
                ? `${temperature.toFixed(2)}°C`
                : "--"}
            </Text>
          </View>

          {currentThreshold !== null && (
            <View style={styles.thresholdInfo}>
              <Text style={styles.thresholdText}>
                Threshold: {currentThreshold.toFixed(2)}°C
              </Text>
              {temperature !== null && temperature > currentThreshold && (
                <Text style={styles.alertText}>⚠️ Above Threshold!</Text>
              )}
            </View>
          )}

          <Text style={styles.metaText}>MQTT status: {connectionState}</Text>
          {timestamp && (
            <Text style={styles.metaText}>
              Last update: {new Date(timestamp).toLocaleString()}
            </Text>
          )}
          {mqttError && (
            <Text style={styles.errorText}>MQTT error: {mqttError}</Text>
          )}
        </View>

        {/* === Realtime Chart === */}
        {chartData.length > 0 && (
          <View style={styles.chartContainer}>
            <Text style={styles.sectionTitle}>Realtime Temperature Trend</Text>
            <LineChart
              data={{
                labels: chartData.map((d) => d.timestamp),
                datasets: [
                  {
                    data: chartData.map((d) => d.temperature),
                    color: (opacity = 1) => `rgba(255, 99, 71, ${opacity})`,
                    strokeWidth: 2,
                  },
                  currentThreshold
                    ? {
                        data: chartData.map(() => currentThreshold),
                        color: (opacity = 1) => `rgba(0, 102, 255, ${opacity})`,
                        strokeWidth: 2,
                      }
                    : null,
                ].filter(Boolean),
                legend: ["Temperature", "Threshold"],
              }}
              width={screenWidth * 0.9}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={{ borderRadius: 12 }}
            />
          </View>
        )}

        {/* === Tabel History === */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Triggered Readings History</Text>
          {loading && <ActivityIndicator />}
        </View>
        
        {apiError && (
          <Text style={styles.errorText}>
            Failed to load history: {apiError}
          </Text>
        )}
        
        {readings.length === 0 && !loading ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No readings available</Text>
          </View>
        ) : (
          <>
            <DataTable
              columns={[
                {
                  key: "recorded_at",
                  title: "Timestamp",
                  render: (value) =>
                    value ? new Date(value).toLocaleString() : "--",
                },
                {
                  key: "temperature",
                  title: "Temperature (°C)",
                  render: (value) =>
                    typeof value === "number"
                      ? `${Number(value).toFixed(2)}`
                      : "--",
                },
                {
                  key: "threshold_value",
                  title: "Threshold (°C)",
                  render: (value) =>
                    typeof value === "number"
                      ? `${Number(value).toFixed(2)}`
                      : "--",
                },
              ]}
              data={paginatedData()}
              keyExtractor={(item) => item.id}
            />

            {/* Pagination Component */}
            {readings.length > ITEMS_PER_PAGE && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                itemsPerPage={ITEMS_PER_PAGE}
                totalItems={readings.length}
              />
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fb", padding: 16 },
  card: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: { fontSize: 18, fontWeight: "600" },
  notificationToggle: { flexDirection: "row", alignItems: "center", gap: 8 },
  toggleLabel: { fontSize: 16 },
  valueRow: { flexDirection: "row", alignItems: "flex-end" },
  temperatureText: { fontSize: 48, fontWeight: "700", color: "#ff7a59" },
  thresholdInfo: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#f0f9ff",
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#2563eb",
  },
  thresholdText: { fontSize: 14, fontWeight: "600", color: "#1e40af" },
  alertText: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: "600",
    color: "#dc2626",
  },
  metaText: { marginTop: 8, color: "#555" },
  errorText: { marginTop: 8, color: "#c82333" },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: "600", marginBottom: 8 },
  chartContainer: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
  },
  emptyState: {
    backgroundColor: "#fff",
    padding: 40,
    borderRadius: 12,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
  },
});