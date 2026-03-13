import React, { useEffect, useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ActivityIndicator,
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
import type { RootStackParamList } from '@/app/navigation/types';
import { useCategories } from '@/hooks/useCategories';
import { useExpenses } from '@/hooks/useExpenses';
import type { Expense } from '@/types';

type EditExpenseScreenProps = NativeStackScreenProps<RootStackParamList, 'EditExpense'>;

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

function amountToInputValue(expense: Expense): string {
  return (expense.amount / 100).toFixed(2);
}

export default function EditExpenseScreen({ navigation, route }: EditExpenseScreenProps): React.JSX.Element {
  const { categories, error: categoriesError, isLoading: isLoadingCategories } = useCategories();
  const { getExpense, removeExpense, saveExpense } = useExpenses();
  const [expense, setExpense] = useState<Expense | null>(null);
  const [isLoadingExpense, setIsLoadingExpense] = useState(true);
  const [amountText, setAmountText] = useState('');
  const [noteText, setNoteText] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showValidation, setShowValidation] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadExpense = async (): Promise<void> => {
      setIsLoadingExpense(true);

      try {
        const loadedExpense = await getExpense(route.params.expenseId);

        if (!isMounted) {
          return;
        }

        if (!loadedExpense) {
          Alert.alert('Expense not found', 'This expense no longer exists.', [
            {
              onPress: () => navigation.goBack(),
              text: 'OK',
            },
          ]);
          return;
        }

        setExpense(loadedExpense);
        setAmountText(amountToInputValue(loadedExpense));
        setNoteText(loadedExpense.note ?? '');
        setSelectedCategoryId(loadedExpense.categoryId);
      } catch (loadError) {
        if (isMounted) {
          Alert.alert('Unable to load expense', loadError instanceof Error ? loadError.message : 'Please try again.');
        }
      } finally {
        if (isMounted) {
          setIsLoadingExpense(false);
        }
      }
    };

    void loadExpense();

    return () => {
      isMounted = false;
    };
  }, [getExpense, navigation, route.params.expenseId]);

  const amountInCents = parseAmountToCents(amountText);
  const amountError = showValidation && (!amountInCents || amountInCents <= 0) ? 'Enter an amount above 0.' : null;
  const categoryError = showValidation && !selectedCategoryId ? 'Choose a category.' : null;

  const handleSave = async (): Promise<void> => {
    if (!expense) {
      return;
    }

    setShowValidation(true);

    if (!amountInCents || amountInCents <= 0 || !selectedCategoryId) {
      return;
    }

    setIsSaving(true);

    try {
      const updatedExpense = await saveExpense(expense.id, {
        amount: amountInCents,
        categoryId: selectedCategoryId,
        note: noteText.trim().length > 0 ? noteText.trim() : '',
      });
      setExpense(updatedExpense);
      navigation.goBack();
    } catch (saveError) {
      Alert.alert('Unable to update expense', saveError instanceof Error ? saveError.message : 'Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (): Promise<void> => {
    if (!expense) {
      return;
    }

    try {
      await removeExpense(expense.id);
      navigation.goBack();
    } catch (deleteError) {
      Alert.alert('Unable to delete expense', deleteError instanceof Error ? deleteError.message : 'Please try again.');
    }
  };

  if (isLoadingExpense) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!expense) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Expense unavailable.</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}> 
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Amount</Text>
        <TextInput
          keyboardType="decimal-pad"
          onChangeText={(value) => setAmountText(sanitizeAmountInput(value))}
          style={styles.amountInput}
          testID="edit-expense-amount-input"
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
          <Text style={styles.helperText}>Date: {expense.date}</Text>
          {expense.type !== 'expense' ? <Text style={styles.helperText}>Type: {expense.type}</Text> : null}
          <Text style={styles.label}>Note</Text>
          <TextInput
            multiline
            onChangeText={setNoteText}
            placeholder="Optional note"
            style={styles.noteInput}
            testID="edit-expense-note-input"
            value={noteText}
          />
        </View>

        <Pressable
          disabled={isSaving}
          onPress={() => {
            void handleSave();
          }}
          style={[styles.saveButton, isSaving ? styles.buttonDisabled : undefined]}
          testID="edit-expense-save-button"
        >
          <Text style={styles.saveButtonText}>{isSaving ? 'Saving...' : 'Save'}</Text>
        </Pressable>

        <Pressable
          onPress={() => {
            Alert.alert('Delete expense', 'This will permanently remove the expense.', [
              { style: 'cancel', text: 'Cancel' },
              {
                onPress: () => {
                  void handleDelete();
                },
                style: 'destructive',
                text: 'Delete',
              },
            ]);
          }}
          style={styles.deleteButton}
          testID="edit-expense-delete-button"
        >
          <Text style={styles.deleteButtonText}>Delete</Text>
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
  deleteButton: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 12,
    paddingVertical: 16,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '700',
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
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  loadingContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  noteInput: {
    borderRadius: 14,
    borderWidth: 1,
    minHeight: 110,
    paddingHorizontal: 14,
    paddingTop: 14,
    textAlignVertical: 'top',
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
