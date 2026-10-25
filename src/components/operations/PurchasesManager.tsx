import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { dataService } from '../../services/dataService';
import { PurchaseOrder, GoodsReceiptNote, Supplier } from '../../types/purchase';
import { Product } from '../../types/product';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { formatINR } from '../../utils/currency';
import { formatDate, getTodayDateString } from '../../utils/date';
import { Plus, PackageCheck, FileText, ArrowRight, CheckCircle2, Building, Trash2 } from 'lucide-react';

export const PurchasesManager: React.FC = () => {
  const { currentUser } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>(dataService.getSuppliers());
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(dataService.getPurchaseOrders());
  const [grns, setGrns] = useState<GoodsReceiptNote[]>(dataService.getGoodsReceiptNotes());
  const [products, setProducts] = useState<Product[]>(dataService.getProducts());

  const [activeTab, setActiveTab] = useState<'grn' | 'po' | 'suppliers'>('grn');

  // Modals
  const [isPoModalOpen, setIsPoModalOpen] = useState(false);
  const [isGrnModalOpen, setIsGrnModalOpen] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);

  // Form states for new PO
  const [poSupplierId, setPoSupplierId] = useState(suppliers[0]?.id || '');
  const [poItems, setPoItems] = useState<{ productId: string; quantity: number; unitRate: number }[]>([
    { productId: products[0]?.id || '', quantity: 100, unitRate: products[0]?.purchaseRate || 35 }
  ]);

  // Form states for GRN posting
  const [grnSupplierId, setGrnSupplierId] = useState(suppliers[0]?.id || '');
  const [grnPoId, setGrnPoId] = useState('');
  const [grnInvoiceNumber, setGrnInvoiceNumber] = useState('');
  const [grnInvoiceDate, setGrnInvoiceDate] = useState(getTodayDateString());
  const [grnReceivedDate, setGrnReceivedDate] = useState(getTodayDateString());
  const [grnItems, setGrnItems] = useState<{
    productId: string;
    quantity: number;
    unitRate: number;
    batchNumber: string;
    mfgDate: string;
    expDate: string;
  }[]>([
    {
      productId: products[0]?.id || '',
      quantity: 100,
      unitRate: products[0]?.purchaseRate || 35,
      batchNumber: `B-ACH-${new Date().getFullYear().toString().slice(-2)}${String(new Date().getMonth() + 1).padStart(2, '0')}`,
      mfgDate: getTodayDateString(),
      expDate: `${new Date().getFullYear() + 1}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`
    }
  ]);

  useEffect(() => {
    const unsub = dataService.subscribe('*', () => {
      setSuppliers(dataService.getSuppliers());
      setPurchaseOrders(dataService.getPurchaseOrders());
      setGrns(dataService.getGoodsReceiptNotes());
      setProducts(dataService.getProducts());
    });
    return () => unsub();
  }, []);

  // Handle PO Creation
  const handleCreatePo = (e: React.FormEvent) => {
    e.preventDefault();
    const sup = suppliers.find(s => s.id === poSupplierId);
    if (!sup) {
      alert('Please select a supplier.');
      return;
    }

    let subTotal = 0;
    let totalGstAmount = 0;

    const mappedItems = poItems.map(item => {
      const prod = products.find(p => p.id === item.productId);
      const taxable = item.quantity * item.unitRate;
      const gst = (taxable * (prod?.gstPercent || 5)) / 100;
      subTotal += taxable;
      totalGstAmount += gst;

      return {
        productId: item.productId,
        productName: prod?.name || 'Aachi Product',
        sku: prod?.sku || 'SKU',
        packSize: prod?.packSize || '100g',
        orderedQuantity: item.quantity,
        receivedQuantity: 0,
        unitRate: item.unitRate,
        gstPercent: prod?.gstPercent || 5,
        gstAmount: gst,
        totalAmount: taxable + gst
      };
    });

    dataService.createPurchaseOrder({
      supplierId: sup.id,
      supplierName: sup.name,
      supplierGstin: sup.gstin,
      orderDate: getTodayDateString(),
      expectedDeliveryDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      status: 'ISSUED',
      items: mappedItems,
      subTotal,
      totalGstAmount,
      roundOff: 0,
      grandTotal: subTotal + totalGstAmount,
      createdBy: currentUser.name
    }, currentUser);

    setIsPoModalOpen(false);
  };

  // Handle GRN Posting
  const handlePostGrn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!grnInvoiceNumber) {
      alert('Supplier Invoice Number is required to post Goods Receipt.');
      return;
    }

    const sup = suppliers.find(s => s.id === grnSupplierId);
    if (!sup) {
      alert('Select a supplier.');
      return;
    }

    let totalTaxable = 0;
    let totalGst = 0;

    const mappedItems = grnItems.map(item => {
      const prod = products.find(p => p.id === item.productId);
      const taxable = item.quantity * item.unitRate;
      const gstPercent = prod?.gstPercent || 5;
      const gst = (taxable * gstPercent) / 100;
      totalTaxable += taxable;
      totalGst += gst;

      return {
        productId: item.productId,
        productName: prod?.name || 'Aachi Product',
        sku: prod?.sku || 'SKU',
        packSize: prod?.packSize || '100g',
        receivedQuantity: item.quantity,
        acceptedQuantity: item.quantity,
        rejectedQuantity: 0,
        unitRate: item.unitRate,
        batchNumber: item.batchNumber,
        mfgDate: item.mfgDate,
        expDate: item.expDate,
        gstPercent,
        taxableAmount: taxable,
        gstAmount: gst,
        totalAmount: taxable + gst
      };
    });

    dataService.postGoodsReceipt({
      poId: grnPoId,
      poNumber: purchaseOrders.find(p => p.id === grnPoId)?.poNumber || '',
      supplierId: sup.id,
      supplierName: sup.name,
      supplierInvoiceNumber: grnInvoiceNumber,
      supplierInvoiceDate: grnInvoiceDate,
      receivedDate: grnReceivedDate,
      receivedBy: currentUser.name,
      items: mappedItems,
      totalTaxable,
      totalGst,
      freightCharges: 0,
      grandTotal: Math.round((totalTaxable + totalGst) * 100) / 100
    }, currentUser);

    setIsGrnModalOpen(false);
    setGrnInvoiceNumber('');
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface p-4 rounded-lg border border-divider shadow-enterprise">
        <div>
          <h2 className="text-lg font-bold text-ink-primary">Purchases & Goods Receipt Note (GRN)</h2>
          <p className="text-xs text-ink-secondary mt-0.5">
            Procure stock from Aachi C&F depots, post verified inward receipts, register FEFO batches, and post balanced double-entry vouchers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={FileText}
            onClick={() => setIsPoModalOpen(true)}
          >
            Create Purchase Order
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={PackageCheck}
            onClick={() => setIsGrnModalOpen(true)}
          >
            Post Inward Goods Receipt (GRN)
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-divider pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('grn')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            activeTab === 'grn' ? 'bg-brand text-white shadow-sm' : 'bg-surface text-ink-secondary hover:bg-slate-100'
          }`}
        >
          Goods Receipt Notes ({grns.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('po')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            activeTab === 'po' ? 'bg-brand text-white shadow-sm' : 'bg-surface text-ink-secondary hover:bg-slate-100'
          }`}
        >
          Purchase Orders ({purchaseOrders.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('suppliers')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            activeTab === 'suppliers' ? 'bg-brand text-white shadow-sm' : 'bg-surface text-ink-secondary hover:bg-slate-100'
          }`}
        >
          Aachi C&F Suppliers ({suppliers.length})
        </button>
      </div>

      {/* GRN View */}
      {activeTab === 'grn' && (
        <div className="bg-surface border border-divider rounded-lg shadow-enterprise overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-divider text-ink-secondary uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">GRN #</th>
                  <th className="py-3 px-4">Received Date</th>
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-4">Supplier Invoice #</th>
                  <th className="py-3 px-4">Items Inwarded</th>
                  <th className="py-3 px-4 text-right">Taxable</th>
                  <th className="py-3 px-4 text-right">GST</th>
                  <th className="py-3 px-4 text-right">Grand Total</th>
                  <th className="py-3 px-4">Posting Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-divider/70 text-ink-primary">
                {grns.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-ink-muted">
                      No Goods Receipts posted yet. Click "Post Inward Goods Receipt" to receive inventory from Aachi Depot.
                    </td>
                  </tr>
                ) : (
                  grns.map(grn => (
                    <tr key={grn.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-brand">{grn.grnNumber}</td>
                      <td className="py-3 px-4">{formatDate(grn.receivedDate)}</td>
                      <td className="py-3 px-4 font-semibold">{grn.supplierName}</td>
                      <td className="py-3 px-4 font-mono text-ink-secondary">
                        {grn.supplierInvoiceNumber}
                        <div className="text-[10px] text-ink-muted">Dt: {formatDate(grn.supplierInvoiceDate)}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          {grn.items.map((it, idx) => (
                            <div key={idx} className="text-[11px]">
                              <span className="font-medium">{it.productName}</span>: {it.acceptedQuantity} pkts
                              <span className="text-ink-muted ml-1">[{it.batchNumber}]</span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-num">{formatINR(grn.totalTaxable)}</td>
                      <td className="py-3 px-4 text-right font-medium text-num text-ink-secondary">{formatINR(grn.totalGst)}</td>
                      <td className="py-3 px-4 text-right font-bold text-num text-brand">{formatINR(grn.grandTotal)}</td>
                      <td className="py-3 px-4">
                        <Badge variant="success">Stock & GL Posted</Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PO View */}
      {activeTab === 'po' && (
        <div className="bg-surface border border-divider rounded-lg shadow-enterprise overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-divider text-ink-secondary uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">PO #</th>
                  <th className="py-3 px-4">Order Date</th>
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-4 text-right">Subtotal</th>
                  <th className="py-3 px-4 text-right">GST</th>
                  <th className="py-3 px-4 text-right">Grand Total</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-divider/70 text-ink-primary">
                {purchaseOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-ink-muted">
                      No Purchase Orders created yet.
                    </td>
                  </tr>
                ) : (
                  purchaseOrders.map(po => (
                    <tr key={po.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-brand">{po.poNumber}</td>
                      <td className="py-3 px-4">{formatDate(po.orderDate)}</td>
                      <td className="py-3 px-4 font-semibold">{po.supplierName}</td>
                      <td className="py-3 px-4 text-right font-medium text-num">{formatINR(po.subTotal)}</td>
                      <td className="py-3 px-4 text-right font-medium text-num text-ink-secondary">{formatINR(po.totalGstAmount)}</td>
                      <td className="py-3 px-4 text-right font-bold text-num">{formatINR(po.grandTotal)}</td>
                      <td className="py-3 px-4">
                        <Badge variant={po.status === 'COMPLETED' ? 'success' : 'brand'}>{po.status}</Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {po.status !== 'COMPLETED' && (
                          <button
                            onClick={() => {
                              setGrnPoId(po.id);
                              setGrnSupplierId(po.supplierId);
                              setIsGrnModalOpen(true);
                            }}
                            className="text-brand font-semibold hover:underline"
                          >
                            Receive Goods
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Supplier View */}
      {activeTab === 'suppliers' && (
        <div className="bg-surface border border-divider rounded-lg shadow-enterprise overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-divider text-ink-secondary uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Supplier Name</th>
                  <th className="py-3 px-4">Depot Location</th>
                  <th className="py-3 px-4">GSTIN</th>
                  <th className="py-3 px-4">Payment Terms</th>
                  <th className="py-3 px-4 text-right">Current Outstanding (Sundry Creditor)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-divider/70 text-ink-primary">
                {suppliers.map(sup => (
                  <tr key={sup.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-ink-primary">{sup.name}</div>
                      <div className="text-[11px] text-ink-secondary">{sup.contactPerson} • {sup.phone}</div>
                    </td>
                    <td className="py-3 px-4">
                      {sup.city}, {sup.state}
                    </td>
                    <td className="py-3 px-4 font-mono font-medium">{sup.gstin}</td>
                    <td className="py-3 px-4">{sup.paymentTermsDays} Days Credit</td>
                    <td className="py-3 px-4 text-right font-bold text-num text-rose-700">
                      {formatINR(sup.currentOutstandingBalance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Post GRN Modal */}
      <Modal
        isOpen={isGrnModalOpen}
        onClose={() => setIsGrnModalOpen(false)}
        title="Post Goods Receipt Note (GRN)"
        subtitle="Inward physical stock, register FEFO batch, and generate double-entry Purchase voucher"
        maxWidth="2xl"
      >
        <form onSubmit={handlePostGrn} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-ink-primary mb-1">Supplier *</label>
              <select
                value={grnSupplierId}
                onChange={e => setGrnSupplierId(e.target.value)}
                className="w-full p-2 border border-divider rounded focus:border-brand focus:outline-none bg-white"
              >
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-ink-primary mb-1">Link Purchase Order (Optional)</label>
              <select
                value={grnPoId}
                onChange={e => setGrnPoId(e.target.value)}
                className="w-full p-2 border border-divider rounded focus:border-brand focus:outline-none bg-white font-mono"
              >
                <option value="">Direct Supplier Inward</option>
                {purchaseOrders.filter(p => p.status !== 'COMPLETED').map(po => (
                  <option key={po.id} value={po.id}>{po.poNumber} ({formatINR(po.grandTotal)})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-ink-primary mb-1">Supplier Invoice Number *</label>
              <input
                type="text"
                required
                value={grnInvoiceNumber}
                onChange={e => setGrnInvoiceNumber(e.target.value)}
                className="w-full p-2 border border-divider rounded focus:border-brand focus:outline-none font-mono"
                placeholder="e.g. ACH-INV-8912"
              />
            </div>
            <div>
              <label className="block font-semibold text-ink-primary mb-1">Invoice Date *</label>
              <input
                type="date"
                required
                value={grnInvoiceDate}
                onChange={e => setGrnInvoiceDate(e.target.value)}
                className="w-full p-2 border border-divider rounded focus:border-brand focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-ink-primary mb-1">Received Date *</label>
              <input
                type="date"
                required
                value={grnReceivedDate}
                onChange={e => setGrnReceivedDate(e.target.value)}
                className="w-full p-2 border border-divider rounded focus:border-brand focus:outline-none"
              />
            </div>
          </div>

          {/* Inward Items */}
          <div className="border border-divider rounded-lg p-3 bg-slate-50 space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-ink-primary">Inward Products & Batch Details</label>
              <button
                type="button"
                onClick={() => setGrnItems([...grnItems, {
                  productId: products[0]?.id || '',
                  quantity: 50,
                  unitRate: products[0]?.purchaseRate || 35,
                  batchNumber: `B-ACH-${Date.now().toString().slice(-4)}`,
                  mfgDate: getTodayDateString(),
                  expDate: `${new Date().getFullYear() + 1}-12-31`
                }])}
                className="text-xs text-brand hover:underline font-semibold"
              >
                + Add Another Product
              </button>
            </div>

            {grnItems.map((item, idx) => (
              <div key={idx} className="p-3 bg-white rounded border border-divider space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-2">
                    <label className="text-[11px] text-ink-secondary block mb-0.5">Product</label>
                    <select
                      value={item.productId}
                      onChange={e => {
                        const pid = e.target.value;
                        const p = products.find(prod => prod.id === pid);
                        const updated = [...grnItems];
                        updated[idx].productId = pid;
                        if (p) updated[idx].unitRate = p.purchaseRate;
                        setGrnItems(updated);
                      }}
                      className="w-full p-1.5 border border-divider rounded bg-white text-xs"
                    >
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.packSize})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] text-ink-secondary block mb-0.5">Quantity Received</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={item.quantity}
                      onChange={e => {
                        const updated = [...grnItems];
                        updated[idx].quantity = Number(e.target.value);
                        setGrnItems(updated);
                      }}
                      className="w-full p-1.5 border border-divider rounded text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[11px] text-ink-secondary block mb-0.5">Batch Number *</label>
                    <input
                      type="text"
                      required
                      value={item.batchNumber}
                      onChange={e => {
                        const updated = [...grnItems];
                        updated[idx].batchNumber = e.target.value;
                        setGrnItems(updated);
                      }}
                      className="w-full p-1.5 border border-divider rounded text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-ink-secondary block mb-0.5">Mfg Date</label>
                    <input
                      type="date"
                      value={item.mfgDate}
                      onChange={e => {
                        const updated = [...grnItems];
                        updated[idx].mfgDate = e.target.value;
                        setGrnItems(updated);
                      }}
                      className="w-full p-1.5 border border-divider rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-ink-secondary block mb-0.5">Expiry Date *</label>
                    <input
                      type="date"
                      required
                      value={item.expDate}
                      onChange={e => {
                        const updated = [...grnItems];
                        updated[idx].expDate = e.target.value;
                        setGrnItems(updated);
                      }}
                      className="w-full p-1.5 border border-divider rounded text-xs"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-divider flex justify-end gap-2">
            <Button variant="secondary" size="sm" type="button" onClick={() => setIsGrnModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Post GRN & Inward Stock
            </Button>
          </div>
        </form>
      </Modal>

      {/* PO Creation Modal */}
      <Modal
        isOpen={isPoModalOpen}
        onClose={() => setIsPoModalOpen(false)}
        title="Create Purchase Order"
        subtitle="Issue purchase order to Aachi Spices & Foods depot"
      >
        <form onSubmit={handleCreatePo} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-ink-primary mb-1">Supplier Depot *</label>
            <select
              value={poSupplierId}
              onChange={e => setPoSupplierId(e.target.value)}
              className="w-full p-2 border border-divider rounded bg-white"
            >
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.city})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-ink-primary mb-1">Product & Quantity</label>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={poItems[0].productId}
                onChange={e => {
                  const pid = e.target.value;
                  const p = products.find(prod => prod.id === pid);
                  setPoItems([{ ...poItems[0], productId: pid, unitRate: p?.purchaseRate || 35 }]);
                }}
                className="p-2 border border-divider rounded bg-white text-xs"
              >
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.packSize})</option>
                ))}
              </select>
              <input
                type="number"
                min="10"
                value={poItems[0].quantity}
                onChange={e => setPoItems([{ ...poItems[0], quantity: Number(e.target.value) }])}
                className="p-2 border border-divider rounded text-xs"
                placeholder="Quantity"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-divider flex justify-end gap-2">
            <Button variant="secondary" size="sm" type="button" onClick={() => setIsPoModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Issue Purchase Order
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
