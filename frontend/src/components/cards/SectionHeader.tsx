import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

type Props = {
  title: string;
  action?: string;
  onPress?: () => void;
};

export default function SectionHeader({
  title,
  action = "See All",
  onPress,
}: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>

      <TouchableOpacity onPress={onPress}>
        <Text style={styles.action}>{action}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 18,
  },

  title: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "700",
  },

  action: {
    color: "#5EA6FF",
    fontWeight: "600",
  },
});
