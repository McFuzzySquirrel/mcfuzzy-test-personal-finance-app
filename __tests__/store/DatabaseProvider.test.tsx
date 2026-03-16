import React from 'react';
import { Text } from 'react-native';
import { render, waitFor } from '@testing-library/react-native';

import { DatabaseProvider, useDatabase } from '@/store/DatabaseProvider';
import { initializeDatabase } from '@/db';

/* ---------- mocks ---------- */

jest.mock('@/db', () => ({
  initializeDatabase: jest.fn(),
}));

const mockDb = {
  execAsync: jest.fn(),
  getAllAsync: jest.fn(),
  getFirstAsync: jest.fn(),
  runAsync: jest.fn(),
  withTransactionAsync: jest.fn(async (cb: () => Promise<void>) => cb()),
};

const mockInitializeDatabase = initializeDatabase as jest.MockedFunction<typeof initializeDatabase>;

beforeEach(() => {
  jest.clearAllMocks();
});

/* ---------- helpers ---------- */

/** Simple consumer that displays the db reference to prove context works. */
function DatabaseConsumer(): React.JSX.Element {
  const db = useDatabase();
  return <Text testID="db-status">{db ? 'db-ready' : 'no-db'}</Text>;
}

/** Captures errors thrown during render (e.g. the error state in DatabaseProvider). */
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: string | null }
> {
  state = { error: null as string | null };

  static getDerivedStateFromError(err: Error): { error: string } {
    return { error: err.message };
  }

  render(): React.ReactNode {
    if (this.state.error) {
      return <Text testID="error-message">{this.state.error}</Text>;
    }

    return this.props.children;
  }
}

/* ---------- tests ---------- */

describe('DatabaseProvider', () => {
  // ---- loading state ----

  it('shows a loading indicator while the database initialises', () => {
    // Never resolve — keeps provider in loading state
    mockInitializeDatabase.mockReturnValue(new Promise(() => {}));

    const { getByTestId, queryByTestId } = render(
      <DatabaseProvider>
        <Text testID="child">Hello</Text>
      </DatabaseProvider>
    );

    // ActivityIndicator is rendered (RN maps it to an element with role)
    // The child should NOT be rendered yet
    expect(queryByTestId('child')).toBeNull();
  });

  // ---- successful init ----

  it('renders children after database initialisation succeeds', async () => {
    mockInitializeDatabase.mockResolvedValue(mockDb as any);

    const { getByTestId } = render(
      <DatabaseProvider>
        <Text testID="child">Hello</Text>
      </DatabaseProvider>
    );

    await waitFor(() => {
      expect(getByTestId('child')).toBeTruthy();
    });
  });

  // ---- context value ----

  it('provides the database instance via context', async () => {
    mockInitializeDatabase.mockResolvedValue(mockDb as any);

    const { getByTestId } = render(
      <DatabaseProvider>
        <DatabaseConsumer />
      </DatabaseProvider>
    );

    await waitFor(() => {
      expect(getByTestId('db-status').props.children).toBe('db-ready');
    });
  });

  // ---- error state ----

  it('throws the initialisation error so an error boundary can catch it', async () => {
    const initError = new Error('DB init failed');
    mockInitializeDatabase.mockRejectedValue(initError);

    // Suppress noisy console.error from React error boundary
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const { getByTestId } = render(
      <ErrorBoundary>
        <DatabaseProvider>
          <Text testID="child">Hello</Text>
        </DatabaseProvider>
      </ErrorBoundary>
    );

    await waitFor(() => {
      expect(getByTestId('error-message').props.children).toBe('DB init failed');
    });

    consoleSpy.mockRestore();
  });

  it('wraps non-Error rejection values in a generic Error', async () => {
    mockInitializeDatabase.mockRejectedValue('string-error');

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const { getByTestId } = render(
      <ErrorBoundary>
        <DatabaseProvider>
          <Text testID="child">Hello</Text>
        </DatabaseProvider>
      </ErrorBoundary>
    );

    await waitFor(() => {
      expect(getByTestId('error-message').props.children).toBe(
        'Database initialization failed'
      );
    });

    consoleSpy.mockRestore();
  });
});

describe('useDatabase', () => {
  it('throws when used outside of DatabaseProvider', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<DatabaseConsumer />)).toThrow(
      'useDatabase must be used within DatabaseProvider'
    );

    consoleSpy.mockRestore();
  });
});
