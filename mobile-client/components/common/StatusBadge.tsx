import React from "react";
import { Text, View, StyleProp, ViewStyle, TextStyle } from "react-native";
import { getStatusColors } from "@/src/utils/status";

interface StatusBadgeProps {
  status?: string | null;
  label?: string;
  containerStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  containerStyle,
  textStyle,
}) => {
  const { backgroundColor, textColor } = getStatusColors(status || undefined);
  const display = label || status || "—";

  return (
    <View
      style={[
        {
          backgroundColor,
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: 999,
        },
        containerStyle,
      ]}
    >
      <Text
        style={[
          { color: textColor, fontWeight: "600", fontSize: 12 },
          textStyle,
        ]}
      >
        {display}
      </Text>
    </View>
  );
};

export default StatusBadge;
