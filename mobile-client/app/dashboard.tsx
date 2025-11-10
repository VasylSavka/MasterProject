import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  RefreshControl,
  SafeAreaView,
} from "react-native";
import { Picker } from "@react-native-picker/picker";

const DashboardScreen = () => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("active");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [refreshing, setRefreshing] = useState(false);

  const user = {
    name: "Vasyl",
    avatar: require("../assets/images/avatar.png"),
  };

  const projects = [
    {
      id: 1,
      name: "Radeon",
      description: "new videocards",
      status: "active",
      start: "06.11.2025",
      end: null,
    },
    {
      id: 2,
      name: "Nvidia",
      description: "new videocard",
      status: "on hold",
      start: "05.11.2025",
      end: null,
    },
  ];

  const filteredProjects = projects
    .filter(
      (p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase())
    )
    .filter((p) => filterStatus === "all" || p.status === filterStatus)
    .sort((a, b) => (sortOrder === "newest" ? b.id - a.id : a.id - b.id));

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000); // Заміни на реальний fetch
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Image
        source={require("../assets/images/hero-login.png")}
        style={{ position: "absolute", width: "100%", height: "100%" }}
        resizeMode="cover"
      />

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Форма створення нового проекту */}
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
            <Picker.Item label="done" value="done" />
          </Picker>

          {/* Початок і кінець на новому рядку */}
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

          <TouchableOpacity style={styles.button}>
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
              <Picker.Item label="Статус: всі" value="all" />
              <Picker.Item label="active" value="active" />
              <Picker.Item label="on hold" value="on hold" />
              <Picker.Item label="done" value="done" />
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

        {/* Список проектів */}
        {filteredProjects.map((project) => (
          <TouchableOpacity key={project.id} style={styles.card}>
            <Text style={styles.cardTitle}>{project.name}</Text>
            <Text>{project.description}</Text>
            <Text>Статус: {project.status}</Text>
            <Text>
              Початок: {project.start} | Кінець: {project.end || "—"}
            </Text>
          </TouchableOpacity>
        ))}
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
};

export default DashboardScreen;
