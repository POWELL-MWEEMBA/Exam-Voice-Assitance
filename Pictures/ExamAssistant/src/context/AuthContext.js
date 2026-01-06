import React, { createContext, useContext, useState } from 'react'
import { signOut } from 'firebase/auth'
import { auth } from '../config/firebase'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userRole, setUserRole] = useState(null) // 'student' or 'examiner'
  const [user, setUser] = useState(null)

  const login = (userData) => {
    setIsAuthenticated(true)
    setUserRole(userData.role)
    setUser(userData)
  }

  const logout = async () => {
    try {
      // Sign out from Firebase
      await signOut(auth)
      
      // Clear local state
      setIsAuthenticated(false)
      setUserRole(null)
      setUser(null)
    } catch (error) {
      console.error('Logout error:', error)
      // Even if Firebase logout fails, clear local state
      setIsAuthenticated(false)
      setUserRole(null)
      setUser(null)
    }
  }

  const value = {
    isAuthenticated,
    userRole,
    user,
    login,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}




