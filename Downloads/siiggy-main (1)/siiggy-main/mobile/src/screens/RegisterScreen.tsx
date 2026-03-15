import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Image,
  ActivityIndicator,
  Alert
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { colors, useThemeColors, spacing, borderRadius } from '../theme';
import { useAuthStore } from '../store';
import { authApi } from '../services';

const { width } = Dimensions.get('window');

export default function RegisterScreen({ navigation }: any) {
  const colors = useThemeColors();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { setToken, setUser } = useAuthStore();

  const handleRegister = async () => {
    if (!firstName || !lastName || !email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    
    try {
      setLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      const response = await authApi.register({
        name: `${firstName} ${lastName}`,
        email,
        password,
        password_confirmation: password
      });
      
      const { token, user } = response.data;
      await setToken(token);
      setUser(user);
    } catch (error: any) {
      Alert.alert("Error", error.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background.default }]} />
      
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={[styles.backBtn, { backgroundColor: colors.background.light }]} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={28} color={colors.text.header} />
          </TouchableOpacity>
          <Image 
            source={require('../../assets/icon.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={[styles.title, { color: colors.text.header }]}>Create Account</Text>
          <Text style={[styles.subtitle, { color: colors.text.light }]}>Start your journey with SIIGGY</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.inputContainer}>
            <View style={styles.row}>
              <View style={[styles.inputWrapper, { flex: 1, marginRight: 10 }]}>
                <TextInput
                  placeholder="First Name"
                  placeholderTextColor={colors.text.light}
                  style={[styles.input, { color: colors.text.header }]}
                  value={firstName}
                  onChangeText={setFirstName}
                />
              </View>
              <View style={[styles.inputWrapper, { flex: 1 }]}>
                <TextInput
                  placeholder="Last Name"
                  placeholderTextColor={colors.text.light}
                  style={[styles.input, { color: colors.text.header }]}
                  value={lastName}
                  onChangeText={setLastName}
                />
              </View>
            </View>

            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color={colors.text.light} style={styles.inputIcon} />
              <TextInput
                placeholder="Email Address"
                placeholderTextColor={colors.text.light}
                style={[styles.input, { color: colors.text.header }]}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color={colors.text.light} style={styles.inputIcon} />
              <TextInput
                placeholder="Password"
                placeholderTextColor={colors.text.light}
                secureTextEntry
                style={[styles.input, { color: colors.text.header }]}
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <Text style={[styles.termsText, { color: colors.text.light }]}>
              By signing up, you agree to our 
              <Text style={styles.linkText}> Terms </Text> and 
              <Text style={styles.linkText}> Privacy Policy</Text>.
            </Text>

            <TouchableOpacity 
              style={[styles.registerButton, (!email || !password || !firstName) && styles.registerButtonDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.registerText}>Get Started</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.text.light }]}>Already have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text style={styles.loginBtnText}>Log In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    alignItems: "center"
  },
  backBtn: {
    position: 'absolute',
    top: 60,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10
  },
  logo: {
    width: 60,
    height: 60,
    marginBottom: 15,
    backgroundColor: '#fff',
    borderRadius: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: "#fff",
    textAlign: "center",
    letterSpacing: 1
  },
  subtitle: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 15,
    marginTop: 8,
    fontWeight: "500"
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    paddingBottom: 40
  },
  inputContainer: {
    width: '100%'
  },
  row: {
    flexDirection: 'row',
    marginBottom: 0
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    paddingHorizontal: 20,
    marginBottom: 16,
    height: 60,
    borderWidth: 1,
  },
  inputIcon: {
    marginRight: 15
  },
  input: {
    fontSize: 16,
    height: '100%',
    flex: 1
  },
  termsText: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 18
  },
  linkText: {
    color: colors.primary,
    fontWeight: '600'
  },
  registerButton: {
    backgroundColor: colors.primary,
    height: 60,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10
  },
  registerButtonDisabled: {
    opacity: 0.5
  },
  registerText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 18,
    letterSpacing: 1
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: 'center',
    marginTop: 30
  },
  footerText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 15
  },
  loginBtnText: {
    marginLeft: 8,
    color: colors.primary,
    fontWeight: "700",
    fontSize: 15
  }
});