import "react-native-gesture-handler";

import {
  useEffect,
  useState,
} from "react";
import {
  Platform,
  StyleSheet,
} from "react-native";
import {
  Edge,
  SafeAreaProvider,
  SafeAreaView,
} from "react-native-safe-area-context";

import AppNavigator from "./src/navigation/AppNavigator";

import {
  FeedbackProvider,
} from "./src/context/FeedbackContext";

import {
  initializeInterestTaxonomy,
} from "./src/data/interests";

import PreferenceService from "./src/services/PreferenceService";
import TaxonomyEvolutionService from "./src/services/TaxonomyEvolutionService";

import ThemeManager from "./src/theme/ThemeManager";
import ThemeProvider from "./src/theme/ThemeProvider";
import useTheme from "./src/theme/useTheme";

const GLOBAL_SAFE_AREA_EDGES:
  Edge[] =
  Platform.OS === "android"
    ? [
        "top",
        "left",
        "right",
      ]
    : [
        "left",
        "right",
      ];

function AppContent() {
  const { colors } = useTheme();

  return (
    <SafeAreaView
      edges={
        GLOBAL_SAFE_AREA_EDGES
      }
      style={[
        styles.safeArea,
        {
          backgroundColor:
            colors.background,
        },
      ]}
    >
      <AppNavigator />
    </SafeAreaView>
  );
}

export default function App() {
  const [
    initialized,
    setInitialized,
  ] = useState(false);

  useEffect(() => {
    let active = true;

    const initializeApp =
      async () => {
        initializeInterestTaxonomy();

        /*
         * Living-taxonomy maintenance is intentionally non-blocking.
         * A maintenance/storage failure must never prevent app startup.
         */
        void TaxonomyEvolutionService
          .runMaintenance()
          .catch(
            () => undefined
          );

        const darkModeEnabled =
          await PreferenceService.getDarkMode();

        ThemeManager.setTheme(
          darkModeEnabled
            ? "dark"
            : "light"
        );

        if (active) {
          setInitialized(true);
        }
      };

    void initializeApp();

    return () => {
      active = false;
    };
  }, []);

  if (!initialized) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <FeedbackProvider>
          <AppContent />
        </FeedbackProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles =
  StyleSheet.create({
    safeArea: {
      flex: 1,
    },
  });
