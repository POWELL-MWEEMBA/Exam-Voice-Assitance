import React, { useState, useEffect } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import { useAuth } from '../context/AuthContext'
import AuthNav from './AuthNav'
import ExaminerNav from './examinerNav'
import StudentHomeStack from './studentNav'

const Stack = createStackNavigator()

const AppNavigator = () => {
  const { isAuthenticated, userRole } = useAuth()
  const [isLoading, setIsLoading] = useState(true)

  // Simulate authentication check
  useEffect(() => {
    // In a real app, you would check for stored auth tokens here
    const checkAuthStatus = async () => {
      try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // For demo purposes, you can manually set these values
        // In production, this would come from your auth service
        // The AuthContext will handle the actual state management
      } catch (error) {
        console.error('Auth check failed:', error)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuthStatus()
  }, [])

  // Show loading screen while checking authentication
  if (isLoading) {
    return null // You can add a loading component here
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          // Authentication Stack
          <Stack.Screen 
            name="Auth" 
            component={AuthNav}
            options={{
              title: 'Authentication'
            }}
          />
        ) : (
          // Authenticated Stack - Role-based navigation
          <>
            {userRole === 'examiner' ? (
              <Stack.Screen 
                name="ExaminerMain" 
                component={ExaminerNav}
                options={{
                  title: 'Examiner Portal'
                }}
              />
            ) : (
              <Stack.Screen 
                name="StudentMain" 
                component={StudentHomeStack}
                options={{
                  title: 'Student Portal'
                }}
              />
            )}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}

export default AppNavigator
