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
import { 
  useFonts, 
  RedHatText_400Regular, 
  RedHatText_500Medium, 
  RedHatText_600SemiBold, 
  RedHatText_700Bold 
} from '@expo-google-fonts/red-hat-text';

import { 
  JetBrainsMono_400Regular, 
  JetBrainsMono_700Bold 
} from '@expo-google-fonts/jetbrains-mono';
import { Text, TextInput } from 'react-native';

const customizeText = () => {
  const customTextProps = {
    style: {
      fontFamily: 'RedHatText_400Regular',
    }
  };
  // @ts-ignore
  if (Text.defaultProps) { Text.defaultProps.style = customTextProps.style; } else { Text.defaultProps = customTextProps; }
  // @ts-ignore
  if (TextInput.defaultProps) { TextInput.defaultProps.style = customTextProps.style; } else { TextInput.defaultProps = customTextProps; }
};

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded] = useFonts({
    RedHatText_400Regular,
    RedHatText_500Medium,
    RedHatText_600SemiBold,
    RedHatText_700Bold,
    JetBrainsMono_400Regular,
    JetBrainsMono_700Bold,
  });

  if (!fontsLoaded) return null;

  customizeText();

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
