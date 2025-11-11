import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Picker } from "@react-native-picker/picker";
import { account } from "@/src/appwrite/client";
import { createProject, getProjects } from "@/src/appwrite/database";
import { showErrorToast, showSuccessToast } from "@/src/utils/toast";
import { useRouter } from "expo-router";

const getStatusColors = (status?: string) => {
  switch (status) {
    case "active":
      return { backgroundColor: "#16a34a", textColor: "#fff" };
    case "on_hold":
      return { backgroundColor: "#ca8a04", textColor: "#fff" };
    case "completed":
    case "archived":
    case "done":
      return { backgroundColor: "#4b5563", textColor: "#fff" };
    default:
      return { backgroundColor: "#e5e7eb", textColor: "#111827" };
  }
};

const DashboardScreen = () => {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("active");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [refreshing, setRefreshing] = useState(false);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [showListLoader, setShowListLoader] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searching, setSearching] = useState(false);

  const [userId, setUserId] = useState<string | null>(null);
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const u = await account.get();
        setUserId(u.$id);
        setProjectsLoading(true);
        const res = await getProjects(u.$id);
        setProjects(res.documents || []);
      } catch {
        setProjects([]);
      } finally {
        setProjectsLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    let t: any;
    if (projectsLoading) {
      t = setTimeout(() => setShowListLoader(true), 150);
    } else {
      setShowListLoader(false);
    }
    return () => t && clearTimeout(t);
  }, [projectsLoading]);

  useEffect(() => {
    setSearching(true);
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setSearching(false);
    }, 1200);
    return () => clearTimeout(t);
  }, [search]);

  const filteredProjects = useMemo(() => {
    const items = Array.isArray(projects) ? projects : [];
    const prepared = items
      .filter((p) => {
        const n = (p.name || "").toLowerCase();
        const d = (p.description || "").toLowerCase();
        return (
          n.includes(debouncedSearch.toLowerCase()) ||
          d.includes(debouncedSearch.toLowerCase())
        );
      })
      .filter((p) => {
        const mapFilter = (val: string) =>
          val === "on hold" ? "on_hold" : val === "done" ? "archived" : val;
        return (
          filterStatus === "all" || (p.status || "") === mapFilter(filterStatus)
        );
      })
      .sort((a: any, b: any) => {
        const aid = a.$createdAt || a.$id || 0;
        const bid = b.$createdAt || b.$id || 0;
        return sortOrder === "newest"
          ? aid < bid
            ? 1
            : -1
          : aid > bid
          ? 1
          : -1;
      });
    return prepared;
  }, [projects, debouncedSearch, filterStatus, sortOrder]);

  const onRefresh = async () => {
    if (!userId) return;
    setRefreshing(true);
    try {
      setProjectsLoading(true);
      const res = await getProjects(userId);
      setProjects(res.documents || []);
    } finally {
      setProjectsLoading(false);
      setRefreshing(false);
    }
  };

  const parseDate = (val: string | undefined) => {
    if (!val) return null;
    const trimmed = val.trim();
    if (!trimmed) return null;
    if (/^\d{2}\.\d{2}\.\d{4}$/.test(trimmed)) {
      const [dd, mm, yyyy] = trimmed.split(".").map((v) => parseInt(v, 10));
      const d = new Date(yyyy, mm - 1, dd);
      return isNaN(d.getTime()) ? null : d;
    }
    const d = new Date(trimmed);
    return isNaN(d.getTime()) ? null : d;
  };

  const handleCreate = async () => {
    if (!userId || !name.trim()) return;
    const s = parseDate(startDate) || new Date();
    const e = parseDate(endDate);
    const payload = {
      name: name.trim(),
      description: description.trim() || undefined,
      status:
        status === "on hold"
          ? "on_hold"
          : status === "done"
          ? "archived"
          : status,
      startDate: s.toISOString(),
      endDate: e ? e.toISOString() : undefined,
      managerId: userId,
    } as any;
    try {
      await createProject(payload);
      setName("");
      setDescription("");
      setStatus("active");
      setStartDate("");
      setEndDate("");
      await onRefresh();
      showSuccessToast("Проєкт створено", `${payload.name} додано до списку`);
    } catch (error: any) {
      showErrorToast(
        "Не вдалося створити проєкт",
        error?.message || "Перевірте дані та спробуйте ще раз"
      );
    }
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#F9DEAE" }}
      edges={["top"]}
    >
      <Image
        source={require("../assets/images/hero-login.png")}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        resizeMode="cover"
      />

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.card}>
          <Text style={styles.title}>Створити новий проект</Text>

          <TextInput
            placeholder="Назва"
            value={name}
            onChangeText={setName}
            style={styles.input}
          />
          <TextInput
            placeholder="Опис (необов’язково)"
            value={description}
            onChangeText={setDescription}
            style={styles.input}
          />

          <Text>Статус</Text>
          <Picker
            selectedValue={status}
            onValueChange={setStatus}
            style={styles.picker}
          >
            <Picker.Item label="active" value="active" />
            <Picker.Item label="on hold" value="on hold" />
            <Picker.Item label="completed" value="completed" />
          </Picker>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              gap: 8,
            }}
          >
            <TextInput
              value={startDate}
              onChangeText={setStartDate}
              placeholder="дд.мм.рррр"
              style={[styles.input, { flex: 1 }]}
            />
            <TextInput
              value={endDate}
              onChangeText={setEndDate}
              placeholder="дд.мм.рррр"
              style={[styles.input, { flex: 1 }]}
            />
          </View>

          <TouchableOpacity style={styles.button} onPress={handleCreate}>
            <Text style={{ color: "#fff", fontWeight: "bold" }}>
              Додати проект
            </Text>
          </TouchableOpacity>

          <Text style={{ textAlign: "center", marginVertical: 8 }}>
            Пошук проекту…
          </Text>

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Введіть текст"
            style={styles.input}
          />

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              gap: 8,
            }}
          >
            <Picker
              selectedValue={filterStatus}
              onValueChange={setFilterStatus}
              style={[styles.picker, { flex: 1 }]}
            >
              <Picker.Item label="all" value="all" />
              <Picker.Item label="active" value="active" />
              <Picker.Item label="on hold" value="on hold" />
              <Picker.Item label="completed" value="completed" />
            </Picker>

            <Picker
              selectedValue={sortOrder}
              onValueChange={setSortOrder}
              style={[styles.picker, { flex: 1 }]}
            >
              <Picker.Item label="новіші" value="newest" />
              <Picker.Item label="старіші" value="oldest" />
            </Picker>
          </View>
        </View>

        {showListLoader || searching ? (
          <View style={{ paddingVertical: 16 }}>
            <ActivityIndicator size="small" color="#f89c1c" />
          </View>
        ) : filteredProjects.length === 0 ? (
          <Text style={{ color: "#1f2937" }}>Проєктів не знайдено</Text>
        ) : (
          filteredProjects.map((project: any) => {
            const statusLabel =
              project.status === "on_hold"
                ? "on hold"
                : project.status === "archived"
                ? "done"
                : project.status;
            const start = project.startDate
              ? new Date(project.startDate).toLocaleDateString()
              : "—";
            const end = project.endDate
              ? new Date(project.endDate).toLocaleDateString()
              : "—";
            return (
              <TouchableOpacity
                key={project.$id}
                style={styles.card}
                onPress={() => router.push(`/projects/${project.$id}`)}
              >
                <Text style={styles.cardTitle}>{project.name}</Text>
                {project.description ? (
                  <Text>{project.description}</Text>
                ) : null}
                {(() => {
                  const statusColors = getStatusColors(project.status);
                  return (
                    <View style={styles.statusRow}>
                      <Text style={styles.statusLabel}>Статус:</Text>
                      <View
                        style={[
                          styles.statusPill,
                          { backgroundColor: statusColors.backgroundColor },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            { color: statusColors.textColor },
                          ]}
                        >
                          {statusLabel}
                        </Text>
                      </View>
                    </View>
                  );
                })()}
                <Text>
                  Початок: {start} | Кінець: {end}
                </Text>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = {
  input: {
    backgroundColor: "#f5f5f5",
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
    marginTop: 4,
  },
  picker: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    marginBottom: 8,
    marginTop: 4,
  },
  button: {
    backgroundColor: "#f89c1c",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginVertical: 12,
  },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  cardTitle: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginVertical: 6,
  },
  statusLabel: {
    color: "#4b5563",
  },
  statusPill: {
    backgroundColor: "#e5e7eb",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusText: {
    color: "#111827",
    fontWeight: "600",
  },
};

export default DashboardScreen;
