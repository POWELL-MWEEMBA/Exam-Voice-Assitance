import React from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import { ExaminerDashboard, CreateExam, ManageExams, EditExam, ExamSubmissions, ResearchAnalytics } from '../../screens'

const Stack = createStackNavigator()

const ExaminerNav = () => {
  return (
    <Stack.Navigator
      initialRouteName="ExaminerDashboard"
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#f8fafc' }
      }}
    >
      <Stack.Screen 
        name="ExaminerDashboard" 
        component={ExaminerDashboard}
        options={{
          title: 'Examiner Dashboard'
        }}
      />
      <Stack.Screen 
        name="CreateExam" 
        component={CreateExam}
        options={{
          title: 'Create New Exam'
        }}
      />
      <Stack.Screen 
        name="ManageExams" 
        component={ManageExams}
        options={{
          title: 'Manage Exams'
        }}
      />
      <Stack.Screen 
        name="EditExam" 
        component={EditExam}
        options={{
          title: 'Edit Exam'
        }}
      />
      <Stack.Screen 
        name="ExamSubmissions" 
        component={ExamSubmissions}
        options={{
          title: 'Exam Submissions'
        }}
      />
      <Stack.Screen 
        name="ResearchAnalytics" 
        component={ResearchAnalytics}
        options={{
          title: 'Research Analytics'
        }}
      />
    </Stack.Navigator>
  )
}

export default ExaminerNav

