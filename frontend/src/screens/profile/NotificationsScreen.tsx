import React, { useState } from "react";
import {
  SafeAreaView,
  Text,
  View,
  Switch,
  StyleSheet,
} from "react-native";


export default function NotificationsScreen() {
  const [breakingNews, setBreakingNews] = useState(true);
  const [recommended, setRecommended] = useState(true);
  const [savedArticles, setSavedArticles] = useState(true);

  return (
    
      <SafeAreaView style={styles.container}>

        <Text style={styles.title}>
          Notifications
        </Text>

        <Text style={styles.subtitle}>
          Choose what Poster should notify you about.
        </Text>

        <View style={styles.card}>
          <Row
            title="Breaking News"
            value={breakingNews}
            onChange={setBreakingNews}
          />

          <Row
            title="Recommended Articles"
            value={recommended}
            onChange={setRecommended}
          />

          <Row
            title="Bookmarked Updates"
            value={savedArticles}
            onChange={setSavedArticles}
          />
        </View>

      </SafeAreaView>
    
  );
}

function Row({
  title,
  value,
  onChange,
}: {
  title: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowTitle}>
        {title}
      </Text>

      <Switch
        value={value}
        onValueChange={onChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },

  title: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "800",
  },

  subtitle: {
    color: "#94A3B8",
    marginTop: 6,
    marginBottom: 24,
  },

  card: {
    backgroundColor: "#111827",
    borderRadius: 16,
    padding: 18,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#1F2937",
  },

  rowTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
