import { Alert, Platform } from 'react-native';

interface SharingModule {
  isAvailableAsync: () => Promise<boolean>;
  shareAsync: (
    uri: string,
    options?: {
      UTI?: string;
      dialogTitle?: string;
      mimeType?: string;
    }
  ) => Promise<void>;
}

async function showUnavailableMessage(): Promise<void> {
  const message = 'Sharing is unavailable on this device.';

  if (Platform.OS === 'android') {
    const reactNative = await import('react-native');
    reactNative.ToastAndroid.show(message, reactNative.ToastAndroid.SHORT);
    return;
  }

  Alert.alert('Sharing unavailable', message);
}

async function loadSharingModule(): Promise<SharingModule | null> {
  try {
    const moduleName = 'expo-sharing';
    const loaded = (await import(moduleName)) as unknown as SharingModule;

    if (typeof loaded.isAvailableAsync !== 'function' || typeof loaded.shareAsync !== 'function') {
      return null;
    }

    return loaded;
  } catch {
    return null;
  }
}

export async function shareFile(uri: string, mimeType: 'text/csv' | 'application/pdf'): Promise<void> {
  const sharingModule = await loadSharingModule();

  if (!sharingModule) {
    await showUnavailableMessage();
    throw new Error('Sharing module is unavailable.');
  }

  const isAvailable = await sharingModule.isAvailableAsync();

  if (!isAvailable) {
    await showUnavailableMessage();
    throw new Error('Sharing is unavailable on this device.');
  }

  await sharingModule.shareAsync(uri, {
    dialogTitle: 'Share monthly report',
    mimeType,
  });
}
