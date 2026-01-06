# Firebase Integration Setup

## Overview
Your ExamAssistant app is now connected to Firebase with authentication and Firestore database.

## What's Been Configured

### 1. Firebase Configuration
- **File**: `src/config/firebase.js`
- **Services**: 
  - Authentication (`auth`)
  - Firestore Database (`db`)
  - Storage (`storage`)

### 2. Authentication Integration

#### Login Screen (`src/screens/auth/Login.js`)
- Uses Firebase `signInWithEmailAndPassword`
- Validates user role (student/examiner)
- Fetches user data from Firestore
- Shows loading state during authentication

#### Register Screen (`src/screens/auth/Register.js`)
- Uses Firebase `createUserWithEmailAndPassword`
- Stores user data in Firestore with the following fields:
  - firstName, lastName
  - email
  - role (student/examiner)
  - name (full name)
  - createdAt (timestamp)
- Auto-logs in after registration
- Shows loading state during registration

#### AuthContext (`src/context/AuthContext.js`)
- Updated logout to use Firebase `signOut`
- Maintains authentication state
- Provides user data throughout the app

#### ExaminerDashboard (`src/screens/examiner/ExaminerDashboard.js`)
- Logout button now uses Firebase sign out
- Displays user's name from Firebase
- Navigation linked to CreateExam and ManageExams screens

## Database Structure

### Firestore Collections

#### `users` Collection
Each document is identified by the user's UID and contains:
```javascript
{
  firstName: string,
  lastName: string,
  email: string,
  role: 'student' | 'examiner',
  name: string,
  createdAt: timestamp
}
```

#### `exams` Collection
Each document represents an exam created by an examiner and contains:
```javascript
{
  title: string,
  subject: string,
  duration: number, // in minutes
  questions: Array<Question>,
  examinerId: string, // UID of the examiner
  status: 'draft' | 'active' | 'inactive',
  createdAt: timestamp,
  updatedAt: timestamp,
  totalQuestions: number
}
```

**Question Structure:**
- **Multiple Choice Question:**
```javascript
{
  type: 'Multiple Choice',
  text: string,
  options: string[], // Array of 4 options (A, B, C, D)
  correctIndex: number // 0-3 indicating which option is correct
}
```

- **Written Answer Question:**
```javascript
{
  type: 'Written Answer',
  text: string,
  expectedAnswer: string
}
```

## Security Rules
You'll need to set up Firestore security rules in the Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /exams/{examId} {
      // Examiners can read/write their own exams
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.examinerId;
      // Students can read active exams
      allow read: if request.auth != null && 
        resource.data.status == 'active';
    }
  }
}
```

## Next Steps

### 1. Enable Authentication in Firebase Console
- Go to Firebase Console > Authentication
- Enable "Email/Password" sign-in method
- No additional configuration needed

### 2. Set up Firestore Security Rules
- Go to Firebase Console > Firestore Database > Rules
- Paste the security rules above
- Click "Publish"

### 3. Exam Service Integration
- **File**: `src/services/examService.js`
- Provides functions to create, read, update, and delete exams
- Handles exam questions storage in Firestore `exams` collection
- CreateExam screen now saves exams to Firebase automatically

### 4. Optional: Add More Firebase Features
Consider implementing:
- Student responses storage
- Exam results tracking
- Real-time exam status updates
- Exam attempts tracking

## Testing

To test the authentication:
1. Run `npm start` or `expo start`
2. Navigate to Register screen
3. Create a new account (student or examiner)
4. Login with the created credentials
5. Logout functionality on ExaminerDashboard

## Environment
- Firebase SDK: v12.4.0
- React Native with Expo
- Platform: Web, iOS, Android


