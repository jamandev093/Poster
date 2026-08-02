import React from "react";
import {
  SafeAreaView,
  FlatList,
  Text,
  StyleSheet,
} from "react-native";

import ProfileMenuItem from "../../components/profile/ProfileMenuItem";

const settings = [
  {
    id: "1",
    title: "Appearance",
    icon: "theme-light-dark",
  },
  {
    id: "2",
    title: "Language",
    icon: "translate",
  },
  {
    id: "3",
    title: "Privacy",
    icon: "shield-lock-outline",
  },
  {
    id: "4",
    title: "Help & Support",
    icon: "help-circle-outline",
  },
  {
    id: "5",
    title: "About Poster",
    icon: "information-outline",
  },
];

export default function SettingsScreen() {
  return (
    
      <SafeAreaView style={styles.container}>

        <FlatList
          data={settings}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.content}
          ListHeaderComponent={
            <Text style={styles.title}>
              Settings
            </Text>
          }
          renderItem={({ item }) => (
            <ProfileMenuItem
              title={item.title}
              icon={item.icon}
            />
          )}
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
    marginBottom: 20,
  },
});
