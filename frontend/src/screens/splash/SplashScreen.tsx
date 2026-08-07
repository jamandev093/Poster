import React, {
  useEffect,
} from "react";
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import {
  NativeStackScreenProps,
} from "@react-navigation/native-stack";

import Logo from "../../components/common/Logo";

import {
  RootStackParamList,
} from "../../navigation/AppNavigator";

import AuthService from "../../services/AuthService";

import {
  Icons,
  Radius,
  Shadows,
  Spacing,
  Typography,
} from "../../theme";
import useTheme from "../../theme/useTheme";

type Props = NativeStackScreenProps<
  RootStackParamList,
  "Splash"
>;

const MINIMUM_SPLASH_DURATION_MS =
  1400;

function wait(
  duration: number
): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(
      resolve,
      duration
    );
  });
}

export default function SplashScreen({
  navigation,
}: Props) {
  const { colors, dark } =
    useTheme();

  useEffect(() => {
    let active = true;

    const resolveInitialRoute =
      async () => {
        const sessionPromise =
          AuthService
            .refreshSession()
            .then(() => true)
            .catch(async () => {
              await AuthService
                .clearSession()
                .catch(() => undefined);

              return false;
            });

        const [
          sessionIsValid,
        ] = await Promise.all([
          sessionPromise,

          wait(
            MINIMUM_SPLASH_DURATION_MS
          ),
        ]);

        if (!active) {
          return;
        }

        navigation.replace(
          sessionIsValid
            ? "Main"
            : "Login"
        );
      };

    void resolveInitialRoute();

    return () => {
      active = false;
    };
  }, [navigation]);

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor:
            colors.background,
        },
      ]}
    >
      <StatusBar
        barStyle={
          dark
            ? "light-content"
            : "dark-content"
        }
        backgroundColor={
          colors.background
        }
      />

      <View style={styles.content}>
        <View
          style={[
            styles.brandMark,
            Shadows.sm,
            {
              backgroundColor:
                colors.primary,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="layers-triple-outline"
            size={Icons.xl}
            color={
              colors.onPrimary
            }
          />
        </View>

        <Logo />

        <Text
          style={[
            styles.tagline,
            {
              color:
                colors.textSecondary,
            },
          ]}
        >
          Knowledge worth discovering
        </Text>
      </View>

      <Text
        style={[
          styles.version,
          {
            color:
              colors.placeholder,
          },
        ]}
      >
        Version 1.0
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,

    justifyContent:
      "space-between",

    alignItems: "center",

    paddingHorizontal:
      Spacing.screen,

    paddingVertical:
      Spacing.xxxl,
  },

  content: {
    flex: 1,

    justifyContent: "center",

    alignItems: "center",
  },

  brandMark: {
    width: 62,

    height: 62,

    borderRadius:
      Radius.xl,

    justifyContent: "center",

    alignItems: "center",

    marginBottom:
      Spacing.xl,
  },

  tagline: {
    ...Typography.body,

    textAlign: "center",

    marginTop:
      Spacing.lg,
  },

  version: {
    ...Typography.small,
  },
});
