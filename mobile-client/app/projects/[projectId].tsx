import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
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
  createTeam,
  getTeamMembers,
  inviteMember,
  enrichMemberships,
  removeMember,
} from "@/src/appwrite/teams";
import { TASK_PRIORITIES, TASK_STATUS } from "@/constants/tasks";
import ProjectOverviewCard from "@/components/projects/ProjectOverviewCard";
import TaskCreateForm, { TaskFormValues } from "@/components/tasks/TaskCreateForm";
import TaskEditForm from "@/components/tasks/TaskEditForm";
import TaskFiltersPanel from "@/components/tasks/TaskFiltersPanel";
import TaskList from "@/components/tasks/TaskList";
import TeamSection from "@/components/projects/TeamSection";
import { formatDateInput, parseDateInputToISO } from "@/src/utils/date";
import { showErrorToast, showSuccessToast } from "@/src/utils/toast";

const emptyTask: TaskFormValues = {
  title: "",
  description: "",
  status: TASK_STATUS[0],
  priority: TASK_PRIORITIES[1],
  dueDate: "",
};

const PROJECT_STATUS_OPTIONS = ["active", "on_hold", "completed"];

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
  const [newTask, setNewTask] = useState<TaskFormValues>({ ...emptyTask });
  const [taskSubmitting, setTaskSubmitting] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<TaskFormValues>({ ...emptyTask });
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
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);

  const updateNewTask = (changes: Partial<TaskFormValues>) =>
    setNewTask((prev) => ({ ...prev, ...changes }));
  const updateEditingTask = (changes: Partial<TaskFormValues>) =>
    setEditingTask((prev) => ({ ...prev, ...changes }));

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

  const loadTasks = useCallback(async (id: string) => {
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
  }, []);

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
          const priorityOrder: Record<string, number> = {
            low: 0,
            medium: 1,
            high: 2,
            critical: 3,
          };
          const aPriority =
            priorityOrder[(a.priority || "").toLowerCase()] ?? 0;
          const bPriority =
            priorityOrder[(b.priority || "").toLowerCase()] ?? 0;
          return bPriority - aPriority;
        }
        const aCreated = new Date(a.$createdAt || 0).getTime();
        const bCreated = new Date(b.$createdAt || 0).getTime();
        return bCreated - aCreated;
      });
    return filtered;
  }, [tasks, filterStatus, filterPriority, debouncedSearch, sortBy]);

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
      showSuccessToast("Статус змінено", `Новий статус: ${nextStatus}`);
    } catch (error: any) {
      showErrorToast(
        "Не вдалося змінити статус",
        error?.message || "Спробуйте ще раз"
      );
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
              showSuccessToast("Проєкт видалено");
              router.replace("/dashboard");
            } catch (error: any) {
              showErrorToast(
                "Не вдалося видалити проєкт",
                error?.message || "Спробуйте ще раз"
              );
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
      const dueDatePayload = parseDateInputToISO(newTask.dueDate);
      await createTask({
        ...newTask,
        projectId: project.$id,
        assigneeId: currentUser?.$id,
        createdBy: currentUser?.$id,
        dueDate: dueDatePayload,
      });
      setNewTask({ ...emptyTask });
      await loadTasks(project.$id);
      showSuccessToast("Завдання створено", newTask.title || undefined);
    } catch (error: any) {
      showErrorToast(
        "Не вдалося створити завдання",
        error?.message || "Спробуйте ще раз"
      );
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
      dueDate: formatDateInput(task.dueDate),
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
      const dueDatePayload = parseDateInputToISO(editingTask.dueDate);
      await updateTaskApi(editingTaskId, {
        ...editingTask,
        dueDate: dueDatePayload,
      });
      await loadTasks(project.$id);
      setEditingTaskId(null);
      setEditingTask({ ...emptyTask });
      showSuccessToast("Завдання оновлено");
    } catch (error: any) {
      showErrorToast(
        "Не вдалося оновити завдання",
        error?.message || "Спробуйте ще раз"
      );
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
              showSuccessToast("Завдання видалено");
            } catch (error: any) {
              showErrorToast(
                "Не вдалося видалити завдання",
                error?.message || "Спробуйте ще раз"
              );
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
      showSuccessToast("Команду створено");
    } catch (error: any) {
      showErrorToast(
        "Не вдалося створити команду",
        error?.message || "Спробуйте ще раз"
      );
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
      showSuccessToast("Запрошення надіслано");
    } catch (error: any) {
      showErrorToast(
        "Не вдалося запросити учасника",
        error?.message || "Перевірте email та спробуйте ще раз"
      );
    } finally {
      setTeamAction(null);
    }
  };

  const handleRemoveMember = async (memberId: string, isOwner: boolean) => {
    if (!project?.teamId || isOwner) return;
    setRemovingMemberId(memberId);
    try {
      await removeMember(project.teamId, memberId);
      await loadTeamMembers(project.teamId);
      showSuccessToast("Учасника видалено");
    } catch (error: any) {
      showErrorToast(
        "Не вдалося видалити учасника",
        error?.message || "Спробуйте ще раз"
      );
    } finally {
      setRemovingMemberId(null);
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

        <ProjectOverviewCard
          project={project}
          statusEditing={statusEditing}
          statusSaving={statusSaving}
          onStatusPress={() => setStatusEditing(true)}
          onStatusChange={handleStatusChange}
          statusOptions={PROJECT_STATUS_OPTIONS}
          onDelete={handleDeleteProject}
          deletingProject={deletingProject}
        />

        <View style={styles.card}>
          <TaskCreateForm
            values={newTask}
            onChange={updateNewTask}
            onSubmit={handleCreateTask}
            loading={taskSubmitting}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Пошук і фільтри</Text>
          <TaskFiltersPanel
            search={search}
            onSearchChange={setSearch}
            searching={searchingTasks}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            filterPriority={filterPriority}
            setFilterPriority={setFilterPriority}
            sortBy={sortBy}
            setSortBy={setSortBy}
          />
        </View>

        {editingTaskId && (
          <View style={styles.card}>
            <TaskEditForm
              values={editingTask}
              onChange={updateEditingTask}
              onSubmit={handleUpdateTask}
              onCancel={() => {
                setEditingTaskId(null);
                setEditingTask({ ...emptyTask });
              }}
              loading={taskUpdating}
            />
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Завдання</Text>
          {tasksLoading ? (
            <View style={{ paddingVertical: 12 }}>
              <ActivityIndicator size="small" color="#f89c1c" />
            </View>
          ) : (
            <TaskList
              tasks={filteredTasks}
              onEdit={startEditingTask}
              onDelete={handleDeleteTask}
              deletingTaskId={taskDeletingId}
            />
          )}
        </View>

        <View style={styles.card}>
          <TeamSection
            teamId={project.teamId}
            teamMembers={teamMembers}
            teamLoading={teamLoading}
            inviteEmail={teamInviteEmail}
            onInviteEmailChange={setTeamInviteEmail}
            onCreateTeam={handleCreateTeamForProject}
            onInvite={handleInviteToTeam}
            teamAction={teamAction}
            onRemoveMember={handleRemoveMember}
            removingMemberId={removingMemberId}
            formatMemberName={formatMemberName}
          />
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
  },
  button: {
    backgroundColor: "#f97316",
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

export default ProjectDetailScreen;
