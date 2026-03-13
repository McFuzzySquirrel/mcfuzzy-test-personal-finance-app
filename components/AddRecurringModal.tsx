import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import type { Category } from '@/types';
import { parseCurrencyInputToCents } from '@/utils/currency';

const MODAL_COLORS = {
  backdrop: 'rgba(0, 0, 0, 0.45)',
} as const;

export interface RecurringDraft {
  amount: number;
  categoryId: string;
  dayOfMonth: number;
  note?: string;
}

export interface AddRecurringModalProps {
  categories: Category[];
  isSaving: boolean;
  visible: boolean;
  onClose: () => void;
  onSave: (draft: RecurringDraft) => Promise<void>;
}

export default function AddRecurringModal({
  categories,
  isSaving,
  visible,
  onClose,
  onSave,
}: AddRecurringModalProps): React.JSX.Element {
  const [amountText, setAmountText] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [dayOfMonthText, setDayOfMonthText] = useState('1');
  const [noteText, setNoteText] = useState('');
  const [showValidation, setShowValidation] = useState(false);

  useEffect(() => {
    if (!visible) {
      setAmountText('');
      setCategoryId(null);
      setDayOfMonthText('1');
      setNoteText('');
      setShowValidation(false);
    }
  }, [visible]);

  const amountInCents = parseCurrencyInputToCents(amountText);
  const dayOfMonth = Number.parseInt(dayOfMonthText, 10);
  const dayOfMonthValid = Number.isInteger(dayOfMonth) && dayOfMonth >= 1 && dayOfMonth <= 28;

  const amountError = showValidation && (!amountInCents || amountInCents <= 0) ? 'Enter amount above 0.' : null;
  const categoryError = showValidation && !categoryId ? 'Choose a category.' : null;
  const dayError = showValidation && !dayOfMonthValid ? 'Pick a day between 1 and 28.' : null;

  const hasErrors = useMemo(() => Boolean(amountError || categoryError || dayError), [amountError, categoryError, dayError]);

  const handleSave = async (): Promise<void> => {
    setShowValidation(true);

    if (!amountInCents || !categoryId || !dayOfMonthValid || hasErrors) {
      return;
    }

    await onSave({
      amount: amountInCents,
      categoryId,
      dayOfMonth,
      note: noteText.trim().length > 0 ? noteText.trim() : undefined,
    });
  };

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Add recurring expense</Text>
          <Text style={styles.subtitle}>Monthly interval</Text>

          <TextInput
            keyboardType="decimal-pad"
            onChangeText={setAmountText}
            placeholder="Amount"
            style={styles.input}
            testID="recurring-modal-amount-input"
            value={amountText}
          />
          {amountError ? <Text style={styles.errorText}>{amountError}</Text> : null}

          <TextInput
            keyboardType="number-pad"
            onChangeText={setDayOfMonthText}
            placeholder="Day of month (1-28)"
            style={styles.input}
            testID="recurring-modal-day-input"
            value={dayOfMonthText}
          />
          {dayError ? <Text style={styles.errorText}>{dayError}</Text> : null}

          <TextInput
            onChangeText={setNoteText}
            placeholder="Description / note"
            style={styles.input}
            testID="recurring-modal-note-input"
            value={noteText}
          />

          <Text style={styles.sectionTitle}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryRow}>
            {categories.map((category) => {
              const isSelected = category.id === categoryId;

              return (
                <Pressable
                  key={category.id}
                  onPress={() => setCategoryId(category.id)}
                  style={[styles.categoryChip, isSelected ? styles.categoryChipSelected : undefined]}
                  testID={`recurring-modal-category-${category.id}`}
                >
                  <Text style={styles.categoryChipText}>{category.name}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
          {categoryError ? <Text style={styles.errorText}>{categoryError}</Text> : null}

          <View style={styles.actionsRow}>
            <Pressable onPress={onClose} style={styles.secondaryButton} testID="recurring-modal-cancel-button">
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              disabled={isSaving}
              onPress={() => {
                void handleSave();
              }}
              style={[styles.primaryButton, isSaving ? styles.buttonDisabled : undefined]}
              testID="recurring-modal-save-button"
            >
              <Text style={styles.primaryButtonText}>{isSaving ? 'Saving...' : 'Save recurring'}</Text>
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
    opacity: 0.5,
  },
  categoryChip: {
    borderRadius: 999,
    borderWidth: 1,
    marginRight: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  categoryChipSelected: {
    borderWidth: 2,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  categoryRow: {
    flexGrow: 0,
    marginTop: 6,
  },
  errorText: {
    fontSize: 12,
    marginBottom: 6,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  overlay: {
    backgroundColor: MODAL_COLORS.backdrop,
    flex: 1,
    justifyContent: 'flex-end',
  },
  primaryButton: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryButton: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 6,
  },
  sheet: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 1,
    maxHeight: '85%',
    padding: 16,
  },
  subtitle: {
    fontSize: 12,
    marginBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
});
