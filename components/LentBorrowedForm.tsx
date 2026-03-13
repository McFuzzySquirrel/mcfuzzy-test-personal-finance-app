import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import type { ExpenseType } from '@/types';

type LentBorrowedType = Extract<ExpenseType, 'expense' | 'lent' | 'borrowed'>;

export interface LentBorrowedFormProps {
  personName: string;
  selectedType: LentBorrowedType;
  showValidation: boolean;
  onPersonNameChange: (value: string) => void;
  onTypeChange: (value: LentBorrowedType) => void;
}

const OPTIONS: Array<{ label: string; value: LentBorrowedType }> = [
  { label: 'Regular expense', value: 'expense' },
  { label: 'Lent money', value: 'lent' },
  { label: 'Borrowed money', value: 'borrowed' },
];

export default function LentBorrowedForm({
  personName,
  selectedType,
  showValidation,
  onPersonNameChange,
  onTypeChange,
}: LentBorrowedFormProps): React.JSX.Element {
  const requiresPersonName = selectedType === 'lent' || selectedType === 'borrowed';
  const personNameError =
    showValidation && requiresPersonName && personName.trim().length === 0 ? 'Enter the person name.' : null;

  return (
    <View style={styles.section}>
      <Text style={styles.label}>Expense type</Text>
      <View style={styles.segmentRow} testID="add-expense-type-toggle">
        {OPTIONS.map((option) => {
          const isSelected = option.value === selectedType;

          return (
            <Pressable
              key={option.value}
              onPress={() => onTypeChange(option.value)}
              style={[styles.segmentOption, isSelected ? styles.segmentOptionSelected : undefined]}
              testID={`add-expense-type-${option.value}`}
            >
              <Text style={styles.segmentOptionText}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {requiresPersonName ? (
        <View style={styles.personRow}>
          <Text style={styles.subLabel}>Person</Text>
          <TextInput
            onChangeText={onPersonNameChange}
            placeholder="Who is this with?"
            style={styles.input}
            testID="add-expense-lent-borrowed-person-input"
            value={personName}
          />
          {personNameError ? <Text style={styles.errorText}>{personNameError}</Text> : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  errorText: {
    fontSize: 13,
    marginTop: 8,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  personRow: {
    marginTop: 12,
  },
  section: {
    marginTop: 24,
  },
  segmentOption: {
    borderRadius: 999,
    borderWidth: 1,
    marginBottom: 10,
    marginRight: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  segmentOptionSelected: {
    borderWidth: 2,
  },
  segmentOptionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  segmentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  subLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
});
