import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import StatusBadge from "@/components/common/StatusBadge";
import { formatDateDisplay } from "@/src/utils/date";

interface TaskListProps {
  tasks: any[];
  onEdit: (task: any) => void;
  onDelete: (taskId: string) => void;
  deletingTaskId: string | null;
}

const priorityColors: Record<string, string> = {
  low: "#22d3ee",
  medium: "#f97316",
  high: "#ef4444",
  critical: "#b91c1c",
};

const TaskList: React.FC<TaskListProps> = ({
  tasks,
  onEdit,
  onDelete,
  deletingTaskId,
}) => {
  if (tasks.length === 0) {
    return <Text style={styles.emptyText}>Немає завдань за вибраними критеріями.</Text>;
  }

  return (
    <>
      {tasks.map((task) => {
        const priority = (task.priority || "").toLowerCase();
        const priorityColor =
          priorityColors[priority] || priorityColors.medium;
        const isDeleting = deletingTaskId === task.$id;
        return (
          <View key={task.$id} style={styles.taskCard}>
            <View style={styles.taskHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{task.title}</Text>
                {task.description ? (
                  <Text style={styles.description}>{task.description}</Text>
                ) : null}
              </View>
              <View style={styles.tags}>
                <StatusBadge status={task.status} />
                <View
                  style={[
                    styles.priorityTag,
                    { backgroundColor: priorityColor },
                  ]}
                >
                  <Text style={styles.priorityText}>
                    {task.priority || "medium"}
                  </Text>
                </View>
              </View>
            </View>
            <Text style={styles.meta}>
              Дедлайн: {formatDateDisplay(task.dueDate)}
            </Text>
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: "#f97316" }]}
                onPress={() => onEdit(task)}
              >
                <Text style={styles.buttonText}>Редагувати</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: "#dc2626" }]}
                onPress={() => onDelete(task.$id)}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Видалити</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        );
      })}
    </>
  );
};

const styles = StyleSheet.create({
  taskCard: {
    backgroundColor: "#f9fafb",
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
  },
  taskHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  title: {
    fontWeight: "600",
    fontSize: 16,
    color: "#1f2937",
  },
  description: {
    color: "#374151",
    marginTop: 4,
  },
  tags: {
    alignItems: "flex-end",
    gap: 6,
  },
  priorityTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  priorityText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 12,
  },
  meta: {
    color: "#4b5563",
    marginTop: 8,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
  emptyText: {
    color: "#6b7280",
  },
});

export default TaskList;
