# ExamAssistant Navigation System

This document outlines the complete navigation structure for the ExamAssistant React Native app.

## Navigation Structure

```
App.js
├── AuthProvider (Context)
└── AppNavigator
    ├── AuthNav (when not authenticated)
    │   ├── Login
    │   └── Register
    ├── ExaminerNav (when authenticated as examiner)
    │   ├── ExaminerDashboard
    │   ├── CreateExam
    │   └── ManageExams
    └── StudentHomeStack (when authenticated as student)
        ├── HomePage
        ├── ExamPage
        └── ViewResults
```

## Key Components

### 1. AppNavigator.js
- Main navigation controller
- Handles authentication state
- Routes users based on authentication status and role
- Uses AuthContext for state management

### 2. AuthNav.js
- Stack navigator for authentication screens
- Includes Login and Register screens
- No header shown for clean auth experience

### 3. ExaminerNav.js
- Stack navigator for examiner functionality
- Blue header theme
- Includes dashboard, exam creation, and exam management

### 4. StudentHomeStack.js
- Stack navigator for student functionality
- Green header theme
- Includes home, exam taking, and results viewing

### 5. AuthContext.js
- React Context for authentication state management
- Provides login/logout functionality
- Manages user role and authentication status

## Usage

### Authentication Flow
1. App starts with `isAuthenticated: false`
2. User sees AuthNav (Login/Register screens)
3. After successful login, `isAuthenticated` becomes `true`
4. App routes to appropriate navigator based on `userRole`

### Role-Based Navigation
- **Examiner Role**: Routes to ExaminerNav
- **Student Role**: Routes to StudentHomeStack

### Navigation Between Screens
Each stack navigator handles its own internal navigation:
- Use `navigation.navigate('ScreenName')` to navigate
- Use `navigation.goBack()` to go back
- Use `navigation.replace('ScreenName')` to replace current screen

## Customization

### Header Styling
Each navigator has its own header theme:
- **AuthNav**: No header
- **ExaminerNav**: Blue theme (`#3b82f6`)
- **StudentHomeStack**: Green theme (`#22c55e`)

### Screen Options
Each screen can be customized with:
- Custom titles
- Header visibility
- Background colors
- Navigation options

## Future Enhancements

1. **Tab Navigation**: Add bottom tabs for main sections
2. **Drawer Navigation**: Add side drawer for additional options
3. **Deep Linking**: Support for deep links to specific screens
4. **Navigation Guards**: Add route protection based on permissions
5. **Loading States**: Add proper loading screens during auth checks








