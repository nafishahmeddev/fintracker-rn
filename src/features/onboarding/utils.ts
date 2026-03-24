export const toDbColor = (value: string) => Number.parseInt(value.replace('#', ''), 16);

export const parseAmount = (value: string) => {
  const normalized = value.replace(',', '.').replace(/[^0-9.]/g, '');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};
