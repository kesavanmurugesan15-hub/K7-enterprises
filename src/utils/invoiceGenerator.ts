import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { SalesOrder } from '../types/order';
import type { BusinessSettings } from '../types/auth';
import { formatINR } from './currency';
import { formatDate } from './date';

function numberToWordsINR(amount: number): string {
  const rounded = Math.round(amount);
  if (rounded === 0) return 'Zero Rupees Only';

  const singleDigits = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertTwoDigits(n: number): string {
    if (n < 10) return singleDigits[n];
    if (n >= 10 && n < 20) return teens[n - 10];
    return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + singleDigits[n % 10] : '');
  }

  function convertThreeDigits(n: number): string {
    const hundred = Math.floor(n / 100);
    const rest = n % 100;
    let res = '';
    if (hundred > 0) {
      res += singleDigits[hundred] + ' Hundred';
      if (rest > 0) res += ' and ';
    }
    if (rest > 0) {
      res += convertTwoDigits(rest);
    }
    return res;
  }

  let crore = Math.floor(rounded / 10000000);
  let remainder = rounded % 10000000;
  let lakh = Math.floor(remainder / 100000);
  remainder = remainder % 100000;
  let thousand = Math.floor(remainder / 1000);
  remainder = remainder % 1000;

  let words = '';
  if (crore > 0) words += convertTwoDigits(crore) + ' Crore ';
  if (lakh > 0) words += convertTwoDigits(lakh) + ' Lakh ';
  if (thousand > 0) words += convertTwoDigits(thousand) + ' Thousand ';
  if (remainder > 0) words += convertThreeDigits(remainder) + ' ';

  return 'INR ' + words.trim() + ' Rupees Only';
}

/**
 * Generate and trigger download of formal GST Tax Invoice PDF
 */
export function downloadInvoicePDF(order: SalesOrder, settings: BusinessSettings): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const primaryRed = [183, 28, 44]; // #B71C2C
  const darkCharcoal = [32, 36, 43];
  const lightGrey = [245, 246, 248];

  // 1. Header Box
  doc.setFillColor(183, 28, 44);
  doc.rect(0, 0, 210, 8, 'F');

  // Business Name & Logo
  doc.setTextColor(183, 28, 44);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('K7 ENTERPRISE', 14, 20);

  doc.setTextColor(60, 60, 60);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Aachi Masala Authorized Distributor — Thoothukudi District', 14, 26);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`${settings.address}, ${settings.city} - ${settings.pincode}, Tamil Nadu`, 14, 31);
  doc.text(`GSTIN: ${settings.gstin}  |  FSSAI: ${settings.fssaiNumber}  |  PAN: ${settings.panNumber}`, 14, 35);
  doc.text(`Phone: ${settings.phone}  |  Email: ${settings.email}`, 14, 39);

  // Invoice Title Pill (Top Right)
  doc.setFillColor(245, 246, 248);
  doc.setDrawColor(227, 230, 234);
  doc.roundedRect(130, 13, 66, 28, 2, 2, 'FD');

  doc.setTextColor(183, 28, 44);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('TAX INVOICE', 163, 19, { align: 'center' });

  doc.setTextColor(32, 36, 43);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Invoice No:', 134, 25);
  doc.setFont('helvetica', 'normal');
  doc.text(order.invoiceNumber || 'K7-INV-DRAFT', 154, 25);

  doc.setFont('helvetica', 'bold');
  doc.text('Date:', 134, 30);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDate(order.orderDate), 154, 30);

  doc.setFont('helvetica', 'bold');
  doc.text('Order Ref:', 134, 35);
  doc.setFont('helvetica', 'normal');
  doc.text(order.orderNumber, 154, 35);

  // 2. Bill To & Payment Info Boxes
  doc.setDrawColor(227, 230, 234);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(14, 45, 90, 30, 1, 1, 'D');
  doc.roundedRect(106, 45, 90, 30, 1, 1, 'D');

  // Bill To (Left)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('BILLED & SHIPPED TO:', 18, 50);

  doc.setFontSize(9.5);
  doc.setTextColor(32, 36, 43);
  doc.text(order.retailerShopName, 18, 55);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Proprietor: ${order.retailerOwnerName}`, 18, 60);
  doc.text(`${order.deliveryAddress}`, 18, 65, { maxWidth: 82 });
  doc.text(`Phone: ${order.retailerPhone}`, 18, 71);

  // Payment / Delivery Terms (Right)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('PAYMENT & LOGISTICS:', 110, 50);

  doc.setFontSize(8);
  doc.setTextColor(32, 36, 43);
  doc.text('Payment Mode:', 110, 56);
  doc.setFont('helvetica', 'normal');
  doc.text(`${order.paymentMethod}`, 140, 56);

  doc.setFont('helvetica', 'bold');
  doc.text('Delivery Area:', 110, 61);
  doc.setFont('helvetica', 'normal');
  doc.text(`${order.area}`, 140, 61);

  doc.setFont('helvetica', 'bold');
  doc.text('Settlement Bank:', 110, 66);
  doc.setFont('helvetica', 'normal');
  doc.text(`${settings.bankDetails.bankName}`, 140, 66);

  doc.setFont('helvetica', 'bold');
  doc.text('TMB A/c:', 110, 71);
  doc.setFont('helvetica', 'normal');
  doc.text(`${settings.bankDetails.accountNumber} (IFSC: ${settings.bankDetails.ifscCode})`, 140, 71);

  // 3. Line Items Table using autoTable
  const tableData = order.items.map((item, index) => [
    (index + 1).toString(),
    `${item.productName} (${item.packSize})`,
    '2103',
    item.quantity.toString(),
    item.unitPrice.toFixed(2),
    item.taxableAmount.toFixed(2),
    `${item.gstPercent}%`,
    (item.gstAmount / 2).toFixed(2),
    (item.gstAmount / 2).toFixed(2),
    item.totalAmount.toFixed(2)
  ]);

  autoTable(doc, {
    startY: 79,
    head: [[
      '#',
      'Description of Aachi Masala Products',
      'HSN',
      'Qty',
      'Rate (₹)',
      'Taxable (₹)',
      'GST',
      'CGST (₹)',
      'SGST (₹)',
      'Total (₹)'
    ]],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      textColor: [32, 36, 43],
      lineColor: [227, 230, 234],
      lineWidth: 0.2
    },
    headStyles: {
      fillColor: [245, 246, 248],
      textColor: [32, 36, 43],
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { cellWidth: 62 },
      2: { halign: 'center', cellWidth: 14 },
      3: { halign: 'center', cellWidth: 10, fontStyle: 'bold' },
      4: { halign: 'right', cellWidth: 16 },
      5: { halign: 'right', cellWidth: 18 },
      6: { halign: 'center', cellWidth: 12 },
      7: { halign: 'right', cellWidth: 15 },
      8: { halign: 'right', cellWidth: 15 },
      9: { halign: 'right', cellWidth: 20, fontStyle: 'bold' }
    },
    margin: { left: 14, right: 14 }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 4;

  // 4. Totals and In-Words Section
  const halfGst = (order.totalGst / 2).toFixed(2);

  // In Words Box (Left)
  doc.setDrawColor(227, 230, 234);
  doc.roundedRect(14, finalY, 110, 36, 1, 1, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 100, 100);
  doc.text('AMOUNT IN WORDS:', 18, finalY + 5);

  doc.setFontSize(8);
  doc.setTextColor(32, 36, 43);
  doc.text(numberToWordsINR(order.grandTotal), 18, finalY + 11, { maxWidth: 102 });

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 100, 100);
  doc.text('DIRECT SETTLEMENT UPI ID:', 18, finalY + 22);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(183, 28, 44);
  doc.text(`${settings.bankDetails.upiId}`, 18, finalY + 27);

  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  doc.text('Declaration: Rates charged are as per Aachi distributor authorized wholesale list.', 18, finalY + 32);

  // Summary Table (Right)
  doc.roundedRect(128, finalY, 68, 36, 1, 1, 'D');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);

  doc.text('Taxable Value:', 132, finalY + 6);
  doc.text(`Rs. ${order.taxableSubtotal.toFixed(2)}`, 192, finalY + 6, { align: 'right' });

  doc.text('CGST:', 132, finalY + 12);
  doc.text(`Rs. ${halfGst}`, 192, finalY + 12, { align: 'right' });

  doc.text('SGST:', 132, finalY + 18);
  doc.text(`Rs. ${halfGst}`, 192, finalY + 18, { align: 'right' });

  doc.text('Delivery & Freight:', 132, finalY + 24);
  doc.text('FREE (Van)', 192, finalY + 24, { align: 'right' });

  // Grand Total highlight bar
  doc.setFillColor(183, 28, 44);
  doc.rect(128, finalY + 28, 68, 8, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('TOTAL PAYABLE:', 132, finalY + 33.5);
  doc.text(`Rs. ${order.grandTotal.toFixed(2)}`, 192, finalY + 33.5, { align: 'right' });

  // 5. Terms & Signatures
  const signY = finalY + 44;

  doc.setDrawColor(200, 200, 200);
  doc.line(14, signY + 16, 64, signY + 16);
  doc.line(144, signY + 16, 196, signY + 16);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text("Customer's Counter Signature", 14, signY + 20);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(32, 36, 43);
  doc.text(`For ${settings.businessName}`, 144, signY + 20);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('Authorized Signatory', 144, signY + 23.5);

  // Save the PDF
  const sanitizedInvoiceNumber = (order.invoiceNumber || order.orderNumber).replace(/[\/\\]/g, '_');
  doc.save(`Invoice_${sanitizedInvoiceNumber}.pdf`);
}
