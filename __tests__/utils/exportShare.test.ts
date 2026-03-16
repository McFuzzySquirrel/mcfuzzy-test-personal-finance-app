/* eslint-disable @typescript-eslint/no-explicit-any */
import { Platform, Alert, ToastAndroid } from 'react-native';
import * as Sharing from 'expo-sharing';

import { shareFile } from '@/utils/exportShare';

/* ---------- mocks ---------- */

// expo-sharing is globally mocked in setup.ts.
// Grab typed handles to the mocked functions.
const mockIsAvailableAsync = Sharing.isAvailableAsync as jest.MockedFunction<
  typeof Sharing.isAvailableAsync
>;
const mockShareAsync = Sharing.shareAsync as jest.MockedFunction<typeof Sharing.shareAsync>;

jest.spyOn(Alert, 'alert');

beforeEach(() => {
  jest.clearAllMocks();
  // Default: sharing available
  mockIsAvailableAsync.mockResolvedValue(true);
  mockShareAsync.mockResolvedValue(undefined);
  // Default platform: iOS (non-Android path)
  (Platform as any).OS = 'ios';
});

/* ---------- tests ---------- */

describe('shareFile', () => {
  // ---- happy path ----

  it('calls shareAsync with CSV mimeType and dialog title', async () => {
    await shareFile('/tmp/report.csv', 'text/csv');

    expect(mockShareAsync).toHaveBeenCalledWith('/tmp/report.csv', {
      dialogTitle: 'Share monthly report',
      mimeType: 'text/csv',
    });
  });

  it('calls shareAsync with PDF mimeType', async () => {
    await shareFile('/tmp/report.pdf', 'application/pdf');

    expect(mockShareAsync).toHaveBeenCalledWith('/tmp/report.pdf', {
      dialogTitle: 'Share monthly report',
      mimeType: 'application/pdf',
    });
  });

  // ---- sharing not available on device ----

  it('throws and shows alert when sharing is not available (iOS)', async () => {
    mockIsAvailableAsync.mockResolvedValue(false);

    await expect(shareFile('/tmp/report.csv', 'text/csv')).rejects.toThrow(
      'Sharing is unavailable on this device.'
    );

    expect(Alert.alert).toHaveBeenCalledWith(
      'Sharing unavailable',
      'Sharing is unavailable on this device.'
    );
    expect(mockShareAsync).not.toHaveBeenCalled();
  });

  it('throws and shows toast when sharing is not available (Android)', async () => {
    (Platform as any).OS = 'android';
    mockIsAvailableAsync.mockResolvedValue(false);

    const toastSpy = jest.spyOn(ToastAndroid, 'show').mockImplementation(() => {});

    await expect(shareFile('/tmp/report.csv', 'text/csv')).rejects.toThrow(
      'Sharing is unavailable on this device.'
    );

    expect(toastSpy).toHaveBeenCalledWith(
      'Sharing is unavailable on this device.',
      ToastAndroid.SHORT
    );
    expect(mockShareAsync).not.toHaveBeenCalled();

    toastSpy.mockRestore();
  });

  // ---- shareAsync rejects ----

  it('propagates errors thrown by shareAsync', async () => {
    mockShareAsync.mockRejectedValue(new Error('user cancelled'));

    await expect(shareFile('/tmp/report.csv', 'text/csv')).rejects.toThrow('user cancelled');
  });
});
