import { Slot, useRouter, useSegments } from "expo-router";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";

export default function Layout() {
  const segments = useSegments();
  const router = useRouter();

  // Dummy auth logic
  useEffect(() => {
    if (segments[0] !== "(auth)") {
      // if not logged in -> redirect
    }
  }, [segments]);

  const handleLogout = () => {
    router.replace("/auth/login");
  };

  return (
    <View style={{ flex: 1 }}>
      <Slot />
      <View style={styles.navBar}>
        <TouchableOpacity
          onPress={() => router.push("/dashboard")}
          style={styles.navItem}
        >
          <Ionicons name="home-outline" size={20} color="#007aff" />
          <Text style={styles.navText}>Dashboard</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push("/teams")}
          style={styles.navItem}
        >
          <Ionicons name="people-outline" size={20} color="#007aff" />
          <Text style={styles.navText}>Teams</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleLogout} style={styles.navItem}>
          <Ionicons name="log-out-outline" size={20} color="#ff3b30" />
          <Text style={[styles.navText, { color: "#ff3b30" }]}>Вийти</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  navBar: {
    flexDirection: "row",
    height: 64,
    borderTopWidth: 1,
    borderColor: "#ccc",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  navItem: {
    alignItems: "center",
  },
  navText: {
    fontSize: 12,
    marginTop: 2,
    color: "#1f2937",
  },
});
