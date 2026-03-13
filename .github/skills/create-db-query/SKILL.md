---
name: create-db-query
description: >
  Creates a new SQLite query helper function in the db/ directory, following
  project conventions: TypeScript-typed parameters and return values, async/await
  with expo-sqlite v2, integer-based currency amounts, and a corresponding Jest
  unit test stub. Use this skill whenever a new database operation is needed.
---

# Skill: Create a Database Query Helper

You are adding a new SQLite query function to a React Native (Expo) + TypeScript project that uses `expo-sqlite` v2 and stores all monetary amounts as integers (cents).

## Reference

PRD: [docs/prd/student-finance-app-prd.md](../../../docs/prd/student-finance-app-prd.md)

- §7.3 Key Data Interfaces (`Expense`, `Category`, `Budget`)
- §20 Open Question #2 (amounts stored as integers in cents)
- database-engineer agent: [.github/agents/database-engineer.md](../../agents/database-engineer.md)

---

## Step 1: Identify the Query

Determine:

1. **File** — Which `db/` file does this belong to? (`expenses.ts`, `categories.ts`, `budgets.ts`, or a new file?)
2. **Function name** — Follow the convention: `verbNoun` (e.g., `getExpensesByMonth`, `upsertBudget`, `deleteCategory`)
3. **Parameters** — What inputs does the function need? (always include `db: SQLiteDatabase` as the first parameter)
4. **Return type** — What TypeScript type does it return? (use types from `@/types/index.ts`)
5. **SQL operation** — SELECT, INSERT, UPDATE, DELETE, or a transaction combining multiple?

---

## Step 2: Write the Query Function

Add to the appropriate file in `db/`:

```ts
import type { SQLiteDatabase } from 'expo-sqlite';
import type { {ReturnType} } from '@/types';

/**
 * {One-sentence description of what this query does.}
 */
export async function {functionName}(
  db: SQLiteDatabase,
  {param}: {paramType},
): Promise<{ReturnType}> {
  const result = await db.getAllAsync<{RowType}>(
    `SELECT ... FROM ... WHERE ...`,
    [{param}],
  );

  return result.map(row => ({
    // map snake_case DB columns to camelCase TypeScript fields
    id: row.id,
    amount: row.amount, // integer cents — do NOT convert here
    // ...
  }));
}
```

**expo-sqlite v2 API reference:**
- `db.getAllAsync<T>(sql, params)` → `Promise<T[]>` — SELECT multiple rows
- `db.getFirstAsync<T>(sql, params)` → `Promise<T | null>` — SELECT single row
- `db.runAsync(sql, params)` → `Promise<SQLiteRunResult>` — INSERT / UPDATE / DELETE
- `db.withTransactionAsync(async () => { ... })` — atomic transaction

**Rules:**
- First parameter is always `db: SQLiteDatabase` (injected by the hook or calling code)
- SQL column names use `snake_case`; TypeScript fields use `camelCase`
- All monetary amounts stay as integers (cents) — never divide by 100 inside `db/`
- No `console.log` in production query code
- Use parameterised queries (`?` placeholders) — never string-interpolate user data into SQL

---

## Step 3: Export the Function

Ensure the function is exported from the `db/` file. Add it to `db/index.ts` re-exports if the file is new.

---

## Step 4: Write the Unit Test

Create (or add to) `__tests__/db/{filename}.test.ts`:

```ts
import { openDatabaseAsync } from 'expo-sqlite';
import { runMigrations } from '@/db';
import { {functionName} } from '@/db/{filename}';

describe('{functionName}', () => {
  let db: Awaited<ReturnType<typeof openDatabaseAsync>>;

  beforeEach(async () => {
    db = await openDatabaseAsync(':memory:');
    await runMigrations(db);
    // seed test data here
  });

  afterEach(async () => {
    await db.closeAsync();
  });

  it('returns {expected result description}', async () => {
    // arrange: insert seed data
    // act: call {functionName}
    // assert: verify returned data
  });

  it('returns empty array / null when no data matches', async () => {
    // act + assert
  });
});
```

---

## Step 5: Verify

1. `tsc --noEmit` — no TypeScript errors
2. `jest __tests__/db/{filename}.test.ts` — new tests pass

---

## Output

- `db/{filename}.ts` — new function added and exported
- `__tests__/db/{filename}.test.ts` — unit test covering happy path and empty/null case
- No TypeScript errors
