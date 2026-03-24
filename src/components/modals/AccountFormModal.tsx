import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../providers/ThemeProvider';
import { ThemeColors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useCreateAccount, useUpdateAccount } from '../../hooks/accounts';

import { Account } from '../../api/accounts';

export type AccountFormModalProps = {
  visible: boolean;
  onClose: () => void;
  account?: Account;
};

const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'CAD', 'AUD', 'BGN'];
const ICONS = ['wallet', 'card', 'cash', 'pie-chart', 'stats-chart', 'cart', 'car', 'home', 'airplane', 'fitness', 'gift', 'medical', 'business', 'briefcase'];
const COLORS = ['#00FFAA', '#00F0FF', '#8B5CF6', '#EC4899', '#F43F5E', '#EAB308', '#F97316', '#10B981', '#3B82F6', '#64748B'];

export function AccountFormModal({ visible, onClose, account }: AccountFormModalProps) {
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const isEditing = !!account;
  const { mutateAsync: createAccount, isPending: creating } = useCreateAccount();
  const { mutateAsync: updateAccount, isPending: updating } = useUpdateAccount();

  const [name, setName] = useState('');
  const [holderName, setHolderName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [balance, setBalance] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [icon, setIcon] = useState('wallet');
  const [colorHex, setColorHex] = useState(COLORS[0]);

  useEffect(() => {
    if (account && visible) {
      setName(account.name);
      setHolderName(account.holderName);
      setAccountNumber(account.accountNumber);
      setBalance(account.balance.toString());
      setCurrency(account.currency || 'USD');
      setIcon(typeof account.icon === 'string' ? account.icon : 'wallet');
      const hex = '#' + account.color.toString(16).padStart(6, '0').toUpperCase();
      setColorHex(COLORS.includes(hex) ? hex : hex); // Fallback to raw hex if not in presets
    } else if (visible) {
      setName('');
      setHolderName('');
      setAccountNumber('');
      setBalance('');
      setCurrency('USD');
      setIcon('wallet');
      setColorHex(COLORS[0]);
    }
  }, [account, visible]);

  const handleSave = async () => {
    if (!name) return alert("Account Name is required");

    try {
      if (isEditing) {
        await updateAccount({
          id: account.id,
          data: {
            name,
            holderName,
            accountNumber,
            balance: parseFloat(balance) || 0,
            currency,
            icon,
            color: parseInt(colorHex.replace('#', '0x')),
          }
        });
      } else {
        await createAccount({
          name,
          holderName: holderName || 'N/A',
          accountNumber: accountNumber || 'N/A',
          balance: parseFloat(balance) || 0,
          currency,
          isDefault: false,
          icon,
          color: parseInt(colorHex.replace('#', '0x')),
          income: 0,
          expense: 0,
        });
      }
      onClose();
    } catch {
      alert("Failed to save account.");
    }
  };

  const isPending = creating || updating;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isEditing ? 'Edit Account' : 'New Account'}</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.formContainer}>
          <Input label="Account Name" value={name} onChangeText={setName} placeholder="e.g. Wallet, Bank" />
          <Input label="Holder Name" value={holderName} onChangeText={setHolderName} placeholder="e.g. John Doe" />
          <Input label="Account Number" value={accountNumber} onChangeText={setAccountNumber} placeholder="e.g. XXXX-XXXX" />
          <Input label="Initial Balance" value={balance} onChangeText={setBalance} placeholder="0.00" keyboardType="decimal-pad" />
          
          <Text style={styles.sectionLabel}>Select Currency</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerScroll} contentContainerStyle={styles.pickerContent}>
            {CURRENCIES.map((c) => (
              <TouchableOpacity key={c} style={[styles.pickerItem, currency === c && styles.pickerSelected]} onPress={() => setCurrency(c)}>
                <Text style={[styles.pickerText, currency === c && styles.pickerSelectedText]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.sectionLabel}>Select Icon</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerScroll} contentContainerStyle={styles.pickerContent}>
            {ICONS.map((i) => (
              <TouchableOpacity key={i} style={[styles.pickerItem, icon === i && styles.pickerSelected]} onPress={() => setIcon(i)}>
                <Ionicons name={i as any} size={24} color={icon === i ? colors.primary : colors.textMuted} />
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.sectionLabel}>Select Color</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerScroll} contentContainerStyle={styles.pickerContent}>
            {COLORS.map((c) => (
              <TouchableOpacity 
                key={c} 
                style={[styles.colorItem, { backgroundColor: c }, colorHex === c && styles.colorSelected]} 
                onPress={() => setColorHex(c)}
              />
            ))}
          </ScrollView>
        </ScrollView>

        <View style={styles.footer}>
          <Button title="Save Account" onPress={handleSave} isLoading={isPending} style={{ width: '100%' }} />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  modalContainer: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeButton: { padding: 4 },
  headerTitle: { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: colors.text },
  formContainer: { padding: 24 },
  sectionLabel: { fontSize: typography.sizes.sm, fontWeight: typography.weights.bold, color: colors.textMuted, marginTop: 16, marginBottom: 8 },
  pickerScroll: { marginBottom: 8 },
  pickerContent: { paddingRight: 20 },
  pickerItem: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: 'transparent', paddingVertical: 12, paddingHorizontal: 16, marginRight: 8, minWidth: 64 },
  pickerSelected: { borderColor: colors.primary, backgroundColor: colors.primary + '15' },
  pickerSelectedText: { color: colors.primary, fontWeight: typography.weights.bold },
  pickerText: { color: colors.text, fontSize: typography.sizes.sm },
  colorItem: { width: 44, height: 44, borderRadius: 22, marginRight: 12, borderWidth: 2, borderColor: 'transparent' },
  colorSelected: { borderColor: colors.text, transform: [{ scale: 1.1 }] },
  footer: { padding: 24, paddingBottom: 48 },
});
