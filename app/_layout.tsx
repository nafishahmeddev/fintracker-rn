import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { DatabaseProvider } from '@/src/providers/DatabaseProvider';
import { OnboardingProvider } from '@/src/providers/OnboardingProvider';
import { QueryProvider } from '@/src/providers/QueryProvider';
import { SettingsProvider } from '@/src/providers/SettingsProvider';
import { ThemeProvider as CustomThemeProvider } from '@/src/providers/ThemeProvider';
import {
  BricolageGrotesque_400Regular,
  BricolageGrotesque_500Medium,
  BricolageGrotesque_600SemiBold,
  BricolageGrotesque_700Bold,
  useFonts as useBricolageFonts
} from '@expo-google-fonts/bricolage-grotesque';

import {
  JetBrainsMono_400Regular,
  JetBrainsMono_700Bold,
  useFonts as useMonoFonts
} from '@expo-google-fonts/jetbrains-mono';
import { Text, TextInput } from 'react-native';

const customizeText = () => {
  const customTextProps = {
    style: {
      fontFamily: 'BricolageGrotesque_400Regular',
    }
  };
  // @ts-ignore
  if (Text.defaultProps) { Text.defaultProps.style = customTextProps.style; } else { Text.defaultProps = customTextProps; }
  // @ts-ignore
  if (TextInput.defaultProps) { TextInput.defaultProps.style = customTextProps.style; } else { TextInput.defaultProps = customTextProps; }
};

// Removed unstable_settings anchor to prevent naming collisions with physical folders during path resolution

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [bricolageLoaded] = useBricolageFonts({
    BricolageGrotesque_400Regular,
    BricolageGrotesque_500Medium,
    BricolageGrotesque_600SemiBold,
    BricolageGrotesque_700Bold,
  });

  const [monoLoaded] = useMonoFonts({
    JetBrainsMono_400Regular,
    JetBrainsMono_700Bold,
  });

  const fontsLoaded = bricolageLoaded && monoLoaded;

  if (!fontsLoaded) return null;

  customizeText();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryProvider>
        <DatabaseProvider>
          <SettingsProvider>
            <OnboardingProvider>
              <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
              <CustomThemeProvider>
                <Stack screenOptions={{ headerShown: false }}>
                  {/* Rely on auto-resolution for groups */}
                </Stack>
                <StatusBar style="auto" />
              </CustomThemeProvider>
            </ThemeProvider>
          </OnboardingProvider>
        </SettingsProvider>
      </DatabaseProvider>
      </QueryProvider>
    </GestureHandlerRootView>
  );
}
