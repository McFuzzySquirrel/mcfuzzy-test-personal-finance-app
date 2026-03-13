import type { NavigatorScreenParams } from '@react-navigation/native';

export type RootTabParamList = {
  Dashboard: undefined;
  Transactions: undefined;
  Insights: undefined;
  Budget: undefined;
};

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<RootTabParamList>;
  AddExpense: undefined;
  EditExpense: { expenseId: string };
};
