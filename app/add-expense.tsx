import React, { useMemo, useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import CategoryGrid from '@/components/CategoryGrid';
import LentBorrowedForm from '@/components/LentBorrowedForm';
import SplitExpenseForm, { type SplitType } from '@/components/SplitExpenseForm';
import type { RootStackParamList } from '@/app/navigation/types';
import { useCategories } from '@/hooks/useCategories';
import { useExpenses } from '@/hooks/useExpenses';
import type { ExpenseType } from '@/types';
import { parseCurrencyInputToCents } from '@/utils/currency';
import { formatISODate } from '@/utils/date';

type AddExpenseScreenProps = NativeStackScreenProps<RootStackParamList, 'AddExpense'>;

function sanitizeAmountInput(value: string): string {
  const normalized = value.replace(',', '.').replace(/[^\d.]/g, '');
  const firstDotIndex = normalized.indexOf('.');

  if (firstDotIndex === -1) {
    return normalized;
  }

  const beforeDot = normalized.slice(0, firstDotIndex + 1);
  const afterDot = normalized.slice(firstDotIndex + 1).replace(/\./g, '');
  return beforeDot + afterDot;
}

function parseAmountToCents(value: string): number | null {
  if (value.trim().length === 0) {
    return null;
  }

  const parsed = Number.parseFloat(value);

  if (!Number.isFinite(parsed)) {
    return null;
  }

  return Math.round(parsed * 100);
}

export default function AddExpenseScreen({ navigation }: AddExpenseScreenProps): React.JSX.Element {
  const today = useMemo(() => formatISODate(), []);
  const { categories, error: categoriesError, isLoading: isLoadingCategories } = useCategories();
  const { createExpense } = useExpenses();
  const [amountText, setAmountText] = useState('');
  const [noteText, setNoteText] = useState('');
  const [isNoteVisible, setIsNoteVisible] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [entryType, setEntryType] = useState<Extract<ExpenseType, 'expense' | 'lent' | 'borrowed'>>('expense');
  const [splitWithName, setSplitWithName] = useState('');
  const [isSplitEnabled, setIsSplitEnabled] = useState(false);
  const [splitType, setSplitType] = useState<SplitType>('equal');
  const [customSplitAmountText, setCustomSplitAmountText] = useState('');

  const amountInCents = parseAmountToCents(amountText) ?? parseCurrencyInputToCents(amountText);
  const customSplitInCents = parseCurrencyInputToCents(customSplitAmountText);
  const splitAmountInCents =
    entryType === 'lent' || entryType === 'borrowed'
      ? amountInCents
      : isSplitEnabled
        ? splitType === 'equal'
          ? amountInCents
            ? Math.round(amountInCents / 2)
            : null
          : customSplitInCents
        : null;

  const needsPersonName = entryType === 'lent' || entryType === 'borrowed' || isSplitEnabled;
  const amountError = showValidation && (!amountInCents || amountInCents <= 0) ? 'Enter an amount above 0.' : null;
  const categoryError = showValidation && !selectedCategoryId ? 'Choose a category.' : null;
  const personError =
    showValidation &&
    (entryType === 'lent' || entryType === 'borrowed') &&
    splitWithName.trim().length === 0
      ? 'Enter a person name.'
      : null;
  const splitAmountError =
    showValidation &&
    (entryType === 'lent' || entryType === 'borrowed') &&
    (!splitAmountInCents || splitAmountInCents <= 0 || (amountInCents !== null && splitAmountInCents > amountInCents))
      ? 'Split amount must be above 0 and not greater than total amount.'
      : null;

  const handleSave = async (): Promise<void> => {
    setShowValidation(true);

    if (
      !amountInCents ||
      amountInCents <= 0 ||
      !selectedCategoryId ||
      (needsPersonName && splitWithName.trim().length === 0) ||
      ((entryType === 'lent' || entryType === 'borrowed' || isSplitEnabled) &&
        (!splitAmountInCents || splitAmountInCents <= 0 || splitAmountInCents > amountInCents))
    ) {
      return;
    }

    setIsSaving(true);

    try {
      await createExpense({
        amount: amountInCents,
        categoryId: selectedCategoryId,
        date: today,
        splitAmount: splitAmountInCents ?? undefined,
        splitWith: needsPersonName ? splitWithName.trim() : undefined,
        note: noteText.trim().length > 0 ? noteText.trim() : undefined,
        settled: false,
        type: entryType === 'expense' ? (isSplitEnabled ? 'split' : 'expense') : entryType,
      });
      navigation.navigate('Tabs', { screen: 'Dashboard' });
    } catch (saveError) {
      Alert.alert('Unable to save expense', saveError instanceof Error ? saveError.message : 'Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}> 
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" testID="add-expense-scroll-view">
        <Text style={styles.label}>Amount</Text>
        <TextInput
          accessibilityLabel="Expense amount"
          accessibilityHint="Enter the expense amount in rands"
          autoFocus
          keyboardType="decimal-pad"
          onChangeText={(value) => setAmountText(sanitizeAmountInput(value))}
          placeholder="0.00"
          style={styles.amountInput}
          testID="add-expense-amount-input"
          value={amountText}
        />
        {amountError ? <Text style={styles.errorText}>{amountError}</Text> : null}

        <View style={styles.sectionSpacing}>
          <Text style={styles.label}>Category</Text>
          {isLoadingCategories ? <Text>Loading categories...</Text> : null}
          {categoriesError ? <Text style={styles.errorText}>{categoriesError}</Text> : null}
          <CategoryGrid categories={categories} onSelect={setSelectedCategoryId} selectedId={selectedCategoryId} />
          {categoryError ? <Text style={styles.errorText}>{categoryError}</Text> : null}
        </View>

        <View style={styles.sectionSpacing}>
          <LentBorrowedForm
            onPersonNameChange={setSplitWithName}
            onTypeChange={(value) => {
              setEntryType(value);
              if (value !== 'expense') {
                setIsSplitEnabled(false);
              }
            }}
            personName={splitWithName}
            selectedType={entryType}
            showValidation={showValidation}
          />
          {personError ? <Text style={styles.errorText}>{personError}</Text> : null}

          {entryType === 'expense' ? (
            <SplitExpenseForm
              amountText={amountText}
              customSplitAmountText={customSplitAmountText}
              enabled={isSplitEnabled}
              onCustomSplitAmountTextChange={setCustomSplitAmountText}
              onEnabledChange={setIsSplitEnabled}
              onSplitTypeChange={setSplitType}
              onSplitWithChange={setSplitWithName}
              showValidation={showValidation}
              splitType={splitType}
              splitWith={splitWithName}
            />
          ) : null}
          {splitAmountError ? <Text style={styles.errorText}>{splitAmountError}</Text> : null}

          <Text style={styles.helperText}>Date: {today}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isNoteVisible ? 'Hide note' : 'Add note'}
            accessibilityHint={isNoteVisible ? 'Double tap to hide the note field' : 'Double tap to show the note field'}
            onPress={() => setIsNoteVisible((currentValue) => !currentValue)}
            style={styles.noteToggle}
            testID="add-expense-note-toggle"
          >
            <Text style={styles.noteToggleText}>{isNoteVisible ? 'Hide note' : 'Add note'}</Text>
          </Pressable>
          {isNoteVisible ? (
            <TextInput
              accessibilityLabel="Expense note"
              accessibilityHint="Enter an optional note for this expense"
              multiline
              onChangeText={setNoteText}
              placeholder="Optional note"
              style={styles.noteInput}
              testID="add-expense-note-input"
              value={noteText}
            />
          ) : null}
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isSaving ? 'Saving expense' : 'Save expense'}
          accessibilityHint="Double tap to save this expense"
          accessibilityState={{ disabled: isSaving }}
          disabled={isSaving}
          onPress={() => {
            void handleSave();
          }}
          style={[styles.saveButton, isSaving ? styles.buttonDisabled : undefined]}
          testID="add-expense-save-button"
        >
          <Text style={styles.saveButtonText}>{isSaving ? 'Saving...' : 'Save'}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  amountInput: {
    borderRadius: 16,
    borderWidth: 1,
    fontSize: 28,
    fontWeight: '700',
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  content: {
    padding: 18,
  },
  errorText: {
    fontSize: 13,
    marginTop: 8,
  },
  flex: {
    flex: 1,
  },
  helperText: {
    fontSize: 14,
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  noteInput: {
    borderRadius: 14,
    borderWidth: 1,
    minHeight: 110,
    paddingHorizontal: 14,
    paddingTop: 14,
    textAlignVertical: 'top',
  },
  noteToggle: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  noteToggleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 28,
    paddingVertical: 16,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  sectionSpacing: {
    marginTop: 24,
  },
});
