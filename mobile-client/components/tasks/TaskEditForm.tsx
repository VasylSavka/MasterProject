import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { TASK_PRIORITIES, TASK_STATUS } from "@/constants/tasks";
import { TaskFormValues } from "./TaskCreateForm";

interface TaskEditFormProps {
  values: TaskFormValues;
  onChange: (changes: Partial<TaskFormValues>) => void;
  onSubmit: () => void;
  onCancel: () => void;
  loading?: boolean;
}

const TaskEditForm: React.FC<TaskEditFormProps> = ({
  values,
  onChange,
  onSubmit,
  onCancel,
  loading,
}) => {
  return (
    <View>
      <Text style={styles.sectionTitle}>Редагувати завдання</Text>
      <TextInput
        placeholder="Назва"
        value={values.title}
        onChangeText={(text) => onChange({ title: text })}
        style={styles.input}
      />
      <TextInput
        placeholder="Опис"
        value={values.description}
        onChangeText={(text) => onChange({ description: text })}
        style={[styles.input, { height: 80 }]}
        multiline
      />
      <Picker
        selectedValue={values.status}
        onValueChange={(value) => onChange({ status: value })}
        style={styles.picker}
      >
        {TASK_STATUS.map((status) => (
          <Picker.Item key={status} label={status} value={status} />
        ))}
      </Picker>
      <Picker
        selectedValue={values.priority}
        onValueChange={(value) => onChange({ priority: value })}
        style={styles.picker}
      >
        {TASK_PRIORITIES.map((priority) => (
          <Picker.Item key={priority} label={priority} value={priority} />
        ))}
      </Picker>
      <TextInput
        placeholder="Дедлайн (ДД.ММ.РРРР)"
        value={values.dueDate}
        onChangeText={(text) => onChange({ dueDate: text })}
        style={styles.input}
      />
      <View style={{ flexDirection: "row", gap: 12 }}>
        <TouchableOpacity
          style={[styles.button, { flex: 1 }]}
          onPress={onSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Зберегти</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.cancelButton, { flex: 1 }]}
          onPress={onCancel}
        >
          <Text style={styles.buttonText}>Скасувати</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = {
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    color: "#1f2937",
  },
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
  button: {
    backgroundColor: "#f97316",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "#dc2626",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
} as const;

export default TaskEditForm;
