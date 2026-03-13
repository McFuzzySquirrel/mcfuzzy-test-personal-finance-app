import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import type { SQLiteDatabase } from 'expo-sqlite';

import { initializeDatabase } from '@/db';

type DatabaseContextValue = {
  db: SQLiteDatabase;
};

const DatabaseContext = createContext<DatabaseContextValue | null>(null);

type DatabaseProviderProps = {
  children: React.ReactNode;
};

export function DatabaseProvider({ children }: DatabaseProviderProps): React.JSX.Element {
  const [db, setDb] = useState<SQLiteDatabase | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    void initializeDatabase()
      .then((database) => {
        if (isMounted) {
          setDb(database);
        }
      })
      .catch((initError) => {
        if (isMounted) {
          setError(initError instanceof Error ? initError : new Error('Database initialization failed'));
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const value = useMemo(() => {
    if (!db) {
      return null;
    }

    return { db };
  }, [db]);

  if (error) {
    throw error;
  }

  if (!value) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <DatabaseContext.Provider value={value}>{children}</DatabaseContext.Provider>;
}

export function useDatabase(): SQLiteDatabase {
  const context = useContext(DatabaseContext);

  if (!context) {
    throw new Error('useDatabase must be used within DatabaseProvider');
  }

  return context.db;
}

const styles = StyleSheet.create({
  loadingContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
});
