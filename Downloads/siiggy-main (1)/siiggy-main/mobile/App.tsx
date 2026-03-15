import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './src/navigation/AppNavigator';
import { useThemeStore } from './src/store';

export default function App() {
  const { loadFromStorage } = useThemeStore();

  useEffect(() => {
    loadFromStorage();
  }, []);

  return (
    <>
      <AppNavigator />
      <StatusBar style="auto" />
    </>
  );
}
