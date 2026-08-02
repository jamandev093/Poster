import {
  StyleSheet,
} from "react-native";

import {
  LightTheme,
  Typography,
} from "../theme";

const styles =
  StyleSheet.create({
    container: {
      flex: 1,

      justifyContent:
        "center",

      paddingHorizontal:
        28,
    },

    logoContainer: {
      alignItems:
        "center",

      marginBottom:
        46,
    },

    subtitle: {
      color:
        LightTheme.colors
          .textSecondary,

      fontSize:
        18,

      marginTop:
        14,
    },

    card: {
      paddingVertical:
        30,

      paddingHorizontal:
        24,
    },

    title: {
      ...Typography.title,

      color:
        "#FFFFFF",

      fontWeight:
        "700",

      textAlign:
        "center",

      marginBottom:
        28,
    },

    inputGap: {
      height:
        18,
    },

    forgot: {
      alignSelf:
        "flex-end",

      marginTop:
        16,

      marginBottom:
        26,
    },

    forgotText: {
      color:
        LightTheme.colors
          .primary,

      fontSize:
        15,

      fontWeight:
        "600",
    },

    buttonGap: {
      height:
        24,
    },

    googleGap: {
      height:
        22,
    },

    signupContainer: {
      marginTop:
        28,

      alignItems:
        "center",
    },

    signupText: {
      color:
        LightTheme.colors
          .textSecondary,

      fontSize:
        15,
    },

    signupLink: {
      color:
        LightTheme.colors
          .primary,

      fontWeight:
        "700",
    },
  });

export default styles;