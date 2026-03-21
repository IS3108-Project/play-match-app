import { useState, useEffect, useRef } from "react";
import { authClient } from "@/lib/client-auth";

interface UserLocation {
  latitude: number;
  longitude: number;
}

interface UseUserLocationResult {
  /** User's current location if available (updates live) */
  location: UserLocation | null;
  /** Whether location features are enabled (user preference from DB) */
  isEnabled: boolean;
  /** Whether browser permission is granted */
  hasPermission: boolean;
  /** Whether we're currently fetching location */
  isLoading: boolean;
  /** Error message if location fetch failed */
  error: string | null;
}

export function useUserLocation(): UseUserLocationResult {
  const { data: session, refetch } = authClient.useSession();
  const user = session?.user as { locationSharingEnabled?: boolean } | undefined;
  
  const isEnabled = user?.locationSharingEnabled ?? false;
  
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const watchIdRef = useRef<number | null>(null);

  // Refetch session on mount to get fresh user preferences
  useEffect(() => {
    refetch();
  }, []);

  // Live location tracking
  useEffect(() => {
    // Clear any existing watcher
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (!isEnabled) {
      setLocation(null);
      setHasPermission(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Start watching position (live tracking)
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setHasPermission(true);
        setIsLoading(false);
      },
      (err) => {
        setError(err.message);
        setHasPermission(false);
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true, // Better accuracy for live tracking
        timeout: 10000,
        maximumAge: 0, // Always get fresh position
      }
    );

    // Cleanup on unmount or when isEnabled changes
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [isEnabled]);

  return {
    location,
    isEnabled,
    hasPermission,
    isLoading,
    error,
  };
}
