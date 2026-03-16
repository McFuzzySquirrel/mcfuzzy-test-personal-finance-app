import React, { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { CompositeScreenProps } from '@react-navigation/native';
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
import AddRecurringModal from '@/components/AddRecurringModal';
import { useBudgets } from '@/hooks/useBudgets';
import { useCategories } from '@/hooks/useCategories';
import { useRecurring } from '@/hooks/useRecurring';
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

function getNextDueDate(templateDate: string): string {
  const templateDay = Math.min(28, Math.max(1, dayjs(templateDate).date()));
  const today = dayjs();
  const thisMonthDue = today.date(templateDay);

  return (thisMonthDue.isBefore(today, 'day') ? thisMonthDue.add(1, 'month') : thisMonthDue).format('D MMM YYYY');
}

export default function BudgetScreen({ navigation }: BudgetScreenProps): React.JSX.Element {
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
  const [isRecurringModalVisible, setIsRecurringModalVisible] = useState(false);
  const [isRecurringSaving, setIsRecurringSaving] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { addRecurringTemplate, error: recurringError, recurringList, refreshRecurring } = useRecurring();

  useEffect(() => {
    const nextDrafts = categories.reduce<Record<string, string>>((accumulator, category) => {
      const currentBudget = budgetByCategoryId.get(category.id);
      accumulator[category.id] = currentBudget ? formatCentsForInput(currentBudget.limitAmount) : '';
      return accumulator;
    }, {});

    setBudgetDrafts(nextDrafts);
  }, [budgetByCategoryId, categories]);

  useEffect(() => {
    void refreshRecurring();
  }, [refreshRecurring]);

  const categoryNameById = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name] as const)),
    [categories]
  );

  const handleSaveRecurring = async (draft: {
    amount: number;
    categoryId: string;
    dayOfMonth: number;
    note?: string;
  }): Promise<void> => {
    setIsRecurringSaving(true);

    try {
      await addRecurringTemplate(draft);
      setIsRecurringModalVisible(false);
      showFeedback('Recurring expense saved');
    } catch (saveError) {
      showAlert(
        'Unable to save recurring expense',
        saveError instanceof Error ? saveError.message : 'Please try again.'
      );
    } finally {
      setIsRecurringSaving(false);
    }
  };

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
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} testID="budget-scroll-view">
      <Text style={styles.title} testID="budget-title">Budget settings</Text>
      <Text style={styles.subtitle}>{formatMonthLabel(currentMonth)}</Text>

      <View style={styles.headerActions}>
        <Pressable
          accessibilityHint="Copies budget limits from the previous month"
          accessibilityLabel="Copy from last month"
          accessibilityRole="button"
          onPress={() => void handleCopyFromLastMonth()}
          style={styles.ghostButton}
        >
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
              accessibilityLabel={`Monthly budget limit for ${category.name}`}
              keyboardType="decimal-pad"
              onChangeText={(value) =>
                setBudgetDrafts((currentDrafts) => ({
                  ...currentDrafts,
                  [category.id]: value,
                }))
              }
              placeholder="0.00"
              style={styles.amountInput}
              testID={`budget-input-${category.id}`}
              value={budgetDrafts[category.id] ?? ''}
            />
          </View>
        ))}

        <Pressable
          accessibilityLabel={isSaving ? 'Saving budgets' : 'Save budgets'}
          accessibilityRole="button"
          accessibilityState={{ disabled: isSaving }}
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
        <Pressable
          accessibilityHint="Opens a form to add a new recurring expense"
          accessibilityLabel="Add recurring expense"
          accessibilityRole="button"
          onPress={() => setIsRecurringModalVisible(true)}
          style={styles.ghostButton}
          testID="budget-add-recurring-button"
        >
          <Text style={styles.ghostButtonText}>Add recurring</Text>
        </Pressable>

        {recurringList.length === 0 ? (
          <Text style={styles.statusText}>No recurring expenses saved yet.</Text>
        ) : (
          recurringList.map((expense) => (
            <Pressable
              accessibilityHint="Opens expense details for editing"
              accessibilityLabel={`${expense.note?.trim() || 'Recurring expense'}, ${formatZAR(expense.amount)}, ${categoryNameById.get(expense.categoryId) ?? 'Uncategorized'}`}
              accessibilityRole="button"
              key={expense.id}
              onPress={() => navigation.navigate('EditExpense', { expenseId: expense.id })}
              style={styles.recurringCard}
              testID={`budget-recurring-row-${expense.id}`}
            >
              <View importantForAccessibility="no-hide-descendants">
                <Text style={styles.recurringTitle}>{expense.note?.trim() || 'Recurring expense'}</Text>
                <Text style={styles.recurringMeta}>
                  {categoryNameById.get(expense.categoryId) ?? 'Uncategorized'} | Monthly | Next due {getNextDueDate(expense.date)}
                </Text>
              </View>
              <Text importantForAccessibility="no" style={styles.recurringAmount}>{formatZAR(expense.amount)}</Text>
            </Pressable>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Pressable
          accessibilityHint={isAddCategoryVisible ? 'Hides the custom category form' : 'Shows a form to create a custom category'}
          accessibilityLabel="Add custom category"
          accessibilityRole="button"
          onPress={() => setIsAddCategoryVisible((currentValue) => !currentValue)}
          style={styles.ghostButton}
        >
          <Text style={styles.ghostButtonText}>Add custom category</Text>
        </Pressable>

        {isAddCategoryVisible ? (
          <View style={styles.addCategoryPanel}>
            <TextInput
              accessibilityLabel="Custom category name"
              onChangeText={setCustomCategoryName}
              placeholder="Category name"
              style={styles.textInput}
              value={customCategoryName}
            />
            <TextInput
              accessibilityLabel="Custom category icon"
              onChangeText={setCustomCategoryIcon}
              placeholder="Optional icon"
              style={styles.textInput}
              value={customCategoryIcon}
            />
            <Pressable
              accessibilityLabel="Create category"
              accessibilityRole="button"
              onPress={() => void handleCreateCategory()}
              style={styles.inlineButton}
            >
              <Text style={styles.inlineButtonText}>Create category</Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      <AddRecurringModal
        categories={categories}
        isSaving={isRecurringSaving}
        onClose={() => setIsRecurringModalVisible(false)}
        onSave={handleSaveRecurring}
        visible={isRecurringModalVisible}
      />
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
