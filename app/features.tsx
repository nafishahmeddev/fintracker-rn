import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurBackground } from '../src/components/ui/BlurBackground';
import { Header } from '../src/components/ui/Header';
import { FEATURES } from '../src/constants/iap';
import { useTheme } from '../src/providers/ThemeProvider';
import { ThemeColors } from '../src/theme/colors';
import { TYPOGRAPHY } from '../src/theme/typography';

// FEATURES is now imported from src/constants/iap

export default function FeaturesScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.container}>
      <BlurBackground />
      
      <Header title="Pro Features" subtitle="Uncompromising Precision" showBack />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <Text style={styles.heroKicker}>THE LUNO ADVANTAGE</Text>
          <Text style={styles.heroTitle}>Engineered for Focus</Text>
          <Text style={styles.heroSubtitle}>
            {"Luno Pro isn't just about more data — it's about better perspective. We've built the tools you need to master your capital."}
          </Text>
        </View>

        <View style={styles.featuresList}>
          {FEATURES.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <View style={[styles.iconBox, { backgroundColor: colors.primary + '10' }]}>
                <Ionicons name={feature.icon as any} size={24} color={colors.primary} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.closeBtn} 
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Text style={styles.closeBtnText}>RETURN TO UPGRADE</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: 24, paddingBottom: 40 },
  
  heroSection: { marginBottom: 40 },
  heroKicker: { fontFamily: TYPOGRAPHY.fonts.bold, fontSize: 10, color: colors.primary, letterSpacing: 2, marginBottom: 12 },
  heroTitle: { fontFamily: TYPOGRAPHY.fonts.headingRegular, fontSize: 32, color: colors.text, letterSpacing: -1, marginBottom: 16 },
  heroSubtitle: { fontFamily: TYPOGRAPHY.fonts.regular, fontSize: 15, color: colors.textMuted, lineHeight: 24 },

  featuresList: { gap: 32 },
  featureItem: { flexDirection: 'row', gap: 20 },
  iconBox: { width: 52, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  featureContent: { flex: 1 },
  featureTitle: { fontFamily: TYPOGRAPHY.fonts.semibold, fontSize: 16, color: colors.text, marginBottom: 8 },
  featureDescription: { fontFamily: TYPOGRAPHY.fonts.regular, fontSize: 14, color: colors.textMuted, lineHeight: 22 },

  footer: { marginTop: 48, alignItems: 'center' },
  closeBtn: { 
    backgroundColor: colors.text, 
    width: '100%', 
    height: 60, 
    borderRadius: 20, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  closeBtnText: { 
    fontFamily: TYPOGRAPHY.fonts.bold, 
    fontSize: 14, 
    color: colors.background, 
    letterSpacing: 1.5 
  },
});
