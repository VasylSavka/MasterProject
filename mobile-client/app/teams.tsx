import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  SafeAreaView,
  FlatList,
} from "react-native";
import { Picker } from "@react-native-picker/picker";

const TeamsScreen = () => {
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [activeTeam, setActiveTeam] = useState<number | null>(null);

  // Список проектів без команд
  const availableProjects = ["Dell"];

  // Список команд
  const teams = [
    {
      id: 1,
      project: "ChatGPT",
      owner: "didko",
      members: [
        { name: "didko", role: "owner" },
        { name: "Lupan", role: "member" },
      ],
    },
    {
      id: 2,
      project: "Nvidia",
      owner: "didko",
      members: [],
    },
    {
      id: 3,
      project: "Radeon",
      owner: "didko",
      members: [],
    },
  ];

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000); // Можна замінити на реальний fetch
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{
          padding: 20,
          paddingBottom: 100,
          backgroundColor: "#F9DEAE",
        }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Створення команди */}
        <View style={styles.card}>
          <Text style={styles.title}>Створити команду для проекту</Text>

          {availableProjects.length === 0 ? (
            <Text style={{ marginTop: 8 }}>Немає проєктів без команди</Text>
          ) : (
            <>
              <Picker
                selectedValue={selectedProject}
                onValueChange={setSelectedProject}
                style={styles.picker}
              >
                <Picker.Item label="Оберіть проект" value={null} />
                {availableProjects.map((project) => (
                  <Picker.Item key={project} label={project} value={project} />
                ))}
              </Picker>
              <TouchableOpacity style={styles.button}>
                <Text style={{ color: "#fff", fontWeight: "bold" }}>
                  Створити
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Список команд */}
        {teams.map((team) => (
          <View key={team.id} style={styles.card}>
            <Text style={styles.cardTitle}>{team.project}</Text>
            <Text>Власник: {team.owner} (owner)</Text>
            <Text style={{ marginBottom: 8 }}>Проєкт: {team.project}</Text>

            <TouchableOpacity
              style={styles.manageButton}
              onPress={() =>
                setActiveTeam((prev) => (prev === team.id ? null : team.id))
              }
            >
              <Text style={{ color: "#fff" }}>
                {activeTeam === team.id ? "Закрити" : "Керувати"}
              </Text>
            </TouchableOpacity>

            {activeTeam === team.id && (
              <View style={{ marginTop: 12 }}>
                <TextInput
                  placeholder="Email користувача"
                  value={email}
                  onChangeText={setEmail}
                  style={styles.input}
                />
                <TouchableOpacity style={styles.greenButton}>
                  <Text style={{ color: "#fff" }}>Запросити</Text>
                </TouchableOpacity>

                <Text style={{ fontWeight: "bold", marginTop: 12 }}>
                  Учасники:
                </Text>
                {team.members.map((member, index) => (
                  <View
                    key={index}
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      backgroundColor: "#f5f5f5",
                      padding: 8,
                      borderRadius: 8,
                      marginTop: 6,
                    }}
                  >
                    <Text>
                      {member.name} ({member.role})
                    </Text>
                    {member.role !== "owner" && (
                      <TouchableOpacity style={styles.redButton}>
                        <Text style={{ color: "#fff" }}>Видалити</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = {
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
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  picker: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    marginBottom: 8,
  },
  button: {
    backgroundColor: "#f89c1c",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  input: {
    backgroundColor: "#f5f5f5",
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  greenButton: {
    backgroundColor: "#28a745",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  redButton: {
    backgroundColor: "#dc3545",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  manageButton: {
    backgroundColor: "#1f2937",
    padding: 8,
    borderRadius: 8,
    alignItems: "center",
    alignSelf: "flex-end",
  },
};

export default TeamsScreen;
