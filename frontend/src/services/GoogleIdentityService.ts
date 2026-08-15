import {
  GoogleOneTapSignIn,
  isCancelledResponse,
  isNoSavedCredentialFoundResponse,
  isSuccessResponse,
} from "react-native-nitro-google-signin";

declare const process: {
  env?: {
    EXPO_PUBLIC_GOOGLE_OAUTH_WEB_CLIENT_ID?: string;
  };
};

export type GoogleIdentityMode =
  | "login"
  | "signup";

function resolveGoogleWebClientId():
  string {
  const clientId =
    process
      .env
      ?.EXPO_PUBLIC_GOOGLE_OAUTH_WEB_CLIENT_ID
      ?.trim() ??
    "";

  if (!clientId) {
    throw new Error(
      "Google sign-in is not configured on this build."
    );
  }

  return clientId;
}

class GoogleIdentityService {
  private configuredClientId:
    string |
    null =
    null;

  private ensureConfigured():
    void {
    const webClientId =
      resolveGoogleWebClientId();

    if (
      this.configuredClientId ===
      webClientId
    ) {
      return;
    }

    GoogleOneTapSignIn.configure({
      webClientId,

      offlineAccess:
        false,

      autoSelectOnSignIn:
        false,
    });

    this.configuredClientId =
      webClientId;
  }

  async requestIdToken(
    mode:
      GoogleIdentityMode
  ): Promise<
    string |
    null
  > {
    this.ensureConfigured();

    await GoogleOneTapSignIn
      .checkPlayServices();

    let response =
      mode ===
        "signup"
        ? await GoogleOneTapSignIn
            .createAccount()
        : await GoogleOneTapSignIn
            .signIn();

    if (
      isNoSavedCredentialFoundResponse(
        response
      )
    ) {
      response =
        await GoogleOneTapSignIn
          .presentExplicitSignIn();
    }

    if (
      isCancelledResponse(
        response
      )
    ) {
      return null;
    }

    if (
      !isSuccessResponse(
        response
      )
    ) {
      throw new Error(
        "Google sign-in could not be completed."
      );
    }

    const idToken =
      response
        .data
        .idToken
        ?.trim() ??
      "";

    if (!idToken) {
      throw new Error(
        "Google did not return an identity token."
      );
    }

    return idToken;
  }
}

export default new GoogleIdentityService();
