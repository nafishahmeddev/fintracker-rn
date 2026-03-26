import { Ionicons } from '@expo/vector-icons';
import { BlurView } from '@sbaiahmed1/react-native-blur';
import React, { useMemo, useState } from 'react';
import {
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { CURRENCIES } from '../../constants/currency';
import { useTheme } from '../../providers/ThemeProvider';
import { ThemeColors } from '../../theme/colors';
import { TYPOGRAPHY } from '../../theme/typography';

export type CurrencyPickerModalProps = {
  visible: boolean;
  onClose: () => void;
  value: string;
  onChange: (code: string) => void;
};

export function CurrencyPickerModal({ visible, onClose, value, onChange }: CurrencyPickerModalProps) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CURRENCIES;
    return CURRENCIES.filter(
      (c) => c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
    );
  }, [query]);

  const handleSelect = (code: string) => {
    onChange(code);
    onClose();
  };

  const handleClose = () => {
    setQuery('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <TouchableOpacity style={styles.backdrop} onPress={handleClose} activeOpacity={1} />

        <View style={styles.sheet}>
          <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
            <View style={[styles.glow, { top: -60, left: -60, width: 280, height: 280, backgroundColor: colors.primary + '28' }]} />
            <View style={[styles.glow, { bottom: -60, right: -80, width: 360, height: 360, backgroundColor: colors.text + '0A' }]} />
          </View>

          <BlurView
            blurAmount={Platform.OS === 'ios' ? 80 : 96}
            blurType={isDark ? 'dark' : 'light'}
            style={StyleSheet.absoluteFillObject}
          />
          {Platform.OS === 'android' && (
            <View
              pointerEvents="none"
              style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.background + '60' }]}
            />
          )}

          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Select Currency</Text>
              <Text style={styles.subtitle}>{CURRENCIES.length} currencies worldwide</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Ionicons name="close" size={18} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View style={styles.searchWrap}>
            <Ionicons name="search-outline" size={16} color={colors.textMuted} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder="Search by code or name…"
              placeholderTextColor={colors.textMuted}
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close-circle" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* List */}
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.code}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            renderItem={({ item }) => {
              const selected = item.code === value;
              return (
                <TouchableOpacity
                  style={[styles.row, selected && styles.rowSelected]}
                  onPress={() => handleSelect(item.code)}
                  activeOpacity={0.85}
                >
                  <View style={[styles.codeWrap, selected && styles.codeWrapSelected]}>
                    <Text style={[styles.code, selected && styles.codeSelected]}>{item.code}</Text>
                  </View>
                  <Text style={[styles.name, selected && styles.nameSelected]} numberOfLines={1}>
                    {item.name}
                  </Text>
                  {selected && (
                    <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                  )}
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyText}>No currencies match &ldquo;{query}&rdquo;</Text>
              </View>
            }
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.55)',
      justifyContent: 'flex-end',
    },
    backdrop: {
      flex: 1,
    },
    sheet: {
      height: '82%',
      borderTopLeftRadius: 30,
      borderTopRightRadius: 30,
      borderTopWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      backgroundColor: 'transparent',
    },
    glow: {
      position: 'absolute',
      borderRadius: 999,
    },
    handle: {
      alignSelf: 'center',
      width: 42,
      height: 4,
      borderRadius: 999,
      marginTop: 10,
      backgroundColor: colors.textMuted + '55',
    },
    header: {
      paddingHorizontal: 24,
      paddingTop: 14,
      paddingBottom: 10,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    title: {
      fontFamily: TYPOGRAPHY.fonts.heading,
      fontSize: 28,
      color: colors.text,
      letterSpacing: -0.8,
    },
    subtitle: {
      fontFamily: TYPOGRAPHY.fonts.regular,
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 2,
    },
    closeBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    searchWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: 24,
      marginBottom: 10,
      height: 44,
      borderRadius: 14,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 12,
      gap: 8,
    },
    searchIcon: {
      flexShrink: 0,
    },
    searchInput: {
      flex: 1,
      fontFamily: TYPOGRAPHY.fonts.regular,
      fontSize: 14,
      color: colors.text,
      paddingVertical: 0,
    },
    listContent: {
      paddingHorizontal: 24,
      paddingBottom: Platform.OS === 'ios' ? 24 : 32,
    },
    separator: {
      height: 1,
      backgroundColor: colors.border,
      marginLeft: 54,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 13,
      gap: 12,
    },
    rowSelected: {},
    codeWrap: {
      width: 42,
      height: 30,
      borderRadius: 8,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    codeWrapSelected: {
      backgroundColor: colors.primary + '20',
      borderColor: colors.primary + '50',
    },
    code: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      fontSize: 11,
      color: colors.textMuted,
      letterSpacing: 0.5,
    },
    codeSelected: {
      color: colors.primary,
    },
    name: {
      flex: 1,
      fontFamily: TYPOGRAPHY.fonts.regular,
      fontSize: 14,
      color: colors.text,
    },
    nameSelected: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      color: colors.text,
    },
    emptyWrap: {
      paddingVertical: 48,
      alignItems: 'center',
    },
    emptyText: {
      fontFamily: TYPOGRAPHY.fonts.regular,
      fontSize: 14,
      color: colors.textMuted,
    },
  });
