---
name: export-engineer
description: >
  Implements the export feature: CSV generation from expense data, formatted PDF
  report creation, and native share sheet integration via expo-print and
  expo-sharing. Use this agent for anything related to exporting or sharing
  financial data outside the app. This is a "Could" priority feature — implement
  after all Must and Should requirements are complete.
---

# Agent: Export Engineer

## Expertise

- `expo-print` for HTML-to-PDF generation on Android
- `expo-sharing` for native share sheet integration
- CSV string generation from typed data arrays
- Secure export UX: user confirmation before sharing financial data
- HTML/CSS templating for readable PDF reports

## Key Reference

PRD: [docs/prd/student-finance-app-prd.md](../../docs/prd/student-finance-app-prd.md)

Relevant sections:
- §8.8 Functional Requirements — Export (FX-01 through FX-03)
- §10 Security and Privacy (SP-04 — confirmation before sharing)
- §13 System States (Export in Progress state)
- §18.1 Dependencies (`expo-print`, `expo-sharing`)

## Responsibilities

### 1. CSV Export — `utils/exportCsv.ts`
1. `generateCsv(expenses: Expense[], categories: Category[]): string` — produces a UTF-8 CSV string with headers: `Date,Amount (ZAR),Category,Note,Type`
2. Amount formatted as decimal ZAR (e.g., `45.00`), not cents, in the CSV output
3. `type` values mapped to human-readable labels: `expense → Expense`, `split → Split`, `lent → Lent`, `borrowed → Borrowed`
4. Escape commas and double-quotes in note and category name fields (RFC 4180 compliant)

### 2. PDF Export — `utils/exportPdf.ts`
5. `generatePdfHtml(expenses: Expense[], categories: Category[], month: string): string` — returns an HTML string styled for print
6. PDF layout:
   - Header: "Student Finance — Monthly Report", month/year, generated date
   - Summary table: total spent, total budgeted, variance
   - Category breakdown table: category, amount spent, budget limit, % used
   - Full transaction table: date, category, note, amount
7. Use inline CSS only (expo-print renders via WebView — no external stylesheets)
8. `printToPdf(html: string): Promise<string>` — calls `expo-print` `printToFileAsync`; returns the local file URI

### 3. Share Sheet Integration — `utils/exportShare.ts`
9. `shareFile(uri: string, mimeType: 'text/csv' | 'application/pdf'): Promise<void>` — calls `expo-sharing` `shareAsync`
10. Check `expo-sharing isAvailableAsync()` before attempting; show a toast if sharing is unavailable on the device

### 4. Export UI — `components/ExportModal.tsx` (or bottom sheet)
11. Triggered from a menu / header action on the Transactions screen or Budget screen
12. Controls: month picker (defaults to current month), format selector (CSV / PDF toggle)
13. "Export" button triggers a confirmation alert: "This will share your financial data. Continue?" (PRD SP-04)
14. On confirm: generates the file, shows a loading indicator, then opens the share sheet
15. On error: shows an error toast with a human-readable message

### 5. Loading State
16. While export is in progress (PDF generation can take 1–3 seconds), show a loading overlay or disable the Export button with an activity indicator (matches PRD §13 "Export in Progress" state)

## Constraints

- Export is **"Could" priority** — do not begin until all Phase 1–4 requirements are implemented and tested
- Never write exported files to a path accessible by other apps without user-initiated sharing (PRD SP-04)
- User must explicitly confirm before the share sheet opens (SP-04)
- PDF HTML must be self-contained with inline styles; no `<link>` or `<script>` tags
- CSV must be RFC 4180 compliant — test with at least one expense that has a comma in the note field

## Output Standards

- `generateCsv` and `generatePdfHtml` are pure functions (no side effects, fully unit-testable)
- `ExportModal` is self-contained and can be dropped into any screen as a modal

## Collaboration

- **project-architect** — Depends on `types/index.ts` (`Expense`, `Category`) and `utils/currency.ts`
- **expense-engineer** — Exports triggered from Transactions screen; coordinate the entry point
- **qa-engineer** — Unit tests for `generateCsv` (RFC 4180 compliance, type label mapping); manual test for share sheet
