import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { deleteCategory, getAllCategories, insertCategory, updateCategory } from '@/db/categories';
import { useDatabase } from '@/store/DatabaseProvider';
import type { Category } from '@/types';

export interface UseCategoriesResult {
  categories: Category[];
  error: string | null;
  isLoading: boolean;
  createCategory: (category: Omit<Category, 'id'>) => Promise<Category>;
  refreshCategories: () => Promise<void>;
  removeCategory: (categoryId: string) => Promise<void>;
  saveCategory: (categoryId: string, fields: Partial<Category>) => Promise<Category>;
}

export function useCategories(): UseCategoriesResult {
  const db = useDatabase();
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshCategories = useCallback(async (): Promise<void> => {
    setIsLoading(true);

    try {
      const nextCategories = await getAllCategories(db);
      setCategories(nextCategories);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load categories.');
    } finally {
      setIsLoading(false);
    }
  }, [db]);

  useEffect(() => {
    void refreshCategories();
  }, [refreshCategories]);

  useFocusEffect(
    useCallback(() => {
      void refreshCategories();
      return undefined;
    }, [refreshCategories])
  );

  const createCategory = useCallback(
    async (category: Omit<Category, 'id'>): Promise<Category> => {
      const created = await insertCategory(db, category);
      await refreshCategories();
      return created;
    },
    [db, refreshCategories]
  );

  const saveCategory = useCallback(
    async (categoryId: string, fields: Partial<Category>): Promise<Category> => {
      const updated = await updateCategory(db, categoryId, fields);
      await refreshCategories();
      return updated;
    },
    [db, refreshCategories]
  );

  const removeCategory = useCallback(
    async (categoryId: string): Promise<void> => {
      await deleteCategory(db, categoryId);
      await refreshCategories();
    },
    [db, refreshCategories]
  );

  return {
    categories,
    error,
    isLoading,
    createCategory,
    refreshCategories,
    removeCategory,
    saveCategory,
  };
}