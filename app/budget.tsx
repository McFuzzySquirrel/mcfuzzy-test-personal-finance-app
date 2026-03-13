import React, { useCallback, useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { CompositeScreenProps, useFocusEffect } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import type { RootStackParamList, RootTabParamList } from '@/app/navigation/types';
import { getRecurringTemplates } from '@/db/recurring';
import { useBudgets } from '@/hooks/useBudgets';
import { useCategories } from '@/hooks/useCategories';
import { useDatabase } from '@/store/DatabaseProvider';
import type { Expense } from '@/types';
import { formatCentsForInput, formatZAR, parseCurrencyInputToCents } from '@/utils/currency';
import { formatMonthKey, formatMonthLabel } from '@/utils/date';

type BudgetScreenProps = CompositeScreenProps<
  BottomTabScreenProps<RootTabParamList, 'Budget'>,
  NativeStackScreenProps<RootStackParamList>
>;

function showAlert(title: string, message?: string): void {
  globalThis.alert?.(message ? `${title}\n\n${message}` : title);
}

function showFeedback(message: string): void {
  if (Platform.OS === 'android') {
    showAlert(message);
    return;
  }

  showAlert(message);
}

export default function BudgetScreen({ navigation }: BudgetScreenProps): React.JSX.Element {
  const db = useDatabase();
  const currentMonth = formatMonthKey();
  const previousMonth = useMemo(() => dayjs(`${currentMonth}-01`).subtract(1, 'month').format('YYYY-MM'), [currentMonth]);
  const { categories, createCategory, error: categoriesError, isLoading: categoriesLoading } = useCategories();
  const {
    budgetByCategoryId,
    copyBudgetsFromMonth,
    deleteBudgetForCategory,
    error: budgetsError,
    isLoading: budgetsLoading,
    saveBudget,
  } = useBudgets(currentMonth);
  const [budgetDrafts, setBudgetDrafts] = useState<Record<string, string>>({});
  const [customCategoryName, setCustomCategoryName] = useState('');
  const [customCategoryIcon, setCustomCategoryIcon] = useState('');
  const [isAddCategoryVisible, setIsAddCategoryVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [recurringTemplates, setRecurringTemplates] = useState<Expense[]>([]);
  const [recurringError, setRecurringError] = useState<string | null>(null);

  useEffect(() => {
    const nextDrafts = categories.reduce<Record<string, string>>((accumulator, category) => {
      const currentBudget = budgetByCategoryId.get(category.id);
      accumulator[category.id] = currentBudget ? formatCentsForInput(currentBudget.limitAmount) : '';
      return accumulator;
    }, {});

    setBudgetDrafts(nextDrafts);
  }, [budgetByCategoryId, categories]);

  const loadRecurringTemplates = useCallback(async (): Promise<void> => {
    try {
      const nextTemplates = await getRecurringTemplates(db);
      setRecurringTemplates(nextTemplates);
      setRecurringError(null);
    } catch (loadError) {
      setRecurringError(loadError instanceof Error ? loadError.message : 'Unable to load recurring expenses.');
    }
  }, [db]);

  useEffect(() => {
    void loadRecurringTemplates();
  }, [loadRecurringTemplates]);

  useFocusEffect(
    useCallback(() => {
      void loadRecurringTemplates();
      return undefined;
    }, [loadRecurringTemplates])
  );

  const handleSaveBudgets = async (): Promise<void> => {
    setIsSaving(true);

    try {
      for (const category of categories) {
        const draftValue = budgetDrafts[category.id] ?? '';
        const existingBudget = budgetByCategoryId.get(category.id) ?? null;
        const parsedCents = parseCurrencyInputToCents(draftValue);

        if (draftValue.trim().length === 0) {
          if (existingBudget) {
            await deleteBudgetForCategory(category.id);
          }
          continue;
        }

        if (parsedCents === null) {
          throw new Error(`Enter a valid amount for ${category.name}.`);
        }

        if (!existingBudget || existingBudget.limitAmount !== parsedCents) {
          await saveBudget({
            categoryId: category.id,
            limitAmount: parsedCents,
            month: currentMonth,
          });
        }
      }

      showFeedback('Budgets saved');
    } catch (saveError) {
      showAlert('Unable to save budgets', saveError instanceof Error ? saveError.message : 'Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyFromLastMonth = async (): Promise<void> => {
    try {
      await copyBudgetsFromMonth(previousMonth);
      showFeedback('Copied budgets from last month');
    } catch (copyError) {
      showAlert(
        'Unable to copy budgets',
        copyError instanceof Error ? copyError.message : 'Please try again.'
      );
    }
  };

  const handleCreateCategory = async (): Promise<void> => {
    if (customCategoryName.trim().length === 0) {
      showAlert('Category name required', 'Enter a name for the new category.');
      return;
    }

    try {
      await createCategory({
        icon: customCategoryIcon.trim().length > 0 ? customCategoryIcon.trim() : undefined,
        isCustom: true,
        name: customCategoryName.trim(),
      });
      setCustomCategoryName('');
      setCustomCategoryIcon('');
      setIsAddCategoryVisible(false);
      showFeedback('Custom category added');
    } catch (createError) {
      showAlert(
        'Unable to add category',
        createError instanceof Error ? createError.message : 'Please try again.'
      );
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Budget settings</Text>
      <Text style={styles.subtitle}>{formatMonthLabel(currentMonth)}</Text>

      <View style={styles.headerActions}>
        <Pressable onPress={() => void handleCopyFromLastMonth()} style={styles.ghostButton}>
          <Text style={styles.ghostButtonText}>Copy from last month</Text>
        </Pressable>
      </View>

      {(categoriesError ?? budgetsError) ? <Text style={styles.errorText}>{categoriesError ?? budgetsError}</Text> : null}
      {categoriesLoading || budgetsLoading ? <Text style={styles.statusText}>Loading budgets...</Text> : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Monthly limits</Text>
        {categories.map((category) => (
          <View key={category.id} style={styles.categoryRow}>
            <View style={styles.categoryInfo}>
              <Text style={styles.categoryName}>{category.name}</Text>
              <Text style={styles.categoryMeta}>{category.isCustom ? 'Custom category' : 'System category'}</Text>
            </View>
            <TextInput
              keyboardType="decimal-pad"
              onChangeText={(value) =>
                setBudgetDrafts((currentDrafts) => ({
                  ...currentDrafts,
                  [category.id]: value,
                }))
              }
              placeholder="0.00"
              style={styles.amountInput}
              value={budgetDrafts[category.id] ?? ''}
            />
          </View>
        ))}

        <Pressable
          disabled={isSaving}
          onPress={() => {
            void handleSaveBudgets();
          }}
          style={[styles.saveButton, isSaving ? styles.buttonDisabled : undefined]}
          testID="budget-save-button"
        >
          <Text style={styles.saveButtonText}>{isSaving ? 'Saving...' : 'Save'}</Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recurring expenses</Text>
        {recurringError ? <Text style={styles.errorText}>{recurringError}</Text> : null}
        {recurringTemplates.length === 0 ? (
          <Text style={styles.statusText}>No recurring expenses saved yet.</Text>
        ) : (
          recurringTemplates.map((expense) => (
            <Pressable
              key={expense.id}
              onPress={() => navigation.navigate('EditExpense', { expenseId: expense.id })}
              style={styles.recurringCard}
            >
              <View>
                <Text style={styles.recurringTitle}>{expense.note?.trim() || 'Recurring expense'}</Text>
                <Text style={styles.recurringMeta}>{dayjs(expense.date).format('D MMM YYYY')}</Text>
              </View>
              <Text style={styles.recurringAmount}>{formatZAR(expense.amount)}</Text>
            </Pressable>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Pressable onPress={() => setIsAddCategoryVisible((currentValue) => !currentValue)} style={styles.ghostButton}>
          <Text style={styles.ghostButtonText}>Add custom category</Text>
        </Pressable>

        {isAddCategoryVisible ? (
          <View style={styles.addCategoryPanel}>
            <TextInput
              onChangeText={setCustomCategoryName}
              placeholder="Category name"
              style={styles.textInput}
              value={customCategoryName}
            />
            <TextInput
              onChangeText={setCustomCategoryIcon}
              placeholder="Optional icon"
              style={styles.textInput}
              value={customCategoryIcon}
            />
            <Pressable onPress={() => void handleCreateCategory()} style={styles.inlineButton}>
              <Text style={styles.inlineButtonText}>Create category</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  addCategoryPanel: {
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 12,
    padding: 14,
  },
  amountInput: {
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 110,
    paddingHorizontal: 12,
    paddingVertical: 10,
    textAlign: 'right',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  categoryInfo: {
    flex: 1,
    paddingRight: 14,
  },
  categoryMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '700',
  },
  categoryRow: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 10,
    padding: 14,
  },
  content: {
    padding: 18,
    paddingBottom: 40,
  },
  errorText: {
    fontSize: 14,
    marginBottom: 14,
  },
  ghostButton: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  ghostButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  headerActions: {
    marginBottom: 18,
  },
  inlineButton: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 12,
    paddingVertical: 12,
  },
  inlineButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  recurringAmount: {
    fontSize: 14,
    fontWeight: '700',
  },
  recurringCard: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    padding: 14,
  },
  recurringMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  recurringTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  saveButton: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 12,
    paddingVertical: 16,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  section: {
    marginBottom: 22,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  statusText: {
    fontSize: 14,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 10,
  },
  textInput: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 6,
  },
});
