import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { TransactionFormPage } from '../../../src/features/transactions/screens/TransactionFormPage';

const parseParamNumber = (value: string | string[] | undefined): number | null => {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return null;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : null;
};

export default function EditTransactionRoute() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const transactionId = React.useMemo(() => parseParamNumber(params.id), [params.id]);

  return <TransactionFormPage mode="edit" transactionId={transactionId} />;
}
