import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { formatZAR, parseCurrencyInputToCents } from '@/utils/currency';

export type SplitType = 'equal' | 'custom';

export interface SplitExpenseFormProps {
  amountText: string;
  customSplitAmountText: string;
  enabled: boolean;
  showValidation: boolean;
  splitType: SplitType;
  splitWith: string;
  onCustomSplitAmountTextChange: (value: string) => void;
  onEnabledChange: (value: boolean) => void;
  onSplitTypeChange: (value: SplitType) => void;
  onSplitWithChange: (value: string) => void;
}

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

export default function SplitExpenseForm({
  amountText,
  customSplitAmountText,
  enabled,
  showValidation,
  splitType,
  splitWith,
  onCustomSplitAmountTextChange,
  onEnabledChange,
  onSplitTypeChange,
  onSplitWithChange,
}: SplitExpenseFormProps): React.JSX.Element {
  const amountInCents = parseCurrencyInputToCents(amountText);
  const customSplitInCents = parseCurrencyInputToCents(customSplitAmountText);
  const equalSplitAmount = amountInCents ? Math.round(amountInCents / 2) : null;
  const splitAmount = splitType === 'equal' ? equalSplitAmount : customSplitInCents;

  const splitWithError = showValidation && enabled && splitWith.trim().length === 0 ? 'Enter who you share with.' : null;
  const splitAmountError =
    showValidation && enabled && (!splitAmount || splitAmount <= 0 || (amountInCents !== null && splitAmount > amountInCents))
      ? 'Split amount must be above 0 and not greater than total amount.'
      : null;

  return (
    <View style={styles.section}>
      <Pressable
        onPress={() => onEnabledChange(!enabled)}
        style={styles.toggle}
        testID="add-expense-split-toggle"
      >
        <Text style={styles.toggleText}>{enabled ? 'Hide split details' : 'Add split details'}</Text>
      </Pressable>

      {enabled ? (
        <View style={styles.panel}>
          <Text style={styles.label}>Who do you share with?</Text>
          <TextInput
            onChangeText={onSplitWithChange}
            placeholder="Name"
            style={styles.input}
            testID="add-expense-split-with-input"
            value={splitWith}
          />
          {splitWithError ? <Text style={styles.errorText}>{splitWithError}</Text> : null}

          <Text style={styles.label}>Split type</Text>
          <View style={styles.optionRow}>
            <Pressable
              onPress={() => onSplitTypeChange('equal')}
              style={[styles.option, splitType === 'equal' ? styles.optionSelected : undefined]}
              testID="add-expense-split-type-equal"
            >
              <Text style={styles.optionText}>Equal</Text>
            </Pressable>
            <Pressable
              onPress={() => onSplitTypeChange('custom')}
              style={[styles.option, splitType === 'custom' ? styles.optionSelected : undefined]}
              testID="add-expense-split-type-custom"
            >
              <Text style={styles.optionText}>Custom</Text>
            </Pressable>
          </View>

          {splitType === 'equal' ? (
            <Text style={styles.helperText} testID="add-expense-split-equal-preview">
              Equal share: {equalSplitAmount ? formatZAR(equalSplitAmount) : 'Enter total amount first'}
            </Text>
          ) : (
            <TextInput
              keyboardType="decimal-pad"
              onChangeText={(value) => onCustomSplitAmountTextChange(sanitizeAmountInput(value))}
              placeholder="Split amount"
              style={styles.input}
              testID="add-expense-split-custom-amount-input"
              value={customSplitAmountText}
            />
          )}
          {splitAmountError ? <Text style={styles.errorText}>{splitAmountError}</Text> : null}
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
  helperText: {
    fontSize: 13,
    marginTop: 8,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  option: {
    borderRadius: 999,
    borderWidth: 1,
    marginRight: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  optionRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  optionSelected: {
    borderWidth: 2,
  },
  optionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  panel: {
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 10,
    padding: 12,
  },
  section: {
    marginTop: 16,
  },
  toggle: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
