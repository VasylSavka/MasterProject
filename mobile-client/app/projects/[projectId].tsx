import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Picker } from "@react-native-picker/picker";
import { account } from "@/src/appwrite/client";
import {
  getProjectById,
  updateProject,
  deleteProject as deleteProjectApi,
} from "@/src/appwrite/database";
import {
  getTasks,
  createTask,
  updateTask as updateTaskApi,
  deleteTask as deleteTaskApi,
} from "@/src/appwrite/tasks";
import {
  TASK_PRIORITIES,
  TASK_STATUS,
  PRIORITY_ORDER,
} from "@/constants/tasks";
import {
  createTeam,
  getTeamMembers,
  inviteMember,
  enrichMemberships,
} from "@/src/appwrite/teams";

const emptyTask = {
  title: "",
  description: "",
  status: TASK_STATUS[0],
  priority: TASK_PRIORITIES[1],
  dueDate: "",
};

const PROJECT_STATUS_OPTIONS = ["active", "on_hold", "completed"];

const getStatusColors = (status?: string) => {
  switch (status) {
    case "active":
      return { backgroundColor: "#16a34a", textColor: "#fff" };
    case "on_hold":
      return { backgroundColor: "#ca8a04", textColor: "#fff" };
    case "completed":
    case "archived":
      return { backgroundColor: "#4b5563", textColor: "#fff" };
    default:
      return { backgroundColor: "#e5e7eb", textColor: "#111827" };
  }
};

const ProjectDetailScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ projectId?: string | string[] }>();
  const projectIdParam = Array.isArray(params.projectId)
    ? params.projectId[0]
    : params.projectId;

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [project, setProject] = useState<any | null>(null);
  const [projectLoading, setProjectLoading] = useState(true);
  const [projectError, setProjectError] = useState<string | null>(null);
  const [statusEditing, setStatusEditing] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);
  const [deletingProject, setDeletingProject] = useState(false);

  const [tasks, setTasks] = useState<any[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [newTask, setNewTask] = useState({ ...emptyTask });
  const [taskSubmitting, setTaskSubmitting] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState({ ...emptyTask });
  const [taskUpdating, setTaskUpdating] = useState(false);
  const [taskDeletingId, setTaskDeletingId] = useState<string | null>(null);

  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [sortBy, setSortBy] = useState("created");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchingTasks, setSearchingTasks] = useState(false);

  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [teamInviteEmail, setTeamInviteEmail] = useState("");
  const [teamAction, setTeamAction] = useState<"create" | "invite" | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const user = await account.get();
        if (mounted) setCurrentUser(user);
      } catch {
        setCurrentUser(null);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const loadProject = useCallback(async () => {
    if (!projectIdParam) {
      setProjectError("Не вказано ідентифікатор проєкту");
      setProject(null);
      setProjectLoading(false);
      return;
    }
    setProjectLoading(true);
    setProjectError(null);
    try {
      const doc = await getProjectById(projectIdParam);
      setProject(doc);
    } catch (error: any) {
      setProject(null);
      setProjectError(
        error?.message || "Не вдалося завантажити інформацію про проєкт"
      );
    } finally {
      setProjectLoading(false);
    }
  }, [projectIdParam]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  const loadTasks = useCallback(
    async (id: string) => {
      setTasksLoading(true);
      try {
        const res = await getTasks(id);
        setTasks(res.documents || []);
      } catch (error: any) {
        console.warn("Failed to load tasks", error?.message || error);
        setTasks([]);
      } finally {
        setTasksLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (project?.$id) {
      loadTasks(project.$id);
    }
  }, [project?.$id, loadTasks]);

  const loadTeamMembers = useCallback(
    async (teamId: string) => {
      setTeamLoading(true);
      try {
        const res = await getTeamMembers(teamId);
        const enriched = await enrichMemberships(
          res.memberships || [],
          currentUser || undefined
        );
        setTeamMembers(enriched);
      } catch (error: any) {
        console.warn("Failed to load team members", error?.message || error);
        setTeamMembers([]);
      } finally {
        setTeamLoading(false);
      }
    },
    [currentUser]
  );

  useEffect(() => {
    if (project?.teamId) {
      loadTeamMembers(project.teamId);
    } else {
      setTeamMembers([]);
    }
  }, [project?.teamId, loadTeamMembers]);

  useEffect(() => {
    setSearchingTasks(true);
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setSearchingTasks(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, [search]);

  const filteredTasks = useMemo(() => {
    const base = Array.isArray(tasks) ? tasks : [];
    const term = debouncedSearch.trim().toLowerCase();
    const filtered = base
      .filter((task) => {
        if (filterStatus === "all") return true;
        return (task.status || "").toLowerCase() === filterStatus;
      })
      .filter((task) => {
        if (filterPriority === "all") return true;
        return (task.priority || "").toLowerCase() === filterPriority;
      })
      .filter((task) => {
        if (!term) return true;
        const title = (task.title || "").toLowerCase();
        const description = (task.description || "").toLowerCase();
        return title.includes(term) || description.includes(term);
      })
      .sort((a, b) => {
        if (sortBy === "deadline") {
          const aDate = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
          const bDate = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
          return aDate - bDate;
        }
        if (sortBy === "priority") {
          const aPriority = PRIORITY_ORDER[(a.priority || "").toLowerCase()] || 0;
          const bPriority = PRIORITY_ORDER[(b.priority || "").toLowerCase()] || 0;
          return bPriority - aPriority;
        }
        const aCreated = new Date(a.$createdAt || 0).getTime();
        const bCreated = new Date(b.$createdAt || 0).getTime();
        return bCreated - aCreated;
      });
    return filtered;
  }, [tasks, filterStatus, filterPriority, debouncedSearch, sortBy]);

  const formatDateDisplay = (value?: string | null) => {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
  };

  const formatDateForInput = (value?: string | null) => {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
  };

  const parseDateInput = (value?: string | null) => {
    if (!value) return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (/^\d{2}\.\d{2}\.\d{4}$/.test(trimmed)) {
      const [dd, mm, yyyy] = trimmed.split(".").map((part) => parseInt(part, 10));
      const date = new Date(yyyy, mm - 1, dd);
      if (!Number.isNaN(date.getTime())) {
        return date.toISOString();
      }
    }
    const fallback = new Date(trimmed);
    if (!Number.isNaN(fallback.getTime())) {
      return fallback.toISOString();
    }
    return null;
  };

  const formatMemberName = (member: any) => {
    if (!member) return "Невідомий учасник";
    const isOwner = (member.roles || []).includes("owner");
    const base =
      member.userName ||
      member.userEmail ||
      (member.userId ? `Користувач ${member.userId.slice(-6)}` : "Невідомий учасник");
    return `${base}${isOwner ? " (owner)" : ""}`;
  };

  const handleStatusChange = async (nextStatus: string) => {
    if (!project || !PROJECT_STATUS_OPTIONS.includes(nextStatus)) return;
    setStatusSaving(true);
    try {
      await updateProject(project.$id, { status: nextStatus });
      setProject((prev) => (prev ? { ...prev, status: nextStatus } : prev));
    } catch (error: any) {
      Alert.alert("Помилка", error?.message || "Не вдалося змінити статус проєкту");
    } finally {
      setStatusSaving(false);
      setStatusEditing(false);
    }
  };

  const handleDeleteProject = () => {
    if (!project) return;
    Alert.alert(
      "Видалити проєкт?",
      "Цю дію не можна скасувати.",
      [
        { text: "Скасувати", style: "cancel" },
        {
          text: "Видалити",
          style: "destructive",
          onPress: async () => {
            setDeletingProject(true);
            try {
              await deleteProjectApi(project.$id);
              router.replace("/dashboard");
            } catch (error: any) {
              Alert.alert("Помилка", error?.message || "Не вдалося видалити проєкт");
            } finally {
              setDeletingProject(false);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleCreateTask = async () => {
    if (!project?.$id || !newTask.title.trim()) {
      Alert.alert("Увага", "Додайте назву завдання");
      return;
    }
    setTaskSubmitting(true);
    try {
      const dueDatePayload = parseDateInput(newTask.dueDate);
      await createTask({
        ...newTask,
        projectId: project.$id,
        assigneeId: currentUser?.$id,
        createdBy: currentUser?.$id,
        dueDate: dueDatePayload,
      });
      setNewTask({ ...emptyTask });
      await loadTasks(project.$id);
    } catch (error: any) {
      Alert.alert("Помилка", error?.message || "Не вдалося створити завдання");
    } finally {
      setTaskSubmitting(false);
    }
  };

  const startEditingTask = (task: any) => {
    setEditingTaskId(task.$id);
    setEditingTask({
      title: task.title || "",
      description: task.description || "",
      status: (task.status || TASK_STATUS[0]) as string,
      priority: (task.priority || TASK_PRIORITIES[1]) as string,
      dueDate: formatDateForInput(task.dueDate),
    });
  };

  const handleUpdateTask = async () => {
    if (!editingTaskId || !project?.$id) return;
    if (!editingTask.title.trim()) {
      Alert.alert("Увага", "Назва не може бути порожньою");
      return;
    }
    setTaskUpdating(true);
    try {
      const dueDatePayload = parseDateInput(editingTask.dueDate);
      await updateTaskApi(editingTaskId, {
        ...editingTask,
        dueDate: dueDatePayload,
      });
      await loadTasks(project.$id);
      setEditingTaskId(null);
      setEditingTask({ ...emptyTask });
    } catch (error: any) {
      Alert.alert("Помилка", error?.message || "Не вдалося оновити завдання");
    } finally {
      setTaskUpdating(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!project?.$id) return;
    Alert.alert(
      "Видалити завдання?",
      "Дію не можна скасувати.",
      [
        { text: "Скасувати", style: "cancel" },
        {
          text: "Видалити",
          style: "destructive",
          onPress: async () => {
            setTaskDeletingId(taskId);
            try {
              await deleteTaskApi(taskId);
              await loadTasks(project.$id!);
            } catch (error: any) {
              Alert.alert("Помилка", error?.message || "Не вдалося видалити завдання");
            } finally {
              setTaskDeletingId(null);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleCreateTeamForProject = async () => {
    if (!project) return;
    setTeamAction("create");
    try {
      const team = await createTeam(project.name || "Project team");
      await updateProject(project.$id, { teamId: (team as any).$id });
      setProject((prev) =>
        prev ? { ...prev, teamId: (team as any).$id } : prev
      );
      await loadTeamMembers((team as any).$id);
    } catch (error: any) {
      Alert.alert("Помилка", error?.message || "Не вдалося створити команду");
    } finally {
      setTeamAction(null);
    }
  };

  const handleInviteToTeam = async () => {
    if (!project?.teamId || !teamInviteEmail.trim()) return;
    setTeamAction("invite");
    try {
      await inviteMember(project.teamId, teamInviteEmail.trim(), ["member"]);
      setTeamInviteEmail("");
      await loadTeamMembers(project.teamId);
    } catch (error: any) {
      Alert.alert("Помилка", error?.message || "Не вдалося надіслати запрошення");
    } finally {
      setTeamAction(null);
    }
  };

  if (projectLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#F9DEAE" }}>
        <Image
          source={require("../../assets/images/hero-login.png")}
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
          resizeMode="cover"
        />
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="#f89c1c" />
        </View>
      </SafeAreaView>
    );
  }

  if (!project) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#F9DEAE" }}>
        <Image
          source={require("../../assets/images/hero-login.png")}
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
          resizeMode="cover"
        />
        <View style={{ flex: 1, justifyContent: "center", padding: 24 }}>
          <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>
            {projectError || "Проєкт не знайдено"}
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.replace("/dashboard")}
          >
            <Text style={styles.buttonText}>Повернутися на Dashboard</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentStatusColors = getStatusColors(project.status);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F9DEAE" }} edges={["top"]}>
      <Image
        source={require("../../assets/images/hero-login.png")}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        resizeMode="cover"
      />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 12 }}>
          <Text style={{ color: "#f97316", fontWeight: "bold" }}>← Назад</Text>
        </TouchableOpacity>

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
                  onValueChange={(value) => handleStatusChange(value)}
                  style={{ flex: 1, color: "#1f2937" }}
                  enabled={!statusSaving}
                >
                  {PROJECT_STATUS_OPTIONS.map((status) => (
                    <Picker.Item key={status} label={status} value={status} />
                  ))}
                </Picker>
              ) : (
                <TouchableOpacity
                  onPress={() => setStatusEditing(true)}
                  style={[
                    styles.statusPill,
                    { backgroundColor: currentStatusColors.backgroundColor },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      { color: currentStatusColors.textColor },
                    ]}
                  >
                    {statusSaving ? "Збереження..." : project.status}
                  </Text>
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
            onPress={handleDeleteProject}
            disabled={deletingProject}
          >
            {deletingProject ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Видалити проєкт</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Створити завдання</Text>
          <TextInput
            placeholder="Назва"
            value={newTask.title}
            onChangeText={(text) => setNewTask((prev) => ({ ...prev, title: text }))}
            style={styles.input}
          />
          <TextInput
            placeholder="Опис"
            value={newTask.description}
            onChangeText={(text) =>
              setNewTask((prev) => ({ ...prev, description: text }))
            }
            style={[styles.input, { height: 80 }]}
            multiline
          />
          <Picker
            selectedValue={newTask.status}
            onValueChange={(value) => setNewTask((prev) => ({ ...prev, status: value }))}
            style={styles.picker}
          >
            {TASK_STATUS.map((status) => (
              <Picker.Item key={status} label={status} value={status} />
            ))}
          </Picker>
          <Picker
            selectedValue={newTask.priority}
            onValueChange={(value) =>
              setNewTask((prev) => ({ ...prev, priority: value }))
            }
            style={styles.picker}
          >
            {TASK_PRIORITIES.map((priority) => (
              <Picker.Item key={priority} label={priority} value={priority} />
            ))}
          </Picker>
          <TextInput
            placeholder="Дедлайн (ДД.ММ.РРРР)"
            value={newTask.dueDate}
            onChangeText={(text) => setNewTask((prev) => ({ ...prev, dueDate: text }))}
            style={styles.input}
          />
          <TouchableOpacity
            style={styles.button}
            onPress={handleCreateTask}
            disabled={taskSubmitting}
          >
            {taskSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Додати завдання</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Пошук і фільтри</Text>
          <TextInput
            placeholder="Пошук завдань"
            value={search}
            onChangeText={setSearch}
            style={styles.input}
          />
          {searchingTasks && (
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
          <Picker
            selectedValue={sortBy}
            onValueChange={setSortBy}
            style={styles.picker}
          >
            <Picker.Item label="За створенням" value="created" />
            <Picker.Item label="За дедлайном" value="deadline" />
            <Picker.Item label="За пріоритетом" value="priority" />
          </Picker>
        </View>

        {editingTaskId && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Редагувати завдання</Text>
            <TextInput
              placeholder="Назва"
              value={editingTask.title}
              onChangeText={(text) =>
                setEditingTask((prev) => ({ ...prev, title: text }))
              }
              style={styles.input}
            />
            <TextInput
              placeholder="Опис"
              value={editingTask.description}
              onChangeText={(text) =>
                setEditingTask((prev) => ({ ...prev, description: text }))
              }
              style={[styles.input, { height: 80 }]}
              multiline
            />
            <Picker
              selectedValue={editingTask.status}
              onValueChange={(value) =>
                setEditingTask((prev) => ({ ...prev, status: value }))
              }
              style={styles.picker}
            >
              {TASK_STATUS.map((status) => (
                <Picker.Item key={status} label={status} value={status} />
              ))}
            </Picker>
            <Picker
              selectedValue={editingTask.priority}
              onValueChange={(value) =>
                setEditingTask((prev) => ({ ...prev, priority: value }))
              }
              style={styles.picker}
            >
              {TASK_PRIORITIES.map((priority) => (
                <Picker.Item key={priority} label={priority} value={priority} />
              ))}
            </Picker>
            <TextInput
              placeholder="Дедлайн (ДД.ММ.РРРР)"
              value={editingTask.dueDate}
              onChangeText={(text) =>
                setEditingTask((prev) => ({ ...prev, dueDate: text }))
              }
              style={styles.input}
            />
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                style={[styles.button, { flex: 1 }]}
                onPress={handleUpdateTask}
                disabled={taskUpdating}
              >
                {taskUpdating ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Зберегти</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.redButton, { flex: 1 }]}
                onPress={() => {
                  setEditingTaskId(null);
                  setEditingTask({ ...emptyTask });
                }}
              >
                <Text style={styles.buttonText}>Скасувати</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Завдання</Text>
          {tasksLoading ? (
            <View style={{ paddingVertical: 12 }}>
              <ActivityIndicator size="small" color="#f89c1c" />
            </View>
          ) : filteredTasks.length === 0 ? (
            <Text style={styles.mutedText}>Немає завдань за вибраними критеріями.</Text>
          ) : (
            filteredTasks.map((task) => (
              <View key={task.$id} style={styles.taskCard}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{task.title}</Text>
                    {task.description ? (
                      <Text style={styles.paragraph}>{task.description}</Text>
                    ) : null}
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={styles.tag}>{task.status}</Text>
                    <Text style={[styles.tag, { marginTop: 4 }]}>
                      {task.priority}
                    </Text>
                  </View>
                </View>
                <Text style={styles.metaText}>
                  Дедлайн: {formatDateDisplay(task.dueDate)}
                </Text>
                <View style={{ flexDirection: "row", gap: 12, marginTop: 8 }}>
                  <TouchableOpacity
                    style={[styles.button, { flex: 1 }]}
                    onPress={() => startEditingTask(task)}
                  >
                    <Text style={styles.buttonText}>Редагувати</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.redButton, { flex: 1 }]}
                    onPress={() => handleDeleteTask(task.$id)}
                    disabled={taskDeletingId === task.$id}
                  >
                    {taskDeletingId === task.$id ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.buttonText}>Видалити</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Команда проєкту</Text>
          {!project.teamId ? (
            <>
              <Text style={styles.paragraph}>
                У цього проєкту поки немає команди. Створіть її, щоб запрошувати
                учасників.
              </Text>
              <TouchableOpacity
                style={styles.button}
                onPress={handleCreateTeamForProject}
                disabled={teamAction === "create"}
              >
                {teamAction === "create" ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Створити команду</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.metaText}>ID команди: {project.teamId}</Text>
              <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
                <TextInput
                  placeholder="Email учасника"
                  value={teamInviteEmail}
                  onChangeText={setTeamInviteEmail}
                  style={[styles.input, { flex: 1 }]}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
                <TouchableOpacity
                  style={[styles.button, { flex: 0.6 }]}
                  onPress={handleInviteToTeam}
                  disabled={teamAction === "invite"}
                >
                  {teamAction === "invite" ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Запросити</Text>
                  )}
                </TouchableOpacity>
              </View>
              {teamLoading ? (
                <View style={{ paddingVertical: 12 }}>
                  <ActivityIndicator size="small" color="#f89c1c" />
                </View>
              ) : teamMembers.length === 0 ? (
                <Text style={styles.mutedText}>Ще немає учасників.</Text>
              ) : (
                teamMembers.map((member) => (
                  <View key={member.$id} style={styles.memberRow}>
                    <Text style={styles.memberName}>{formatMemberName(member)}</Text>
                  </View>
                ))
              )}
            </>
          )}
        </View>
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
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1f2937",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    color: "#1f2937",
  },
  cardTitle: {
    fontWeight: "600",
    fontSize: 16,
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
  metaText: {
    color: "#4b5563",
    marginTop: 6,
  },
  mutedText: {
    color: "#6b7280",
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#e5e7eb",
  },
  statusText: {
    color: "#111827",
    fontWeight: "600",
  },
  tag: {
    backgroundColor: "#e5e7eb",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    color: "#111827",
    fontSize: 12,
  },
  taskCard: {
    backgroundColor: "#f9fafb",
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
  },
  memberRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  memberName: {
    color: "#1f2937",
  },
};

export default ProjectDetailScreen;
