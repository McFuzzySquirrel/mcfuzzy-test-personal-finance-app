import { act, renderHook, waitFor } from '@testing-library/react-native';

import * as categoriesDb from '@/db/categories';
import { useCategories } from '@/hooks/useCategories';
import { useDatabase } from '@/store/DatabaseProvider';
import type { Category } from '@/types';

jest.mock('@/store/DatabaseProvider', () => ({
  useDatabase: jest.fn(),
}));

jest.mock('@/db/categories');

const mockDb = {
  execAsync: jest.fn(),
  getAllAsync: jest.fn(),
  getFirstAsync: jest.fn(),
  runAsync: jest.fn(),
  withTransactionAsync: jest.fn(async (cb: () => Promise<void>) => cb()),
};

const mockCategory: Category = { id: 'cat-1', name: 'Food', isCustom: false };
const mockCustomCategory: Category = { id: 'custom-1', name: 'Misc', isCustom: true };

beforeEach(() => {
  jest.clearAllMocks();
  (useDatabase as jest.Mock).mockReturnValue(mockDb);
});

describe('useCategories', () => {
  it('loads categories on mount', async () => {
    (categoriesDb.getAllCategories as jest.Mock).mockResolvedValue([mockCategory]);

    const { result } = renderHook(() => useCategories());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.categories).toEqual([mockCategory]);
    expect(result.current.error).toBeNull();
    expect(categoriesDb.getAllCategories).toHaveBeenCalledWith(mockDb);
  });

  it('starts loading as true', () => {
    (categoriesDb.getAllCategories as jest.Mock).mockResolvedValue([]);

    const { result } = renderHook(() => useCategories());

    expect(result.current.isLoading).toBe(true);
  });

  it('sets error when load fails with an Error instance', async () => {
    (categoriesDb.getAllCategories as jest.Mock).mockRejectedValue(new Error('Query failed'));

    const { result } = renderHook(() => useCategories());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Query failed');
    expect(result.current.categories).toEqual([]);
  });

  it('uses generic message for non-Error rejections', async () => {
    (categoriesDb.getAllCategories as jest.Mock).mockRejectedValue(42);

    const { result } = renderHook(() => useCategories());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Unable to load categories.');
  });

  it('creates a category and refreshes', async () => {
    (categoriesDb.getAllCategories as jest.Mock).mockResolvedValue([mockCategory]);
    (categoriesDb.insertCategory as jest.Mock).mockResolvedValue(mockCustomCategory);

    const { result } = renderHook(() => useCategories());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    (categoriesDb.getAllCategories as jest.Mock).mockResolvedValue([mockCategory, mockCustomCategory]);

    let created: Category | undefined;
    await act(async () => {
      created = await result.current.createCategory({ name: 'Misc', isCustom: true });
    });

    expect(created).toEqual(mockCustomCategory);
    expect(categoriesDb.insertCategory).toHaveBeenCalledWith(mockDb, { name: 'Misc', isCustom: true });
    expect(result.current.categories).toEqual([mockCategory, mockCustomCategory]);
  });

  it('saves (updates) a category and refreshes', async () => {
    (categoriesDb.getAllCategories as jest.Mock).mockResolvedValue([mockCategory]);
    const updated: Category = { ...mockCategory, name: 'Groceries' };
    (categoriesDb.updateCategory as jest.Mock).mockResolvedValue(updated);

    const { result } = renderHook(() => useCategories());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let saved: Category | undefined;
    await act(async () => {
      saved = await result.current.saveCategory('cat-1', { name: 'Groceries' });
    });

    expect(saved).toEqual(updated);
    expect(categoriesDb.updateCategory).toHaveBeenCalledWith(mockDb, 'cat-1', { name: 'Groceries' });
  });

  it('removes a category and refreshes', async () => {
    (categoriesDb.getAllCategories as jest.Mock).mockResolvedValue([mockCategory, mockCustomCategory]);
    (categoriesDb.deleteCategory as jest.Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useCategories());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    (categoriesDb.getAllCategories as jest.Mock).mockResolvedValue([mockCategory]);

    await act(async () => {
      await result.current.removeCategory('custom-1');
    });

    expect(categoriesDb.deleteCategory).toHaveBeenCalledWith(mockDb, 'custom-1');
    expect(result.current.categories).toEqual([mockCategory]);
  });

  it('refreshCategories is callable directly', async () => {
    (categoriesDb.getAllCategories as jest.Mock).mockResolvedValue([]);

    const { result } = renderHook(() => useCategories());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    (categoriesDb.getAllCategories as jest.Mock).mockResolvedValue([mockCategory]);
    await act(async () => {
      await result.current.refreshCategories();
    });

    expect(result.current.categories).toEqual([mockCategory]);
  });
});
