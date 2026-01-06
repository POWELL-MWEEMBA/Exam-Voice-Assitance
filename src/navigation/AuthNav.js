import React from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import { Login, Register } from '../screens'

const Stack = createStackNavigator()

const AuthNav = () => {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#f8fafc' }
      }}
    >
      <Stack.Screen 
        name="Login" 
        component={Login}
        options={{
          title: 'Login'
        }}
      />
      <Stack.Screen 
        name="Register" 
        component={Register}
        options={{
          title: 'Register'
        }}
      />
    </Stack.Navigator>
  )
}

export default AuthNav