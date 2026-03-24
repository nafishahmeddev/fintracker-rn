import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
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

export function AccountFormModal({ visible, onClose, account }: AccountFormModalProps) {
  const isEditing = !!account;
  const { mutateAsync: createAccount, isPending: creating } = useCreateAccount();
  const { mutateAsync: updateAccount, isPending: updating } = useUpdateAccount();

  const [name, setName] = useState('');
  const [holderName, setHolderName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [balance, setBalance] = useState('');

  useEffect(() => {
    if (account && visible) {
      setName(account.name);
      setHolderName(account.holderName);
      setAccountNumber(account.accountNumber);
      setBalance(account.balance.toString());
    } else if (visible) {
      setName('');
      setHolderName('');
      setAccountNumber('');
      setBalance('');
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
          }
        });
      } else {
        await createAccount({
          name,
          holderName: holderName || 'N/A',
          accountNumber: accountNumber || 'N/A',
          balance: parseFloat(balance) || 0,
          isDefault: false,
          icon: 58000,
          color: parseInt(colors.primary.replace('#', '0x')),
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
        </ScrollView>

        <View style={styles.footer}>
          <Button title="Save Account" onPress={handleSave} isLoading={isPending} style={{ width: '100%' }} />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
  footer: { padding: 24, paddingBottom: 48 },
});
