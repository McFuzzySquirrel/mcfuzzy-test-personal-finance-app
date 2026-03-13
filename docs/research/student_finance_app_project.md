# Student Personal Finance App -- Project Guide

A simple Android personal finance app designed for a university student
to track spending, manage a budget, and understand where their money
goes.

------------------------------------------------------------------------

# 1. Core Problem to Solve

Most students struggle with one key question:

> "Where did my money go this month?"

The app should focus on three outcomes:

1.  Track expenses quickly\
2.  Show where money goes\
3.  Help avoid overspending

The goal is simplicity and usefulness, not full banking functionality.

------------------------------------------------------------------------

# 2. Minimum Viable Product (MVP)

These are the essential features to build first.

## 1. Quick Expense Entry

Users must be able to log spending in seconds.

Example:

    R45 – Coffee
    Category: Food

Fields:

-   Amount
-   Category
-   Optional note
-   Date (auto)

Fast entry is critical. If logging an expense takes too long, people
stop using the app.

------------------------------------------------------------------------

## 2. Categories

Users should see where their money goes.

Example categories:

-   Food
-   Transport
-   Rent
-   Entertainment
-   Books
-   Subscriptions
-   Other

Allow custom categories so users can personalise the app.

------------------------------------------------------------------------

## 3. Monthly Budget

Users can set limits per category.

Example:

    Food: R2000
    Transport: R800
    Entertainment: R1000

Display progress:

    Food: R1200 / R2000

------------------------------------------------------------------------

## 4. Dashboard

A summary screen showing:

-   Total spent this month
-   Remaining budget
-   Largest spending category

Example:

    Spent this month: R5 450
    Remaining: R2 550
    Top category: Food

------------------------------------------------------------------------

## 5. Spending Charts

Simple visual insights such as:

-   Pie chart by category
-   Monthly spending trend

Charts help users understand spending behaviour quickly.

------------------------------------------------------------------------

# 3. Student-Specific Features

These are especially useful for university students.

## Split Expenses with Friends

Example:

    Pizza: R300
    You paid
    Friend owes: R150

------------------------------------------------------------------------

## Track Borrowed Money

Example:

    Lent to Mike: R200

------------------------------------------------------------------------

## Recurring Expenses

Example:

    Spotify – R60/month
    Netflix – R159
    Gym – R350

Recurring transactions help track subscriptions.

------------------------------------------------------------------------

## Weekly Spending Insights

Example:

    This week:
    Food: R450
    Coffee: R220
    Uber: R180

------------------------------------------------------------------------

# 4. Nice-to-Have Features (Version 2)

These can be added later.

### Receipt Scanner

Take a photo of a receipt and automatically extract the amount.

### Bank Integration

Automatically import transactions from bank accounts.

### AI Spending Insights

Example:

    You spent 35% more on food this week.

### Gamification

Features like:

-   savings goals
-   spending streaks
-   progress badges

These help build better financial habits.

------------------------------------------------------------------------

# 5. Privacy Design

Recommended approach:

Local-first data storage

Store everything locally on the device.

Example:

    SQLite database

Benefits:

-   Works offline
-   More private
-   Easier architecture

------------------------------------------------------------------------

# 6. Simple UI Structure

The app can be built with only four screens.

### 1. Dashboard

Overview of spending and budgets.

### 2. Add Expense

Fast input screen for logging spending.

### 3. Transactions

Full list of expenses.

### 4. Insights

Charts and financial insights.

------------------------------------------------------------------------

# 7. Example Data Model

## Expense

    id
    amount
    category
    note
    date

## Budget

    category
    limit
    month

------------------------------------------------------------------------

# 8. Suggested Tech Stack

### Option A (Modern Android)

-   Kotlin
-   Jetpack Compose
-   Room (SQLite)

### Option B (Cross Platform)

-   Flutter
-   SQLite

### Option C (Web Technology)

-   React Native

------------------------------------------------------------------------

# 9. Parent-Friendly Feature

Add monthly report export.

Example:

    Export PDF / CSV
    Share report

------------------------------------------------------------------------

# 10. Example Development Roadmap

### Week 1

Expense tracking

### Week 2

Categories and dashboard

### Week 3

Budget functionality

### Week 4

Charts and insights

------------------------------------------------------------------------

# 11. Future AI Feature Idea

An AI financial assistant.

Example question:

"Can I afford to eat out tonight?"

Example response:

    You have R420 left in your food budget this week.

------------------------------------------------------------------------

# Key Design Principle

If logging an expense takes longer than 5 seconds, users will stop using
the app.

Speed and simplicity should drive all design decisions.
