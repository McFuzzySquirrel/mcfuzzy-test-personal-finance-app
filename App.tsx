import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { RootNavigator } from '@/app/navigation/RootNavigator';
import { useRecurring } from '@/hooks/useRecurring';
import { DatabaseProvider } from '@/store/DatabaseProvider';

function RecurringOnOpenRunner(): null {
  const { autoCreateDue } = useRecurring();

  React.useEffect(() => {
    void autoCreateDue();
  }, [autoCreateDue]);

  return null;
}

export default function App(): React.JSX.Element {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <DatabaseProvider>
          <RecurringOnOpenRunner />
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </DatabaseProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
