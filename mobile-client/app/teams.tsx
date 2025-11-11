import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { account } from "@/src/appwrite/client";
import {
  getProjects,
  updateProject,
  getProjectsByTeam,
} from "@/src/appwrite/database";
import {
  createTeam,
  getTeamMembers,
  inviteMember,
  listTeams,
  removeMember,
  enrichMemberships,
  listUsersMap,
} from "@/src/appwrite/teams";

const TeamsScreen = () => {
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);
  const [invitingTeamId, setInvitingTeamId] = useState<string | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [teamsData, setTeamsData] = useState<any[]>([]);
  const [membersByTeam, setMembersByTeam] = useState<Record<string, any[]>>(
    {}
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [showTeamsLoader, setShowTeamsLoader] = useState<boolean>(false);
  const [usersIndex, setUsersIndex] = useState<
    Record<string, { name?: string; email?: string }>
  >({});
  const [currentUser, setCurrentUser] = useState<any>(null);
  const currentUserRef = useRef<any>(null);

  const fetchAll = useCallback(async (userOverride?: any) => {
    const effectiveUser = userOverride || currentUserRef.current;
    if (!effectiveUser) return;

    try {
      const [projRes, teamRes, usersMap] = await Promise.all([
        getProjects(effectiveUser.$id).catch(() => ({ documents: [] })),
        listTeams().catch(() => ({ teams: [] })),
        listUsersMap().catch(() => ({})),
      ]);

      const teamsList =
        (teamRes as any).teams || (teamRes as any).documents || [];
      setTeamsData(teamsList);

      const safeUsersMap =
        usersMap && typeof usersMap === "object" ? usersMap : {};
      setUsersIndex(safeUsersMap);

      const membersEntries = await Promise.all(
        teamsList.map(async (team: any) => {
          try {
            const res = await getTeamMembers(team.$id);
            const rich = await enrichMemberships(
              res.memberships || [],
              effectiveUser,
              safeUsersMap
            );
            return [team.$id, rich] as const;
          } catch {
            return [team.$id, []] as const;
          }
        })
      );
      setMembersByTeam(Object.fromEntries(membersEntries));

      const teamProjects = await Promise.all(
        teamsList.map((team: any) =>
          getProjectsByTeam(team.$id).catch(() => ({ documents: [] }))
        )
      );

      const combined = [...(projRes.documents || [])];
      teamProjects.forEach((res) => {
        if (res?.documents) combined.push(...res.documents);
      });

      const uniqueProjects = Array.from(
        combined
          .reduce((acc: Map<string, any>, project: any) => {
            if (project?.$id) acc.set(project.$id, project);
            return acc;
          }, new Map<string, any>())
          .values()
      );

      setProjects(uniqueProjects);
    } catch (error: any) {
      console.warn("Failed to load teams data", error?.message || error);
      setProjects([]);
      setTeamsData([]);
      setMembersByTeam({});
      setUsersIndex({});
    }
  }, []);

  const refreshTeamMembers = useCallback(
    async (teamId: string) => {
      const effectiveUser = currentUserRef.current;
      if (!effectiveUser) return;
      try {
        const res = await getTeamMembers(teamId);
        const rich = await enrichMemberships(
          res.memberships || [],
          effectiveUser,
          usersIndex
        );
        setMembersByTeam((prev) => ({ ...prev, [teamId]: rich }));
      } catch (error: any) {
        console.warn("Failed to refresh members", error?.message || error);
      }
    },
    [usersIndex]
  );

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    (async () => {
      try {
        const user = await account.get();
        if (!isMounted) return;
        currentUserRef.current = user;
        setCurrentUser(user);
        await fetchAll(user);
      } catch (error: any) {
        if (!isMounted) return;
        console.warn("Failed to fetch account data", error?.message || error);
        setProjects([]);
        setTeamsData([]);
        setMembersByTeam({});
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [fetchAll]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    if (loading) {
      timer = setTimeout(() => setShowTeamsLoader(true), 150);
    } else {
      setShowTeamsLoader(false);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [loading]);

  const formatMemberName = useCallback(
    (member: any) => {
      if (!member) return "Невідомий користувач";
      const isOwner = (member.roles || []).includes("owner");
      const roleLabel = isOwner ? "owner" : "member";
      if (currentUser && member.userId === currentUser.$id) {
        const base = currentUser.name || currentUser.email || "Ви";
        return `${base} (${roleLabel})`;
      }
      const directoryEntry =
        (member.userId && usersIndex[member.userId]) || undefined;
      const base =
        directoryEntry?.name ||
        directoryEntry?.email ||
        member.userName ||
        member.userEmail ||
        (member.userId
          ? `Користувач ${member.userId.slice(-6)}`
          : "Невідомий користувач");
      return `${base} (${roleLabel})`;
    },
    [currentUser, usersIndex]
  );

  const projectByTeam = useMemo(() => {
    const map = new Map<string, any>();
    projects.forEach((project) => {
      if (project?.teamId) map.set(project.teamId, project);
    });
    return map;
  }, [projects]);

  const projectsWithoutTeam = useMemo(() => {
    const teamIds = new Set(teamsData.map((team) => team.$id));
    return projects
      .filter((project) => !project.teamId || !teamIds.has(project.teamId))
      .map((project) => ({ label: project.name, value: project.$id }));
  }, [projects, teamsData]);

  const teamsToRender = useMemo(() => {
    if (projectByTeam.size === 0) return teamsData;
    return teamsData.filter((team) => projectByTeam.has(team.$id));
  }, [teamsData, projectByTeam]);

  const onRefresh = async () => {
    if (!currentUserRef.current) return;
    setRefreshing(true);
    try {
      await fetchAll();
    } finally {
      setRefreshing(false);
    }
  };

  const handleCreateTeam = async () => {
    if (!selectedProject) return;
    try {
      const project = projects.find((p) => p.$id === selectedProject);
      if (!project) return;
      const team = await createTeam(project.name);
      await updateProject(project.$id, { teamId: (team as any).$id });
      setSelectedProject(null);
      setExpandedTeam((team as any).$id);
      setLoading(true);
      await fetchAll();
    } catch (error: any) {
      console.warn("Create team failed", error?.message || error);
      Alert.alert("Помилка створення команди", error?.message || "Не вдалося створити команду. Спробуйте ще раз.");
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (teamId: string) => {
    if (!inviteEmail.trim()) return;
    try {
      setInvitingTeamId(teamId);
      await inviteMember(teamId, inviteEmail.trim(), ["member"]);
      setInviteEmail("");
      await refreshTeamMembers(teamId);
      setExpandedTeam(teamId);
    } catch (error: any) {
      console.warn("Invite failed", error?.message || error);
      Alert.alert(
        "Помилка запрошення",
        error?.message || "Не вдалося запросити учасника. Перевірте email і спробуйте ще раз."
      );
    } finally {
      setInvitingTeamId(null);
    }
  };

  const handleRemove = async (teamId: string, membershipId: string) => {
    const member = (membersByTeam[teamId] || []).find(
      (m) => m.$id === membershipId
    );
    if ((member?.roles || []).includes("owner")) {
      Alert.alert("Дія недоступна", "Власника команди не можна видалити.");
      return;
    }
    try {
      await removeMember(teamId, membershipId);
      await refreshTeamMembers(teamId);
      setExpandedTeam(teamId);
    } catch (error: any) {
      console.warn("Remove member failed", error?.message || error);
      Alert.alert("Помилка видалення", error?.message || "Не вдалося видалити учасника.");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F9DEAE" }} edges={["top"]}>
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
          <Text style={styles.title}>Створити команду для проєкту</Text>
          {showTeamsLoader ? (
            <View style={{ paddingVertical: 12, minHeight: 120, justifyContent: "center" }}>
              <ActivityIndicator size="small" color="#f89c1c" />
            </View>
          ) : projectsWithoutTeam.length === 0 ? (
            <Text style={styles.mutedText}>
              Усі ваші проєкти вже мають команди.
            </Text>
          ) : (
            <>
              <Picker
                selectedValue={selectedProject}
                onValueChange={(value) => setSelectedProject(value || null)}
                style={styles.picker}
              >
                <Picker.Item label="Оберіть проєкт" value={null} />
                {projectsWithoutTeam.map((project) => (
                  <Picker.Item
                    key={project.value}
                    label={project.label}
                    value={project.value}
                  />
                ))}
              </Picker>
              <TouchableOpacity style={styles.button} onPress={handleCreateTeam}>
                <Text style={styles.buttonText}>Створити команду</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <Text style={[styles.title, { marginTop: 12 }]}>Ваші команди</Text>
        {showTeamsLoader ? (
          <View style={{ paddingVertical: 16 }}>
            <ActivityIndicator size="small" color="#f89c1c" />
          </View>
        ) : teamsToRender.length === 0 ? (
          <Text style={styles.mutedTextCenter}>
            У вас ще немає жодної команди.
          </Text>
        ) : (
          teamsToRender.map((team) => {
            const project = projectByTeam.get(team.$id);
            const members = membersByTeam[team.$id] || [];
            const sortedMembers = [...members].sort((a, b) => {
              const ao = (a.roles || []).includes("owner");
              const bo = (b.roles || []).includes("owner");
              return ao === bo ? 0 : ao ? -1 : 1;
            });
            const owner = sortedMembers.find((m) =>
              (m.roles || []).includes("owner")
            );
            const ownerLabel = owner ? formatMemberName(owner) : "—";
            const isExpanded = expandedTeam === team.$id;

            return (
              <View key={team.$id} style={styles.card}>
                <Text style={styles.cardTitle}>{team.name}</Text>
                <Text style={styles.metaText}>
                  Проєкт: {project ? project.name : "—"}
                </Text>
                <Text style={styles.metaText}>Власник: {ownerLabel}</Text>
                <TouchableOpacity
                  style={styles.manageButton}
                  onPress={() =>
                    setExpandedTeam((prev) =>
                      prev === team.$id ? null : team.$id
                    )
                  }
                >
                  <Text style={styles.manageButtonText}>
                    {isExpanded ? "Приховати" : "Керувати"}
                  </Text>
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.manageSection}>
                    <TextInput
                      placeholder="Email учасника"
                      value={inviteEmail}
                      onChangeText={setInviteEmail}
                      style={styles.input}
                      autoCapitalize="none"
                      keyboardType="email-address"
                    />
                    <TouchableOpacity
                      style={styles.greenButton}
                      onPress={() => handleInvite(team.$id)}
                      disabled={invitingTeamId === team.$id}
                    >
                      {invitingTeamId === team.$id ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.buttonText}>Запросити</Text>
                      )}
                    </TouchableOpacity>

                    <Text style={styles.sectionLabel}>Учасники</Text>
                    {sortedMembers.length === 0 ? (
                      <Text style={styles.mutedText}>
                        У команди ще немає учасників.
                      </Text>
                    ) : (
                      sortedMembers.map((member: any) => (
                        <View key={member.$id} style={styles.memberRow}>
                          <Text style={styles.memberName}>
                            {formatMemberName(member)}
                          </Text>
                          {!(member.roles || []).includes("owner") && (
                            <TouchableOpacity
                              style={styles.redButton}
                              onPress={() => handleRemove(team.$id, member.$id)}
                            >
                              <Text style={styles.buttonText}>Видалити</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      ))
                    )}
                  </View>
                )}
              </View>
            );
          })
        )}
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
  buttonText: {
    color: "#fff",
    fontWeight: "600",
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
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  manageButton: {
    backgroundColor: "#1f2937",
    padding: 8,
    borderRadius: 8,
    alignItems: "center",
    alignSelf: "flex-end",
  },
  manageButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  metaText: {
    color: "#4b5563",
    marginBottom: 4,
  },
  mutedText: {
    color: "#6b7280",
  },
  mutedTextCenter: {
    color: "#6b7280",
    textAlign: "center",
    marginTop: 12,
  },
  manageSection: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 12,
  },
  sectionLabel: {
    fontWeight: "bold",
    marginTop: 12,
    marginBottom: 4,
  },
  memberRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  memberName: {
    flex: 1,
    marginRight: 12,
    color: "#1f2937",
  },
};

export default TeamsScreen;
