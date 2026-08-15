const GOOGLE_SIGNIN_PLUGIN =
  "react-native-nitro-google-signin";

module.exports = ({ config }) => {
  const iosUrlScheme =
    (
      process.env
        .GOOGLE_IOS_URL_SCHEME ||
      ""
    ).trim();

  const existingPlugins =
    Array.isArray(config.plugins)
      ? config.plugins
      : [];

  const plugins =
    existingPlugins.filter(
      (entry) => {
        const pluginName =
          Array.isArray(entry)
            ? entry[0]
            : entry;

        return (
          pluginName !==
          GOOGLE_SIGNIN_PLUGIN
        );
      }
    );

  /*
   * Android uses the explicit Web OAuth client ID supplied by
   * GoogleIdentityService and does not require google-services.json.
   *
   * iOS requires the reversed iOS OAuth client URL scheme.
   * Add the native config plugin only when that real build-time
   * value is available.
   */
  if (iosUrlScheme) {
    plugins.push([
      GOOGLE_SIGNIN_PLUGIN,
      {
        iosUrlScheme,
      },
    ]);
  }

  return {
    ...config,
    plugins,
  };
};