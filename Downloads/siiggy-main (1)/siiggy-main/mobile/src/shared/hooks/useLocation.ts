import { useEffect } from 'react';
import * as Location from 'expo-location';
import { useLocationStore } from '../../store';

/**
 * Hook to handle user location permissions and tracking
 */
export const useLocation = () => {
  const { location, setLocation, error, setError } = useLocationStore();

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        setError('Location permission is required to use this app');
        return;
      }

      await getCurrentLocation();
    } catch (err) {
      console.error('Location permission error:', err);
      setError('Failed to get location permission');
    }
  };

  const getCurrentLocation = async () => {
    try {
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      setLocation({
        lat: currentLocation.coords.latitude,
        lng: currentLocation.coords.longitude,
      });
    } catch (err) {
      console.error('Get location error:', err);
      setError('Failed to get current location');
    }
  };

  const refreshLocation = async () => {
    await getCurrentLocation();
  };

  return {
    location,
    error,
    requestLocationPermission,
    refreshLocation,
    isLocationAvailable: !!location,
  };
};
