export function formatINR(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₹0.00';
  }

  // Format with standard Indian numbering system (Lakhs and Crores)
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  const parts = absAmount.toFixed(2).split('.');
  let integerPart = parts[0];
  const decimalPart = parts[1];

  // Indian formatting regex
  let lastThree = integerPart.substring(integerPart.length - 3);
  const otherNumbers = integerPart.substring(0, integerPart.length - 3);
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  const formatted = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;

  return `${isNegative ? '-' : ''}₹${formatted}.${decimalPart}`;
}

export function formatNumberIndian(num: number): string {
  if (isNaN(num)) return '0';
  return num.toLocaleString('en-IN');
}
