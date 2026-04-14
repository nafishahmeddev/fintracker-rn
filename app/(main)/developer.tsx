import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Alert, DevSettings, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurBackground } from '../../src/components/ui/BlurBackground';
import { ConfirmDialog } from '../../src/components/ui/ConfirmDialog';
import { Header } from '../../src/components/ui/Header';
import { useTheme } from '../../src/providers/ThemeProvider';
import { ThemeColors } from '../../src/theme/colors';
import { TYPOGRAPHY } from '../../src/theme/typography';
import { usePremium } from '../../src/providers/PremiumProvider';
import { Input } from '../../src/components/ui/Input';
import { seedDummyData } from '../../src/utils/seed';

export default function DeveloperScreen() {
  const { colors } = useTheme();
  const { devOverride, setDevOverride } = usePremium();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [pin, setPin] = React.useState('');
  const [error, setError] = React.useState('');
  const [showSeedConfirm, setShowSeedConfirm] = React.useState(false);
  const [isSeeding, setIsSeeding] = React.useState(false);

  const handlePinChange = (val: string) => {
    setPin(val);
    setError('');
    
    if (val === '32159') {
      setIsAuthenticated(true);
    } else if (val.length >= 5) {
      setError('Invalid Access Token');
      // Clear after a short delay for feedback
      setTimeout(() => setPin(''), 1000);
    }
  };

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

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <BlurBackground />
        <Header title="Restricted" subtitle="Authentication required" showBack />
        
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardContent}
        >
          <View style={styles.lockContainer}>
            <View style={[styles.lockIconBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="lock-closed" size={32} color={colors.text} />
            </View>
            
            <View style={styles.lockInfo}>
              <Text style={styles.lockTitle}>SYSTEM LOCK</Text>
              <Text style={styles.lockSubtitle}>Enter the 5-digit authorization key to proceed.</Text>
            </View>

            <View style={styles.inputWrap}>
              <Input
                placeholder="•••••"
                value={pin}
                onChangeText={handlePinChange}
                keyboardType="numeric"
                maxLength={5}
                secureTextEntry
                textAlign="center"
                style={styles.pinInput}
                autoFocus
                error={error}
              />
            </View>
            
            <View style={styles.securityBranding}>
               <Text style={styles.securityText}>LUNO / SECURITY_LAYER_ACTIVE</Text>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <BlurBackground />
      <Header title="Developer" subtitle="Secret system tools" showBack />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>TESTING OVERRIDES</Text>
          <View style={styles.card}>
            <View style={styles.overrideHeader}>
              <View style={[styles.iconBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Ionicons name="flash-outline" size={18} color="#FFD700" />
              </View>
              <View style={styles.textDetails}>
                 <Text style={styles.rowTitle}>PRO Entitlements</Text>
                 <Text style={styles.rowSubtitle}>Override system purchase checks</Text>
              </View>
            </View>

            <View style={styles.tripleButtonGroup}>
              <TouchableOpacity 
                style={[styles.smallBtn, devOverride === 'FORCED_ON' && { backgroundColor: colors.primary }]} 
                onPress={() => setDevOverride('FORCED_ON')}
                activeOpacity={0.7}
              >
                <Text style={[styles.btnLabel, devOverride === 'FORCED_ON' && { color: colors.background }]}>ON</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.smallBtn, devOverride === 'FORCED_OFF' && { backgroundColor: colors.danger }]} 
                onPress={() => setDevOverride('FORCED_OFF')}
                activeOpacity={0.7}
              >
                <Text style={[styles.btnLabel, devOverride === 'FORCED_OFF' && { color: colors.background }]}>OFF</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.smallBtn, devOverride === 'DEFAULT' && { backgroundColor: colors.text }]} 
                onPress={() => setDevOverride('DEFAULT')}
                activeOpacity={0.7}
              >
                <Text style={[styles.btnLabel, devOverride === 'DEFAULT' && { color: colors.background }]}>RESET</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

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
  keyboardContent: {
    flex: 1,
  },
  lockContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 80,
  },
  lockIconBox: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: 24,
  },
  lockInfo: {
    alignItems: 'center',
    marginBottom: 32,
    gap: 8,
  },
  lockTitle: {
    fontFamily: TYPOGRAPHY.fonts.bold,
    fontSize: 12,
    color: colors.text,
    letterSpacing: 4,
  },
  lockSubtitle: {
    fontFamily: TYPOGRAPHY.fonts.regular,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  inputWrap: {
    width: '100%',
    maxWidth: 200,
  },
  pinInput: {
    fontSize: 24,
    fontFamily: TYPOGRAPHY.fonts.bold,
    letterSpacing: 10,
  },
  securityBranding: {
    marginTop: 48,
  },
  securityText: {
    fontFamily: TYPOGRAPHY.fonts.semibold,
    fontSize: 9,
    color: colors.textMuted,
    letterSpacing: 1.5,
    opacity: 0.5,
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
  overrideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 10,
  },
  tripleButtonGroup: {
    flexDirection: 'row',
    padding: 16,
    paddingTop: 0,
    gap: 8,
  },
  smallBtn: {
    flex: 1,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#00000010',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#00000005',
  },
  btnLabel: {
    fontFamily: TYPOGRAPHY.fonts.bold,
    fontSize: 10,
    letterSpacing: 0.5,
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
