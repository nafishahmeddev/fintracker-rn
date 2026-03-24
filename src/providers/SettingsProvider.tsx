import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type UserProfile = {
  name: string;
  email: string;
  phone: string;
  defaultCurrency: string;
  theme: 'system' | 'light' | 'dark';
};

type SettingsContextType = {
  profile: UserProfile;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  isLoading: boolean;
};

const SettingsContext = createContext<SettingsContextType | null>(null);

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}

const DEFAULT_PROFILE: UserProfile = {
  name: '',
  email: '',
  phone: '',
  defaultCurrency: 'USD',
  theme: 'dark',
};

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const storedProfile = await AsyncStorage.getItem('@fintracker_profile');
        if (storedProfile) {
          const parsed = JSON.parse(storedProfile);
          setProfile(prev => ({ ...prev, ...parsed }));
        }
      } catch (e) {
        console.error('Failed to load profile settings', e);
      } finally {
        setIsLoading(false);
      }
    };
    loadSettings();
  }, []);

  const updateProfile = async (updates: Partial<UserProfile>) => {
    try {
      const newProfile = { ...profile, ...updates };
      await AsyncStorage.setItem('@fintracker_profile', JSON.stringify(newProfile));
      setProfile(newProfile);
    } catch (e) {
      console.error('Failed to save profile settings', e);
    }
  };

  return (
    <SettingsContext.Provider value={{ profile, updateProfile, isLoading }}>
      {children}
    </SettingsContext.Provider>
  );
}
