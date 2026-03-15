import { Alert } from 'react-native';

export const showNetworkError = (error: any) => {
  const isNetworkError = error.message === 'Network Error' || 
                        error.code === 'ECONNREFUSED' ||
                        error.code === 'ETIMEDOUT';
  
  if (isNetworkError) {
    Alert.alert(
      '🌐 Connection Error',
      'Cannot connect to server.\n\n' +
      '1. Make sure backend is running:\n' +
      '   cd backend && php artisan serve\n\n' +
      '2. Check your .env file has correct IP:\n' +
      '   EXPO_PUBLIC_API_URL=http://YOUR_IP:8000/api\n\n' +
      '3. Ensure phone & computer on same WiFi',
      [
        {
          text: 'Open Guide',
          onPress: () => console.log('See mobile/NETWORK_TROUBLESHOOTING.md'),
        },
        { text: 'OK', style: 'cancel' },
      ]
    );
    return true;
  }
  return false;
};

export const getApiBaseUrl = (): string => {
  const url = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api';
  console.log('📡 API Base URL:', url);
  return url;
};

export const getMediaUrl = (path: string | null | undefined): string => {
  if (!path) return '';
  
  // If already absolute URL, return as is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // Get base URL without /api suffix
  const apiUrl = getApiBaseUrl();
  const baseUrl = apiUrl.replace('/api', '');
  
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  const fullUrl = `${baseUrl}${normalizedPath}`;
  console.log('🖼️ Media URL:', fullUrl);
  return fullUrl;
};
