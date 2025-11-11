import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";

interface TeamSectionProps {
  teamId?: string | null;
  teamMembers: any[];
  teamLoading: boolean;
  inviteEmail: string;
  onInviteEmailChange: (value: string) => void;
  onCreateTeam: () => void;
  onInvite: () => void;
  teamAction: "create" | "invite" | null;
  onRemoveMember: (memberId: string, isOwner: boolean) => void;
  removingMemberId: string | null;
  formatMemberName: (member: any) => string;
}

const TeamSection: React.FC<TeamSectionProps> = ({
  teamId,
  teamMembers,
  teamLoading,
  inviteEmail,
  onInviteEmailChange,
  onCreateTeam,
  onInvite,
  teamAction,
  onRemoveMember,
  removingMemberId,
  formatMemberName,
}) => {
  return (
    <View>
      <Text style={styles.sectionTitle}>Команда проєкту</Text>
      {!teamId ? (
        <>
          <Text style={styles.paragraph}>
            У цього проєкту поки немає команди. Створіть її, щоб запрошувати учасників.
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={onCreateTeam}
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
          <Text style={styles.metaText}>ID команди: {teamId}</Text>
          <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
            <TextInput
              placeholder="Email учасника"
              value={inviteEmail}
              onChangeText={onInviteEmailChange}
              style={[styles.input, { flex: 1 }]}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TouchableOpacity
              style={[styles.button, { flex: 0.6 }]}
              onPress={onInvite}
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
            teamMembers.map((member: any) => {
              const isOwner = (member.roles || []).includes("owner");
              const removing = removingMemberId === member.$id;
              return (
                <View key={member.$id} style={styles.memberRow}>
                  <Text style={styles.memberName}>{formatMemberName(member)}</Text>
                  {!isOwner && (
                    <TouchableOpacity
                      style={[styles.redButton, styles.memberButton]}
                      onPress={() => onRemoveMember(member.$id, isOwner)}
                      disabled={removing}
                    >
                      {removing ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.buttonText}>Видалити</Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              );
            })
          )}
        </>
      )}
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
  paragraph: {
    color: "#374151",
    lineHeight: 20,
    marginBottom: 12,
  },
  metaText: {
    color: "#4b5563",
    marginTop: 6,
  },
  input: {
    backgroundColor: "#f5f5f5",
    padding: 10,
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
  mutedText: {
    color: "#6b7280",
  },
  memberRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  memberName: {
    color: "#1f2937",
  },
  memberButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
} as const;

export default TeamSection;
