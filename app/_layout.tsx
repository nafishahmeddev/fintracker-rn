import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { DatabaseProvider } from '@/src/providers/DatabaseProvider';
import { QueryProvider } from '@/src/providers/QueryProvider';
import { OnboardingProvider } from '@/src/providers/OnboardingProvider';
import { SettingsProvider } from '@/src/providers/SettingsProvider';
import { ThemeProvider as CustomThemeProvider } from '@/src/providers/ThemeProvider';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  if (!fontsLoaded) return null;

  return (
    <QueryProvider>
      <DatabaseProvider>
        <SettingsProvider>
          <OnboardingProvider>
            <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <CustomThemeProvider>
              <Stack>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
              </Stack>
              <StatusBar style="auto" />
            </CustomThemeProvider>
          </ThemeProvider>
        </OnboardingProvider>
      </SettingsProvider>
    </DatabaseProvider>
    </QueryProvider>
  );
}
