import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import StatusBadge from "@/components/common/StatusBadge";
import { formatDateDisplay } from "@/src/utils/date";

interface ProjectOverviewCardProps {
  project: any;
  statusEditing: boolean;
  statusSaving: boolean;
  onStatusPress: () => void;
  onStatusChange: (value: string) => void;
  statusOptions: string[];
  onDelete: () => void;
  deletingProject: boolean;
}

const ProjectOverviewCard: React.FC<ProjectOverviewCardProps> = ({
  project,
  statusEditing,
  statusSaving,
  onStatusPress,
  onStatusChange,
  statusOptions,
  onDelete,
  deletingProject,
}) => {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{project.name}</Text>
      {project.description ? (
        <Text style={styles.paragraph}>{project.description}</Text>
      ) : null}
      <View style={{ marginTop: 12, gap: 8 }}>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Статус:</Text>
          {statusEditing ? (
            <Picker
              selectedValue={project.status}
              onValueChange={onStatusChange}
              style={{ flex: 1, color: "#1f2937" }}
              enabled={!statusSaving}
            >
              {statusOptions.map((status) => (
                <Picker.Item key={status} label={status} value={status} />
              ))}
            </Picker>
          ) : (
            <TouchableOpacity onPress={onStatusPress}>
              <StatusBadge status={statusSaving ? "..." : project.status} />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Початок:</Text>
          <Text style={styles.value}>{formatDateDisplay(project.startDate)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Завершення:</Text>
          <Text style={styles.value}>{formatDateDisplay(project.endDate)}</Text>
        </View>
      </View>
      <TouchableOpacity
        style={[styles.redButton, { marginTop: 16 }]}
        onPress={onDelete}
        disabled={deletingProject}
      >
        {deletingProject ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Видалити проєкт</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1f2937",
  },
  paragraph: {
    color: "#374151",
    lineHeight: 20,
    marginTop: 6,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  label: {
    color: "#6b7280",
    width: 90,
  },
  value: {
    color: "#111827",
    fontWeight: "500",
  },
  redButton: {
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
});

export default ProjectOverviewCard;
