import React, { useState } from "react";
import {
  SafeAreaView,
  FlatList,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";


const topics = [
  "AI",
  "Technology",
  "Science",
  "Programming",
  "Cybersecurity",
  "Business",
  "Finance",
  "Space",
  "Healthcare",
  "Education",
  "Startups",
  "Environment",
];

export default function InterestedTopicsScreen() {
  const [selected, setSelected] = useState<string[]>([
    "AI",
    "Technology",
    "Science",
    "Programming",
  ]);

  function toggleTopic(topic: string) {
    if (selected.includes(topic)) {
      setSelected(selected.filter((item) => item !== topic));
    } else {
      setSelected([...selected, topic]);
    }
  }

  return (
    
      <SafeAreaView style={styles.container}>

        <FlatList
          data={topics}
          keyExtractor={(item) => item}
          numColumns={2}
          contentContainerStyle={styles.content}
          ListHeaderComponent={
            <>
              <Text style={styles.title}>
                Interested Topics
              </Text>

              <Text style={styles.subtitle}>
                Choose topics you'd like Poster to prioritize.
              </Text>
            </>
          }
          renderItem={({ item }) => {
            const active = selected.includes(item);

            return (
              <TouchableOpacity
                style={[
                  styles.topic,
                  active && styles.activeTopic,
                ]}
                onPress={() => toggleTopic(item)}
              >
                <Text
                  style={[
                    styles.topicText,
                    active && styles.activeText,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            );
          }}
        />

      </SafeAreaView>
    
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  content: {
    padding: 16,
    paddingBottom: 90,
  },

  title: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "800",
  },

  subtitle: {
    color: "#94A3B8",
    fontSize: 15,
    marginTop: 6,
    marginBottom: 24,
  },

  topic: {
    flex: 1,
    margin: 6,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: "#111827",
    alignItems: "center",
  },

  activeTopic: {
    backgroundColor: "#2563EB",
  },

  topicText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 15,
  },

  activeText: {
    color: "#FFFFFF",
  },
});
