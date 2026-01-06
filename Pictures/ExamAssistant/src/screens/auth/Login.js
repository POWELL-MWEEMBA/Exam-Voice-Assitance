import React, { useState } from 'react'
import { StyleSheet, Text, TextInput, TouchableOpacity, View, Alert, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../../context/AuthContext'
import { AppColors } from '../../constants/AppColors'
import { globalStyles } from '../../constants/GlobalStyles'
import { auth, db } from '../../config/firebase'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'

const Login = ({ navigation }) => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [userType, setUserType] = useState('student') // 'student' or 'examiner'
    const [loading, setLoading] = useState(false)
    const { login } = useAuth()

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields')
            return
        }

        setLoading(true)
        try {
            // Sign in with Firebase Auth
            const userCredential = await signInWithEmailAndPassword(auth, email, password)
            const user = userCredential.user

            // Get user data from Firestore to get role
            const userDoc = await getDoc(doc(db, 'users', user.uid))
            const userData = userDoc.data()

            // Check if user role matches selected role
            if (userData?.role === userType) {
                login({
                    ...userData,
                    uid: user.uid,
                    email: user.email
                })
            } else {
                Alert.alert('Error', `Please select the correct account type: ${userData?.role}`)
                setLoading(false)
            }
        } catch (error) {
            console.error('Login error:', error)
            Alert.alert('Error', error.message || 'Failed to sign in')
            setLoading(false)
        }
    }

    const handleRegister = () => {
        navigation.navigate('Register')
    }

    return (
        <SafeAreaView style={[globalStyles.safeContainer, styles.container]}>
            <View style={styles.loginContainer}>
                <View style={styles.header}>
                    <Text style={styles.title}>Exam Assistant</Text>
                    <Text style={styles.subtitle}>Sign in to access your account</Text>
                </View>

                <View style={styles.form}>
                    {/* User Type Selection */}
                    <View style={styles.userTypeContainer}>
                        <TouchableOpacity
                            style={[
                                styles.userTypeButton,
                                userType === 'student' && styles.userTypeButtonActive
                            ]}
                            onPress={() => setUserType('student')}
                        >
                            <Text style={[
                                styles.userTypeText,
                                userType === 'student' && styles.userTypeTextActive
                            ]}>
                                Student
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.userTypeButton,
                                userType === 'examiner' && styles.userTypeButtonActive
                            ]}
                            onPress={() => setUserType('examiner')}
                        >
                            <Text style={[
                                styles.userTypeText,
                                userType === 'examiner' && styles.userTypeTextActive
                            ]}>
                                Examiner
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Email Input */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Email</Text>
                        <TextInput
                            style={styles.inputField}
                            placeholder='Enter your email'
                            value={email}
                            onChangeText={setEmail}
                            keyboardType='email-address'
                            autoCapitalize='none'
                        />
                    </View>

                    {/* Password Input */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Password</Text>
                        <TextInput
                            style={styles.inputField}
                            placeholder='Enter your password'
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                    </View>

                    {/* Login Button */}
                    <TouchableOpacity 
                        style={[globalStyles.button, styles.loginButton, loading && styles.disabledButton]}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={globalStyles.buttonText}>Sign In</Text>
                        )}
                    </TouchableOpacity>

                    {/* Register Link */}
                    <View style={styles.registerContainer}>
                        <Text style={styles.registerText}>Don't have an account? </Text>
                        <TouchableOpacity onPress={handleRegister}>
                            <Text style={styles.registerLink}>Sign Up</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    )
}

export default Login

const styles = StyleSheet.create({
    container: {
        backgroundColor: AppColors.background,
        flex: 1,
    },
    loginContainer: {
        flex: 1,
        paddingHorizontal: 24,
        paddingVertical: 32,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 48,
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
        gap: 24,
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
    loginButton: {
        marginTop: 8,
    },
    registerContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 16,
    },
    registerText: {
        fontSize: 16,
        color: AppColors.textMedium,
    },
    registerLink: {
        fontSize: 16,
        fontWeight: '600',
        color: AppColors.primary,
    },
    disabledButton: {
        opacity: 0.6,
    },
})