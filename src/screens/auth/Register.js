import React, { useState } from 'react'
import { StyleSheet, Text, TextInput, TouchableOpacity, View, Alert, ScrollView, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../../context/AuthContext'
import { AppColors } from '../../constants/AppColors'
import { globalStyles } from '../../constants/GlobalStyles'
import { auth, db } from '../../config/firebase'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'

const Register = ({ navigation }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    userType: 'student'
  })
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleRegister = async () => {
    const { firstName, lastName, email, password, confirmPassword, userType } = formData

    // Validation
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields')
      return
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match')
      return
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long')
      return
    }

    setLoading(true)
    try {
      // Create user with Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Store user data in Firestore
      const userData = {
        firstName,
        lastName,
        email,
        role: userType,
        name: `${firstName} ${lastName}`,
        createdAt: new Date().toISOString()
      }

      await setDoc(doc(db, 'users', user.uid), userData)

      // Auto-login after registration
      login({
        ...userData,
        uid: user.uid
      })
    } catch (error) {
      console.error('Registration error:', error)
      Alert.alert('Error', error.message || 'Failed to create account')
      setLoading(false)
    }
  }

  const handleLogin = () => {
    navigation.navigate('Login')
  }

  return (
    <SafeAreaView style={[globalStyles.safeContainer, styles.container]}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.registerContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join Exam Assistant today</Text>
          </View>

          <View style={styles.form}>
            {/* User Type Selection */}
            <View style={styles.userTypeContainer}>
              <TouchableOpacity
                style={[
                  styles.userTypeButton,
                  formData.userType === 'student' && styles.userTypeButtonActive
                ]}
                onPress={() => handleInputChange('userType', 'student')}
              >
                <Text style={[
                  styles.userTypeText,
                  formData.userType === 'student' && styles.userTypeTextActive
                ]}>
                  Student
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.userTypeButton,
                  formData.userType === 'examiner' && styles.userTypeButtonActive
                ]}
                onPress={() => handleInputChange('userType', 'examiner')}
              >
                <Text style={[
                  styles.userTypeText,
                  formData.userType === 'examiner' && styles.userTypeTextActive
                ]}>
                  Examiner
                </Text>
              </TouchableOpacity>
            </View>

            {/* Name Fields */}
            <View style={styles.nameRow}>
              <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.inputLabel}>First Name</Text>
                <TextInput
                  style={styles.inputField}
                  placeholder='First name'
                  value={formData.firstName}
                  onChangeText={(value) => handleInputChange('firstName', value)}
                />
              </View>
              <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.inputLabel}>Last Name</Text>
                <TextInput
                  style={styles.inputField}
                  placeholder='Last name'
                  value={formData.lastName}
                  onChangeText={(value) => handleInputChange('lastName', value)}
                />
              </View>
            </View>

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.inputField}
                placeholder='Enter your email'
                value={formData.email}
                onChangeText={(value) => handleInputChange('email', value)}
                keyboardType='email-address'
                autoCapitalize='none'
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                style={styles.inputField}
                placeholder='Create a password'
                value={formData.password}
                onChangeText={(value) => handleInputChange('password', value)}
                secureTextEntry
              />
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Confirm Password</Text>
              <TextInput
                style={styles.inputField}
                placeholder='Confirm your password'
                value={formData.confirmPassword}
                onChangeText={(value) => handleInputChange('confirmPassword', value)}
                secureTextEntry
              />
            </View>

            {/* Register Button */}
            <TouchableOpacity 
              style={[globalStyles.button, styles.registerButton, loading && styles.disabledButton]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={globalStyles.buttonText}>Create Account</Text>
              )}
            </TouchableOpacity>

            {/* Login Link */}
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={handleLogin}>
                <Text style={styles.loginLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

export default Register

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppColors.background,
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  registerContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: AppColors.textDark,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: AppColors.textMedium,
    textAlign: 'center',
  },
  form: {
    gap: 20,
  },
  userTypeContainer: {
    flexDirection: 'row',
    backgroundColor: AppColors.white,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  userTypeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  userTypeButtonActive: {
    backgroundColor: AppColors.primary,
  },
  userTypeText: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.textMedium,
  },
  userTypeTextActive: {
    color: AppColors.white,
  },
  nameRow: {
    flexDirection: 'row',
  },
  inputContainer: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.textDark,
  },
  inputField: {
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: AppColors.white,
    color: AppColors.textDark,
  },
  registerButton: {
    marginTop: 8,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  loginText: {
    fontSize: 16,
    color: AppColors.textMedium,
  },
  loginLink: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.primary,
  },
  disabledButton: {
    opacity: 0.6,
  },
})