import React from "react";
import { View, TextInput, ActivityIndicator, Text } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { TASK_PRIORITIES, TASK_STATUS } from "@/constants/tasks";

interface TaskFiltersPanelProps {
  search: string;
  onSearchChange: (value: string) => void;
  searching: boolean;
  filterStatus: string;
  setFilterStatus: (value: string) => void;
  filterPriority: string;
  setFilterPriority: (value: string) => void;
  sortBy: string;
  setSortBy: (value: string) => void;
}

const TaskFiltersPanel: React.FC<TaskFiltersPanelProps> = ({
  search,
  onSearchChange,
  searching,
  filterStatus,
  setFilterStatus,
  filterPriority,
  setFilterPriority,
  sortBy,
  setSortBy,
}) => {
  return (
    <View>
      <TextInput
        placeholder="Пошук завдань"
        value={search}
        onChangeText={onSearchChange}
        style={styles.input}
      />
      {searching && (
        <View style={{ alignItems: "flex-start", marginBottom: 8 }}>
          <ActivityIndicator size="small" color="#f89c1c" />
        </View>
      )}
      <Picker
        selectedValue={filterStatus}
        onValueChange={setFilterStatus}
        style={styles.picker}
      >
        <Picker.Item label="Всі статуси" value="all" />
        {TASK_STATUS.map((status) => (
          <Picker.Item key={status} label={status} value={status} />
        ))}
      </Picker>
      <Picker
        selectedValue={filterPriority}
        onValueChange={setFilterPriority}
        style={styles.picker}
      >
        <Picker.Item label="Всі пріоритети" value="all" />
        {TASK_PRIORITIES.map((priority) => (
          <Picker.Item key={priority} label={priority} value={priority} />
        ))}
      </Picker>
      <Picker selectedValue={sortBy} onValueChange={setSortBy} style={styles.picker}>
        <Picker.Item label="За створенням" value="created" />
        <Picker.Item label="За дедлайном" value="deadline" />
        <Picker.Item label="За пріоритетом" value="priority" />
      </Picker>
    </View>
  );
};

const styles = {
  input: {
    backgroundColor: "#f5f5f5",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  picker: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    marginBottom: 10,
  },
} as const;

export default TaskFiltersPanel;
