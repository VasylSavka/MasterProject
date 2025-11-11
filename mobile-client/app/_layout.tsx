import { Slot, useRouter, useSegments, usePathname } from "expo-router";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { useEffect, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { account } from "@/src/appwrite/client";

export default function Layout() {
  const segments = useSegments();
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthed, setIsAuthed] = useState<boolean>(false);
  const initialRedirectDone = useRef<boolean>(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await account.get();
        if (!mounted) return;
        setIsAuthed(true);
        if (!initialRedirectDone.current) {
          router.replace("/dashboard");
          initialRedirectDone.current = true;
        } else if (pathname?.startsWith("/auth")) {
          router.replace("/dashboard");
        }
      } catch {
        if (!mounted) return;
        setIsAuthed(false);
        if (!pathname?.startsWith("/auth")) router.replace("/auth/login");
      } finally {
      }
    })();
    return () => {
      mounted = false;
    };
  }, [segments.join("/")]);

  const handleLogout = async () => {
    try {
      await account.deleteSession("current");
    } catch {}
    setIsAuthed(false);
    router.replace("/auth/login");
  };

  return (
    <View style={{ flex: 1 }}>
      <Slot />
      {!pathname?.startsWith("/auth") && (
        <View style={styles.navBar}>
          {(() => {
            const active = pathname?.startsWith("/dashboard");
            return (
              <TouchableOpacity
                onPress={() => router.push("/dashboard")}
                style={styles.navItem}
              >
                <Ionicons
                  name={active ? "home" : "home-outline"}
                  size={20}
                  color={active ? "#0ea5e9" : "#6b7280"}
                />
                <Text style={[styles.navText, active && styles.activeText]}>
                  Dashboard
                </Text>
              </TouchableOpacity>
            );
          })()}
          {(() => {
            const active = pathname?.startsWith("/teams");
            return (
              <TouchableOpacity
                onPress={() => router.push("/teams")}
                style={styles.navItem}
              >
                <Ionicons
                  name={active ? "people" : "people-outline"}
                  size={20}
                  color={active ? "#0ea5e9" : "#6b7280"}
                />
                <Text style={[styles.navText, active && styles.activeText]}>
                  Teams
                </Text>
              </TouchableOpacity>
            );
          })()}
          <TouchableOpacity onPress={handleLogout} style={styles.navItem}>
            <Ionicons name="log-out-outline" size={20} color="#ff3b30" />
            <Text style={[styles.navText, { color: "#ff3b30" }]}>Вийти</Text>
          </TouchableOpacity>
        </View>
      )}
      <Toast position="bottom" />
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
  activeText: {
    color: "#0ea5e9",
    fontWeight: "600",
  },
});
