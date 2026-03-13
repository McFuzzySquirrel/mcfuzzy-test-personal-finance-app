import React, { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { Budget, Category, Expense } from '@/types';
import { formatMonthLabel } from '@/utils/date';
import { generateCsv } from '@/utils/exportCsv';
import { generatePdfHtml, printToPdf } from '@/utils/exportPdf';
import { shareFile } from '@/utils/exportShare';

type ExportFormat = 'csv' | 'pdf';

interface FileSystemModule {
  cacheDirectory: string | null;
  writeAsStringAsync: (uri: string, contents: string, options?: { encoding?: string }) => Promise<void>;
}

const OVERLAY_COLOR = 'rgba(0, 0, 0, 0.45)';

async function showFeedback(message: string): Promise<void> {
  if (Platform.OS === 'android') {
    const reactNative = await import('react-native');
    reactNative.ToastAndroid.show(message, reactNative.ToastAndroid.SHORT);
    return;
  }

  Alert.alert('Export', message);
}

function confirmShare(): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert('Confirm export', 'This will share your financial data. Continue?', [
      {
        text: 'Cancel',
        style: 'cancel',
        onPress: () => resolve(false),
      },
      {
        text: 'Continue',
        onPress: () => resolve(true),
      },
    ]);
  });
}

async function loadFileSystemModule(): Promise<FileSystemModule | null> {
  try {
    const moduleName = 'expo-file-system';
    const loaded = (await import(moduleName)) as unknown as FileSystemModule;

    if (typeof loaded.writeAsStringAsync !== 'function') {
      return null;
    }

    return loaded;
  } catch {
    return null;
  }
}

async function createCsvFile(month: string, csvContent: string): Promise<string> {
  const fileSystem = await loadFileSystemModule();

  if (!fileSystem?.cacheDirectory) {
    throw new Error('CSV export is unavailable on this device.');
  }

  const safeMonth = month.replace(/[^0-9-]/g, '');
  const uri = `${fileSystem.cacheDirectory}monthly-report-${safeMonth}.csv`;
  await fileSystem.writeAsStringAsync(uri, csvContent, { encoding: 'utf8' });

  return uri;
}

export interface ExportModalProps {
  budgets: Budget[];
  categories: Category[];
  expenses: Expense[];
  month: string;
  onClose: () => void;
  onMonthChange: (nextMonth: string) => void;
  visible: boolean;
}

export default function ExportModal({
  budgets,
  categories,
  expenses,
  month,
  onClose,
  onMonthChange,
  visible,
}: ExportModalProps): React.JSX.Element {
  const [format, setFormat] = useState<ExportFormat>('csv');
  const [isExporting, setIsExporting] = useState(false);

  const budgetsByCategoryId = useMemo(
    () => new Map(budgets.map((budget) => [budget.categoryId, budget.limitAmount] as const)),
    [budgets]
  );

  const categoriesWithBudget = useMemo(
    () =>
      categories.map((category) => ({
        ...category,
        budgetLimit: budgetsByCategoryId.get(category.id) ?? 0,
      })),
    [budgetsByCategoryId, categories]
  );

  const runExport = async (): Promise<void> => {
    const confirmed = await confirmShare();

    if (!confirmed) {
      return;
    }

    setIsExporting(true);

    try {
      if (format === 'csv') {
        const csv = generateCsv(expenses, categories);
        const uri = await createCsvFile(month, csv);
        await shareFile(uri, 'text/csv');
      } else {
        const html = generatePdfHtml(expenses, categoriesWithBudget, month);
        const uri = await printToPdf(html);
        await shareFile(uri, 'application/pdf');
      }

      await showFeedback('Export ready to share.');
      onClose();
    } catch (exportError) {
      const message = exportError instanceof Error ? exportError.message : 'Unable to complete export.';
      Alert.alert('Export failed', message);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Export monthly report</Text>
          <Text style={styles.subtitle}>{formatMonthLabel(`${month}-01`)}</Text>

          <View style={styles.monthRow}>
            <Pressable
              disabled={isExporting}
              onPress={() => onMonthChange(dayjs(`${month}-01`).subtract(1, 'month').format('YYYY-MM'))}
              style={styles.ghostButton}
              testID="export-modal-prev-month"
            >
              <Text style={styles.ghostButtonText}>Previous</Text>
            </Pressable>
            <Text style={styles.monthLabel}>{formatMonthLabel(`${month}-01`)}</Text>
            <Pressable
              disabled={isExporting}
              onPress={() => onMonthChange(dayjs(`${month}-01`).add(1, 'month').format('YYYY-MM'))}
              style={styles.ghostButton}
              testID="export-modal-next-month"
            >
              <Text style={styles.ghostButtonText}>Next</Text>
            </Pressable>
          </View>

          <Text style={styles.sectionTitle}>Format</Text>
          <View style={styles.formatRow}>
            <Pressable
              disabled={isExporting}
              onPress={() => setFormat('csv')}
              style={[styles.formatButton, format === 'csv' ? styles.formatButtonSelected : undefined]}
              testID="export-modal-format-csv"
            >
              <Text style={styles.formatButtonText}>CSV</Text>
            </Pressable>
            <Pressable
              disabled={isExporting}
              onPress={() => setFormat('pdf')}
              style={[styles.formatButton, format === 'pdf' ? styles.formatButtonSelected : undefined]}
              testID="export-modal-format-pdf"
            >
              <Text style={styles.formatButtonText}>PDF</Text>
            </Pressable>
          </View>

          <View style={styles.actionsRow}>
            <Pressable
              disabled={isExporting}
              onPress={onClose}
              style={[styles.secondaryButton, isExporting ? styles.buttonDisabled : undefined]}
              testID="export-modal-cancel"
            >
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              disabled={isExporting}
              onPress={() => {
                void runExport();
              }}
              style={[styles.primaryButton, isExporting ? styles.buttonDisabled : undefined]}
              testID="export-modal-submit"
            >
              {isExporting ? <ActivityIndicator size="small" /> : <Text style={styles.primaryButtonText}>Export</Text>}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  formatButton: {
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 100,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  formatButtonSelected: {
    borderWidth: 2,
  },
  formatButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  formatRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  ghostButton: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  ghostButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  monthLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  monthRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  overlay: {
    backgroundColor: OVERLAY_COLOR,
    flex: 1,
    justifyContent: 'flex-end',
  },
  primaryButton: {
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 120,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  secondaryButton: {
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 120,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 16,
  },
  sheet: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 1,
    padding: 16,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
});
