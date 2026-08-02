import React from "react";
import {
  View,
  ActivityIndicator,
  Text,
  StyleSheet,
} from "react-native";

type Props = {
  title?: string;
};

export default function LoadingState({
  title = "Loading...",
}: Props) {
  return (
    <View style={styles.container}>

      <ActivityIndicator
        size="large"
        color="#2563EB"
      />

      <Text style={styles.title}>
        {title}
      </Text>

    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },

  title: {
    marginTop: 16,
    color: "#6B7280",
    fontSize: 15,
    fontWeight: "500",
  },

});
