import React from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import { HomePage, ExamPage, ViewResults, AccessibilitySettings, UsabilitySurvey } from '../../screens'

const Stack = createStackNavigator()

const StudentHomeStack = () => {
  return (
    <Stack.Navigator
      initialRouteName="HomePage"
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#f8fafc' }
      }}
    >
      <Stack.Screen 
        name="HomePage" 
        component={HomePage}
        options={{
          title: 'Student Dashboard'
        }}
      />
      <Stack.Screen 
        name="ExamPage" 
        component={ExamPage}
        options={{
          title: 'Exam in Progress'
        }}
      />
      <Stack.Screen 
        name="ViewResults" 
        component={ViewResults}
        options={{
          title: 'Exam Results'
        }}
      />
      <Stack.Screen 
        name="AccessibilitySettings" 
        component={AccessibilitySettings}
        options={{
          title: 'Accessibility Settings'
        }}
      />
      <Stack.Screen 
        name="UsabilitySurvey" 
        component={UsabilitySurvey}
        options={{
          title: 'Usability Survey',
          headerShown: false,
          gestureEnabled: false
        }}
      />
    </Stack.Navigator>
  )
}

export default StudentHomeStack