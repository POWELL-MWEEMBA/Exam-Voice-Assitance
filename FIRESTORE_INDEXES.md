# Firestore Index Setup Guide

## Overview

The ExamAssistant app uses Firestore queries that require composite indexes for optimal performance. The app will work without these indexes (using JavaScript sorting as a fallback), but creating them will improve query performance.

## Required Indexes

### 1. Active Exams Index
**Collection:** `exams`  
**Fields:**
- `status` (Ascending)
- `createdAt` (Descending)

**Query:** Get all active exams sorted by creation date (newest first)

**How to Create:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Firestore Database** > **Indexes**
4. Click **Create Index**
5. Set:
   - Collection ID: `exams`
   - Fields to index:
     - Field: `status`, Order: `Ascending`
     - Field: `createdAt`, Order: `Descending`
6. Click **Create**

**Or use the direct link** (if provided in console logs):
- The app will log a direct link when the index is needed
- Click the link to create the index automatically

### 2. Exams by Examiner Index
**Collection:** `exams`  
**Fields:**
- `examinerId` (Ascending)
- `createdAt` (Descending)

**Query:** Get all exams created by a specific examiner, sorted by creation date

**How to Create:**
1. Go to Firebase Console > Firestore Database > Indexes
2. Click **Create Index**
3. Set:
   - Collection ID: `exams`
   - Fields to index:
     - Field: `examinerId`, Order: `Ascending`
     - Field: `createdAt`, Order: `Descending`
4. Click **Create**

### 3. Exam Submissions by Exam Index
**Collection:** `examSubmissions`  
**Fields:**
- `examId` (Ascending)
- `submittedAt` (Descending)

**Query:** Get all submissions for a specific exam, sorted by submission date

**How to Create:**
1. Go to Firebase Console > Firestore Database > Indexes
2. Click **Create Index**
3. Set:
   - Collection ID: `examSubmissions`
   - Fields to index:
     - Field: `examId`, Order: `Ascending`
     - Field: `submittedAt`, Order: `Descending`
4. Click **Create**

### 4. Exam Submissions by Student Index
**Collection:** `examSubmissions`  
**Fields:**
- `studentId` (Ascending)
- `submittedAt` (Descending)

**Query:** Get all submissions by a specific student, sorted by submission date

**How to Create:**
1. Go to Firebase Console > Firestore Database > Indexes
2. Click **Create Index**
3. Set:
   - Collection ID: `examSubmissions`
   - Fields to index:
     - Field: `studentId`, Order: `Ascending`
     - Field: `submittedAt`, Order: `Descending`
4. Click **Create**

## Automatic Index Creation

When you run a query that requires an index, Firestore will:
1. Return an error with a direct link to create the index
2. The app will catch this error and use a fallback (JavaScript sorting)
3. The app will log the index creation link in the console

**Note:** Index creation can take a few minutes. The app will continue to work using the fallback method until the index is ready.

## Verification

After creating indexes:
1. Go to Firebase Console > Firestore Database > Indexes
2. Verify all indexes show status: **Enabled** (green checkmark)
3. The app will automatically use the indexes once they're ready
4. You should no longer see index warnings in the console

## Performance Impact

- **Without indexes:** Queries fetch all matching documents and sort in JavaScript (works but slower)
- **With indexes:** Firestore handles sorting server-side (faster, especially with many documents)

## Troubleshooting

**Index not building:**
- Check that the field names match exactly (case-sensitive)
- Ensure the collection name is correct
- Verify field types match (timestamp fields should be Timestamp type)

**Still seeing warnings:**
- Wait a few minutes for the index to finish building
- Refresh the app to pick up the new index
- Check Firebase Console to verify index status

