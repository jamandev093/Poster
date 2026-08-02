import { Alert, Linking } from 'react-native';

export default class LinkService {
  static async openArticle(url?: string): Promise<void> {
    try {
      if (!url || !/^https?:\/\//i.test(url)) {
        Alert.alert(
          'Unable to open article',
          'The article link is unavailable or invalid.'
        );
        return;
      }

      const supported = await Linking.canOpenURL(url);

      if (!supported) {
        Alert.alert(
          'Unable to open article',
          'Your device cannot open this link.'
        );
        return;
      }

      await Linking.openURL(url);
    } catch {
      Alert.alert(
        'Unable to open article',
        'Something went wrong while opening the article.'
      );
    }
  }
}
