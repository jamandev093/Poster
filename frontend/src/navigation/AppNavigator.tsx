import React, {
  useMemo,
} from "react";
import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationLightTheme,
  NavigationContainer,
  Theme as NavigationTheme,
} from "@react-navigation/native";
import {
  createNativeStackNavigator,
} from "@react-navigation/native-stack";

import useTheme from "../theme/useTheme";

import SplashScreen from "../screens/splash/SplashScreen";

import LoginScreen from "../screens/auth/LoginScreen";
import SignupScreen from "../screens/auth/SignupScreen";
import ForgotPasswordScreen from "../screens/auth/ForgotPasswordScreen";
import OtpVerificationScreen from "../screens/auth/OtpVerificationScreen";
import UsernameScreen from "../screens/auth/UsernameScreen";
import InterestSelectionScreen from "../screens/auth/InterestSelectionScreen";
import OnboardingCompleteScreen from "../screens/auth/OnboardingCompleteScreen";

import BookmarksScreen from "../screens/bookmarks/BookmarksScreen";

import EditProfileScreen from "../screens/profile/EditProfileScreen";
import ManageInterestsScreen from "../screens/profile/ManageInterestsScreen";
import PrivacyAdvertisingScreen from "../screens/profile/PrivacyAdvertisingScreen";

import BottomTabNavigator from "./BottomTabNavigator";

export type RootStackParamList = {
  Splash: undefined;

  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;

  OtpVerification:
    | {
        email?: string;
      }
    | undefined;

  Username: undefined;
  InterestSelection: undefined;
  OnboardingComplete: undefined;

  Main: undefined;

  Bookmarks: undefined;
  EditProfile: undefined;
  ManageInterests: undefined;
  PrivacyAdvertising: undefined;
};

const Stack =
  createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { colors, dark } = useTheme();

  const navigationTheme =
    useMemo<NavigationTheme>(() => {
      const baseTheme = dark
        ? NavigationDarkTheme
        : NavigationLightTheme;

      return {
        ...baseTheme,

        dark,

        colors: {
          ...baseTheme.colors,

          primary:
            colors.primary,

          background:
            colors.background,

          card:
            colors.card,

          text:
            colors.text,

          border:
            colors.border,

          notification:
            colors.danger,
        },
      };
    }, [
      colors.background,
      colors.border,
      colors.card,
      colors.danger,
      colors.primary,
      colors.text,
      dark,
    ]);

  return (
    <NavigationContainer
      theme={navigationTheme}
    >
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,

          animation: "fade",

          contentStyle: {
            backgroundColor:
              colors.background,
          },
        }}
      >
        <Stack.Screen
          name="Splash"
          component={SplashScreen}
        />

        <Stack.Screen
          name="Login"
          component={LoginScreen}
        />

        <Stack.Screen
          name="Signup"
          component={SignupScreen}
        />

        <Stack.Screen
          name="ForgotPassword"
          component={
            ForgotPasswordScreen
          }
        />

        <Stack.Screen
          name="OtpVerification"
          component={
            OtpVerificationScreen
          }
        />

        <Stack.Screen
          name="Username"
          component={UsernameScreen}
        />

        <Stack.Screen
          name="InterestSelection"
          component={
            InterestSelectionScreen
          }
        />

        <Stack.Screen
          name="OnboardingComplete"
          component={
            OnboardingCompleteScreen
          }
        />

        <Stack.Screen
          name="Main"
          component={
            BottomTabNavigator
          }
        />

        <Stack.Screen
          name="Bookmarks"
          component={BookmarksScreen}
        />

        <Stack.Screen
          name="EditProfile"
          component={
            EditProfileScreen
          }
        />

        <Stack.Screen
          name="ManageInterests"
          component={
            ManageInterestsScreen
          }
        />

        <Stack.Screen
          name="PrivacyAdvertising"
          component={
            PrivacyAdvertisingScreen
          }
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}