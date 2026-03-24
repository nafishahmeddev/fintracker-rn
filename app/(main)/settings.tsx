import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../src/providers/ThemeProvider';
import { ThemeColors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { Header } from '../../src/components/ui/Header';
import { db } from '../../src/db/client';
import { payments, accounts, categories } from '../../src/db/schema';
import { useSettings } from '../../src/providers/SettingsProvider';

export default function SettingsScreen() {
  const { colors } = useTheme();
  const { profile, updateProfile } = useSettings();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();

  const handleResetData = () => {
    Alert.alert(
      "FACTORY RESET", 
      "THIS WILL PERMANENTLY WIPE ALL DATA. ACCOUNTS, CATEGORIES, AND PAYMENTS WILL BE DESTROYED.", 
      [
        { text: "CANCEL", style: "cancel" },
        { 
          text: "WIPE EVERYTHING", 
          style: "destructive", 
          onPress: async () => {
            try {
              await db.delete(payments);
              await db.delete(categories);
              await db.delete(accounts);
              await AsyncStorage.clear();
              Alert.alert("Wipe Complete", "Application state has been purged. Please restart the app.");
              router.replace('/(onboarding)');
            } catch {
              Alert.alert("Critical Error", "Failed to clear physical storage.");
            }
          } 
        }
      ]
    );
  };

  const handleThemeChange = () => {
    Alert.alert("Appearance", "Select your preferred theme", [
      { text: "Light Mode", onPress: () => updateProfile({ theme: 'light' }) },
      { text: "Dark Mode", onPress: () => updateProfile({ theme: 'dark' }) },
      { text: "Follow System", onPress: () => updateProfile({ theme: 'system' }) },
      { text: "Cancel", style: "cancel" }
    ]);
  };

  const handleCurrencyChange = () => {
    const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'INR', 'AED', 'BTC'];
    Alert.alert("Default Currency", "Set application-wide standard", 
      currencies.map(c => ({ text: c, onPress: () => updateProfile({ defaultCurrency: c }) })),
      { cancelable: true }
    );
  };

  type PreferenceRowProps = { 
    icon: any; 
    title: string; 
    value?: string; 
    onPress: () => void; 
    destructive?: boolean;
    color?: string;
  };

  const PreferenceRow = ({ icon, title, value, onPress, destructive, color }: PreferenceRowProps) => (
    <TouchableOpacity style={styles.row} onPress={onPress}>
      <View style={[styles.iconBox, { backgroundColor: (color || (destructive ? colors.danger : colors.text)) + '15' }]}>
        <Ionicons name={icon} size={20} color={color || (destructive ? colors.danger : colors.text)} />
      </View>
      <View style={styles.textDetails}>
        <Text style={[styles.rowTitle, destructive && { color: colors.danger }]}>{title}</Text>
        {value && <Text style={styles.rowValue}>{value}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Preferences" showBack />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <Text style={styles.heroBrand}>FINTRACKER</Text>
          <Text style={styles.heroSub}>EDGLESS STACK V1.0</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>TAXONOMY</Text>
          <PreferenceRow 
            icon="grid-outline" 
            title="Categories" 
            value="Manage your tags" 
            onPress={() => router.push('/categories')} 
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>VISUALS & LOCALES</Text>
          <PreferenceRow 
            icon="contrast-outline" 
            title="Appearance" 
            value={(profile.theme || 'system').toUpperCase()} 
            onPress={handleThemeChange} 
          />
          <PreferenceRow 
            icon="cash-outline" 
            title="Primary Currency" 
            value={profile.defaultCurrency} 
            onPress={handleCurrencyChange} 
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>DANGER ZONE</Text>
          <PreferenceRow 
            icon="trash-bin-outline" 
            title="Factory Reset" 
            destructive
            value="Wipe local SQLite database" 
            onPress={handleResetData} 
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>BUILT FOR PERFORMANCE — 2024</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: 60,
  },
  heroSection: {
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  heroBrand: {
    fontFamily: typography.fonts.heading,
    fontSize: 48,
    color: colors.text,
    letterSpacing: -2,
    lineHeight: 48,
  },
  heroSub: {
    fontFamily: typography.fonts.mono,
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 8,
    letterSpacing: 2,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 24,
  },
  sectionLabel: {
    fontFamily: typography.fonts.monoBold,
    fontSize: 10,
    color: colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: 8,
    opacity: 0.6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textDetails: {
    flex: 1,
  },
  rowTitle: {
    fontFamily: typography.fonts.headingRegular,
    fontSize: typography.sizes.md + 2,
    color: colors.text,
    letterSpacing: -0.5,
  },
  rowValue: {
    fontFamily: typography.fonts.mono,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  footer: {
    marginTop: 60,
    alignItems: 'center',
  },
  footerText: {
    fontFamily: typography.fonts.mono,
    fontSize: 9,
    color: colors.textMuted,
    letterSpacing: 1,
    opacity: 0.4,
  }
});
