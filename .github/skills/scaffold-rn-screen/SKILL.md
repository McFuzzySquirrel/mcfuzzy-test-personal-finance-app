---
name: scaffold-rn-screen
description: >
  Creates a new React Native screen file following project conventions: TypeScript
  typed navigation props, basic layout scaffold, StyleSheet or NativeWind class
  setup, and registration in the root navigator. Use this skill whenever a new
  screen needs to be created in the app.
---

# Skill: Scaffold a React Native Screen

You are creating a new screen in a React Native (Expo) + TypeScript project that uses React Navigation v7 and NativeWind (or StyleSheet).

## Reference

PRD: [docs/prd/student-finance-app-prd.md](../../../docs/prd/student-finance-app-prd.md)

- §7.2 Project Structure
- §7.1 Technology Stack (React Navigation, NativeWind, TypeScript strict)

---

## Step 1: Gather Requirements

Ask (or infer from context):

1. **Screen name** — What is the screen called? (e.g., `AddExpense`, `Transactions`)
2. **Route name** — What is its route key in the navigator? (e.g., `AddExpense`)
3. **Navigator type** — Is it a bottom tab screen or a stack screen pushed from another screen?
4. **Props / params** — Does the screen receive navigation params (e.g., an `expenseId` for editing)?
5. **Primary purpose** — One sentence describing what the screen does

---

## Step 2: Create the Screen File

Create `app/{screen-name}.tsx` with this structure:

```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
// OR for tab screens:
// import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { RootStackParamList } from '@/app/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, '{RouteName}'>;

export default function {ScreenName}Screen({ navigation, route }: Props) {
  return (
    <View style={styles.container}>
      <Text>{ScreenName} Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
```

Rules:
- Use `NativeStackScreenProps` for stack screens, `BottomTabScreenProps` for tab screens
- Import path aliases (`@/`) — no relative `../` imports across feature boundaries
- Export as `default`
- TypeScript strict — no `any` types; params typed in `RootStackParamList` or `RootTabParamList`

---

## Step 3: Register in Navigator

Open `app/navigation/RootNavigator.tsx` and add the new screen:

```tsx
// For a stack screen:
<Stack.Screen name="{RouteName}" component={import('../{screen-name}').then(m => m.default)} />

// For a tab screen:
<Tab.Screen
  name="{RouteName}"
  component={{ScreenName}Screen}
  options={{ title: '{Tab Label}', tabBarIcon: ... }}
/>
```

---

## Step 4: Add Param Types

Open `app/navigation/types.ts` and add the new route to the appropriate param list:

```ts
// If the screen takes no params:
{RouteName}: undefined;

// If the screen takes params:
{RouteName}: { expenseId: string };
```

---

## Step 5: Verify

Run `tsc --noEmit` to confirm no TypeScript errors were introduced by the new route or screen.

---

## Output

- `app/{screen-name}.tsx` — created
- `app/navigation/RootNavigator.tsx` — updated with new screen registration
- `app/navigation/types.ts` — updated with new param type
- No TypeScript errors (`tsc --noEmit` passes)
