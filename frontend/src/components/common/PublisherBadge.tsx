import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

type Props = {
  publisher: string;
  website: string;
  verified?: boolean;
};

export default function PublisherBadge({
  publisher,
  website,
  verified = false,
}: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.logo}>
        <Text style={styles.logoText}>
          {publisher.charAt(0).toUpperCase()}
        </Text>
      </View>

      <View style={styles.info}>
        <View style={styles.row}>
          <Text numberOfLines={1} style={styles.publisher}>
            {publisher}
          </Text>

          {verified && (
            <MaterialCommunityIcons
              name="check-decagram"
              size={14}
              color="#1D9BF0"
              style={styles.icon}
            />
          )}
        </View>

        <Text numberOfLines={1} style={styles.website}>
          {website}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
  },

  logo: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#E8EEF7",
    justifyContent: "center",
    alignItems: "center",
  },

  logoText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
  },

  info: {
    flex: 1,
    marginLeft: 10,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
  },

  publisher: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  icon: {
    marginLeft: 4,
  },

  website: {
    marginTop: 2,
    fontSize: 12,
    color: "#94A3B8",
  },
});
