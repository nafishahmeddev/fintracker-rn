import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Alert, DevSettings, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurBackground } from '../../src/components/ui/BlurBackground';
import { ConfirmDialog } from '../../src/components/ui/ConfirmDialog';
import { Header } from '../../src/components/ui/Header';
import { useTheme } from '../../src/providers/ThemeProvider';
import { ThemeColors } from '../../src/theme/colors';
import { TYPOGRAPHY } from '../../src/theme/typography';
import { seedDummyData } from '../../src/utils/seed';

export default function DeveloperScreen() {
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  
  const [showSeedConfirm, setShowSeedConfirm] = React.useState(false);
  const [isSeeding, setIsSeeding] = React.useState(false);

  const handleRunSeed = async () => {
    try {
      setIsSeeding(true);
      const count = await seedDummyData();
      Alert.alert(
        "Success", 
        `Generated ${count} transactions. The app will now reload to sync the UI.`,
        [{ text: "OK", onPress: () => DevSettings.reload() }]
      );
      setShowSeedConfirm(false);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to generate seed data.");
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <BlurBackground />
      <Header title="Developer" subtitle="Secret system tools" showBack />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>DATA UTILITIES</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.row} onPress={() => setShowSeedConfirm(true)} activeOpacity={0.7}>
              <View style={[styles.iconBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Ionicons name="flask-outline" size={18} color={colors.primary} />
              </View>
              <View style={styles.textDetails}>
                <Text style={styles.rowTitle}>Seed Dummy Data</Text>
                <Text style={styles.rowSubtitle}>Generate 12 months of test history</Text>
              </View>
              <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>SYSTEM INFO</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Environment</Text>
              <Text style={styles.infoValue}>{__DEV__ ? 'DEVELOPMENT' : 'PRODUCTION'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Platform</Text>
              <Text style={styles.infoValue}>{process.env.EXPO_PUBLIC_PLATFORM || 'native'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerBrand}>LUNO / DEV_TOOLS</Text>
          <Text style={styles.footerCopy}>INTERNAL TOOLS FOR DEBUGGING AND TESTING ONLY.</Text>
        </View>
      </ScrollView>

      <ConfirmDialog
        visible={showSeedConfirm}
        onClose={() => setShowSeedConfirm(false)}
        title="Seed Test Data"
        message="This will add 12 months of transactions to your default account. Are you sure?"
        confirmLabel="Generate"
        isLoading={isSeeding}
        onConfirm={handleRunSeed}
      />
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 48,
  },
  section: {
    marginBottom: 28,
  },
  sectionLabel: {
    fontFamily: TYPOGRAPHY.fonts.semibold,
    fontSize: 10,
    color: colors.textMuted,
    letterSpacing: 2,
    marginBottom: 12,
    paddingLeft: 4,
  },
  card: {
    borderRadius: 20,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginRight: 14,
  },
  textDetails: {
    flex: 1,
  },
  rowTitle: {
    fontFamily: TYPOGRAPHY.fonts.semibold,
    fontSize: 16,
    color: colors.text,
  },
  rowSubtitle: {
    fontFamily: TYPOGRAPHY.fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.text + '08',
  },
  infoLabel: {
    fontFamily: TYPOGRAPHY.fonts.medium,
    fontSize: 13,
    color: colors.textMuted,
  },
  infoValue: {
    fontFamily: TYPOGRAPHY.fonts.semibold,
    fontSize: 13,
    color: colors.text,
  },
  footer: {
    marginTop: 48,
    alignItems: 'center',
    gap: 6,
  },
  footerBrand: {
    fontFamily: TYPOGRAPHY.fonts.semibold,
    fontSize: 10,
    color: colors.text,
    letterSpacing: 3,
  },
  footerCopy: {
    fontFamily: TYPOGRAPHY.fonts.regular,
    fontSize: 9,
    color: colors.textMuted,
    textAlign: 'center',
    maxWidth: 200,
    lineHeight: 14,
    letterSpacing: 0.5,
  },
});
