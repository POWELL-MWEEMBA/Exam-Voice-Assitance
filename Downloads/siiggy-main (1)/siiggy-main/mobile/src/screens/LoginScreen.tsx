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
  ActivityIndicator
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { colors, useThemeColors, spacing, borderRadius } from '../theme';
import { useAuthStore } from '../store';
import { authApi } from '../services';

const { width } = Dimensions.get('window');

export default function LoginScreen({ navigation }: any) {
  const colors = useThemeColors();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setToken, setUser } = useAuthStore();

  const handleLogin = async () => {
    if (!email || !password) return;
    
    try {
      setLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      const response = await authApi.login({ email, password });
      const { token, user } = response.data;
      
      await setToken(token);
      setUser(user);
    } catch (error: any) {
      alert(error.response?.data?.message || "Login failed");
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
          <Image 
            source={require('../../assets/icon.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={[styles.title, { color: colors.text.header }]}>Welcome Back</Text>
          <Text style={[styles.subtitle, { color: colors.text.light }]}>Sign in to continue to SIIGGY</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.inputContainer}>
            <View style={[styles.inputWrapper, { backgroundColor: colors.background.light, borderColor: colors.border }]}>
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

            <View style={[styles.inputWrapper, { backgroundColor: colors.background.light, borderColor: colors.border }]}>
              <Ionicons name="lock-closed-outline" size={20} color={colors.text.light} style={styles.inputIcon} />
              <TextInput
                placeholder="Password"
                placeholderTextColor={colors.text.light}
                secureTextEntry={!showPassword}
                style={[styles.input, { flex: 1, color: colors.text.header }]}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={colors.text.light}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.forgotBtn}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.loginButton, (!email || !password) && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={loading || !email || !password}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loginText}>Log In</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.dividerRow}>
            <View style={[styles.line, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.text.light }]}>or continue with</Text>
            <View style={[styles.line, { backgroundColor: colors.border }]} />
          </View>

          <View style={styles.socialRow}>
            <TouchableOpacity style={[styles.socialBtn, { backgroundColor: colors.background.light, borderColor: colors.border }]} onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
              <Ionicons name="logo-google" size={24} color={colors.text.header} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.socialBtn, { backgroundColor: colors.background.light, borderColor: colors.border }]} onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
              <Ionicons name="logo-apple" size={24} color={colors.text.header} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.socialBtn, { backgroundColor: colors.background.light, borderColor: colors.border }]} onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
              <Ionicons name="logo-facebook" size={24} color={colors.text.header} />
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.text.light }]}>New to Siiggy?</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Register")}>
              <Text style={styles.signupText}>Join Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 80,
    paddingBottom: 40,
    alignItems: "center"
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: 1
  },
  subtitle: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 16,
    marginTop: 10,
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
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 30
  },
  forgotText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 14
  },
  loginButton: {
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
  loginButtonDisabled: {
    opacity: 0.5
  },
  loginText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 18,
    letterSpacing: 1
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 40
  },
  dividerText: {
    marginHorizontal: 15,
    color: "rgba(255,255,255,0.4)",
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  line: {
    flex: 1,
    height: 1,
  },
  socialRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    marginBottom: 40
  },
  socialBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: 'center'
  },
  footerText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 15
  },
  signupText: {
    marginLeft: 8,
    color: colors.primary,
    fontWeight: "700",
    fontSize: 15
  }
});