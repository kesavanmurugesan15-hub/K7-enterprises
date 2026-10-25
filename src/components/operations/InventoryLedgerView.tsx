import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { dataService } from '../../services/dataService';
import { Product } from '../../types/product';
import { InventoryMovement } from '../../types/inventory';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { StatCard } from '../common/StatCard';
import { formatINR } from '../../utils/currency';
import { formatDateTime, formatDate, getTodayDateString } from '../../utils/date';
import { Package, AlertTriangle, Clock, History, Sliders, Search, ArrowDownRight, ArrowUpRight } from 'lucide-react';

export const InventoryLedgerView: React.FC = () => {
  const { currentUser } = useAuth();
  const [products, setProducts] = useState<Product[]>(dataService.getProducts());
  const [movements, setMovements] = useState<InventoryMovement[]>(dataService.getMovements());
  const [valuation, setValuation] = useState(dataService.getStockValuation());
  const [activeTab, setActiveTab] = useState<'stock' | 'movements' | 'batches'>('stock');
  const [searchQuery, setSearchQuery] = useState('');

  // Stock Adjustment Modal
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustProductId, setAdjustProductId] = useState(products[0]?.id || '');
  const [adjustType, setAdjustType] = useState<InventoryMovement['movementType']>('DAMAGE_ADJUSTMENT');
  const [adjustQty, setAdjustQty] = useState(5);
  const [adjustNotes, setAdjustNotes] = useState('');

  useEffect(() => {
    const unsub = dataService.subscribe('*', () => {
      setProducts(dataService.getProducts());
      setMovements(dataService.getMovements());
      setValuation(dataService.getStockValuation());
    });
    return () => unsub();
  }, []);

  const handlePostAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    const prod = products.find(p => p.id === adjustProductId);
    if (!prod) return;

    const qtyChange = adjustType === 'DAMAGE_ADJUSTMENT' || adjustType === 'EXPIRED_WRITE_OFF' ? -Math.abs(adjustQty) : Math.abs(adjustQty);
    const prev = prod.stockOnHand;
    const newStock = Math.max(0, prev + qtyChange);

    // Save movement
    dataService.recordMovement({
      productId: prod.id,
      productName: prod.name,
      sku: prod.sku,
      movementType: adjustType,
      quantityChange: qtyChange,
      previousStock: prev,
      newStock,
      unitCost: prod.purchaseRate,
      totalCost: Math.abs(qtyChange) * prod.purchaseRate,
      referenceType: 'MANUAL_ADJUSTMENT',
      referenceId: `adj_${Date.now()}`,
      referenceNumber: `ADJ-${Date.now().toString().slice(-4)}`,
      performedByUserId: currentUser.id,
      performedByUserName: currentUser.name,
      notes: adjustNotes || `${adjustType.replace(/_/g, ' ')} posted`,
      timestamp: new Date().toISOString()
    });

    // Update product physical stock
    const updatedProd = {
      ...prod,
      stockOnHand: newStock,
      availableStock: Math.max(0, newStock - prod.stockReserved)
    };
    dataService.saveProduct(updatedProd, currentUser);

    setIsAdjustModalOpen(false);
    setAdjustNotes('');
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredMovements = movements.filter(m =>
    m.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.performedByUserName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface p-4 rounded-lg border border-divider shadow-enterprise">
        <div>
          <h2 className="text-lg font-bold text-ink-primary">Auditable Stock Movement & FEFO Ledger</h2>
          <p className="text-xs text-ink-secondary mt-0.5">
            Real-time stock reservation, batch & expiry monitoring, and complete historical ledger tracking.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          icon={Sliders}
          onClick={() => setIsAdjustModalOpen(true)}
        >
          Post Stock Adjustment
        </Button>
      </div>

      {/* Valuation & Alerts Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Inventory Value"
          value={formatINR(valuation.totalInventoryValue)}
          subtitle="Valued at Purchase Rate"
          icon={Package}
          accentColor="brand"
        />
        <StatCard
          title="Total Stock on Hand"
          value={`${valuation.totalQuantity} Units`}
          subtitle={`${valuation.totalItems} Active SKUs`}
          icon={Package}
          accentColor="info"
        />
        <StatCard
          title="Low Stock Reorders"
          value={`${valuation.lowStockItemsCount} SKUs`}
          subtitle="Approaching minimum threshold"
          icon={AlertTriangle}
          accentColor="warning"
        />
        <StatCard
          title="FEFO Near-Expiry"
          value={`${valuation.nearExpiryItemsCount} Batches`}
          subtitle="Expiring within 90 days"
          icon={Clock}
          accentColor="warning"
        />
      </div>

      {/* Tabs and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-divider pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('stock')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'stock' ? 'bg-brand text-white shadow-sm' : 'bg-surface text-ink-secondary hover:bg-slate-100'
            }`}
          >
            Live Stock Availability ({products.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('movements')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'movements' ? 'bg-brand text-white shadow-sm' : 'bg-surface text-ink-secondary hover:bg-slate-100'
            }`}
          >
            Stock Movement Ledger ({movements.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('batches')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'batches' ? 'bg-brand text-white shadow-sm' : 'bg-surface text-ink-secondary hover:bg-slate-100'
            }`}
          >
            FEFO Batches & Expiry
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-ink-muted absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search SKU or ledger..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-1.5 bg-surface border border-divider rounded-md focus:outline-none focus:border-brand"
          />
        </div>
      </div>

      {/* Tab 1: Live Stock Availability */}
      {activeTab === 'stock' && (
        <div className="bg-surface border border-divider rounded-lg shadow-enterprise overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-divider text-ink-secondary uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">SKU / Pack</th>
                  <th className="py-3 px-4 text-right">Physical On-Hand</th>
                  <th className="py-3 px-4 text-right">Reserved (Active Orders)</th>
                  <th className="py-3 px-4 text-right">Available for Order</th>
                  <th className="py-3 px-4 text-right">Purchase Rate</th>
                  <th className="py-3 px-4 text-right">Total Valuation</th>
                  <th className="py-3 px-4">Stock Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-divider/70 text-ink-primary">
                {filteredProducts.map(prod => {
                  const isLow = prod.availableStock <= prod.reorderLevel;
                  const totalVal = prod.stockOnHand * prod.purchaseRate;
                  return (
                    <tr key={prod.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-ink-primary">{prod.name}</div>
                        {prod.tamilName && <div className="text-[11px] text-ink-muted">{prod.tamilName}</div>}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono">{prod.sku}</span>
                        <div className="text-[11px] text-ink-muted">{prod.packSize} • {prod.category}</div>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-num">
                        {prod.stockOnHand} {prod.unitOfMeasure}
                      </td>
                      <td className="py-3 px-4 text-right text-num text-amber-700 font-semibold">
                        {prod.stockReserved} {prod.unitOfMeasure}
                      </td>
                      <td className="py-3 px-4 text-right font-extrabold text-num text-emerald-700">
                        {prod.availableStock} {prod.unitOfMeasure}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-num">
                        {formatINR(prod.purchaseRate)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-num text-brand">
                        {formatINR(totalVal)}
                      </td>
                      <td className="py-3 px-4">
                        {isLow ? (
                          <Badge variant="warning">Reorder Level ({prod.reorderLevel})</Badge>
                        ) : (
                          <Badge variant="success">Normal Stock</Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Stock Movement Ledger */}
      {activeTab === 'movements' && (
        <div className="bg-surface border border-divider rounded-lg shadow-enterprise overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-50 border-b border-divider text-ink-secondary uppercase text-[10px] tracking-wider font-semibold font-sans">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Movement Type</th>
                  <th className="py-3 px-4 text-right">Qty Change</th>
                  <th className="py-3 px-4 text-right">Prev $\rightarrow$ New</th>
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4">Logged By</th>
                  <th className="py-3 px-4 font-sans">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-divider/70 text-ink-primary text-[11px]">
                {filteredMovements.map(m => {
                  const isPositive = m.quantityChange > 0;
                  return (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 text-ink-secondary whitespace-nowrap">
                        {formatDateTime(m.timestamp)}
                      </td>
                      <td className="py-3 px-4 font-sans">
                        <div className="font-semibold text-ink-primary">{m.productName}</div>
                        <div className="text-[10px] text-ink-muted">{m.sku}</div>
                      </td>
                      <td className="py-3 px-4 font-sans">
                        <span className="font-semibold text-ink-primary">{m.movementType.replace(/_/g, ' ')}</span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold">
                        <span className={`inline-flex items-center gap-0.5 ${isPositive ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                          {m.quantityChange > 0 ? `+${m.quantityChange}` : m.quantityChange}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-ink-secondary">
                        {m.previousStock} $\rightarrow$ <span className="font-bold text-ink-primary">{m.newStock}</span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-brand">
                        {m.referenceNumber}
                      </td>
                      <td className="py-3 px-4 font-sans text-ink-secondary">
                        {m.performedByUserName}
                      </td>
                      <td className="py-3 px-4 font-sans text-ink-secondary max-w-xs truncate">
                        {m.notes || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: FEFO Batches & Expiry */}
      {activeTab === 'batches' && (
        <div className="bg-surface border border-divider rounded-lg shadow-enterprise overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-divider text-ink-secondary uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">Batch Number</th>
                  <th className="py-3 px-4">Manufacturing Date</th>
                  <th className="py-3 px-4">Expiry Date (FEFO)</th>
                  <th className="py-3 px-4 text-right">Quantity Remaining</th>
                  <th className="py-3 px-4">Expiry Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-divider/70 text-ink-primary">
                {products.flatMap(p =>
                  (p.batches || []).map(b => {
                    const today = new Date();
                    const exp = new Date(b.expDate);
                    const daysLeft = Math.ceil((exp.getTime() - today.getTime()) / 86400000);
                    const isNear = daysLeft <= 90;
                    const isExpired = daysLeft <= 0;

                    return (
                      <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-ink-primary">{p.name}</div>
                          <div className="text-[11px] text-ink-muted">{p.packSize}</div>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-brand">{b.batchNumber}</td>
                        <td className="py-3 px-4">{formatDate(b.mfgDate)}</td>
                        <td className="py-3 px-4 font-semibold">{formatDate(b.expDate)}</td>
                        <td className="py-3 px-4 text-right font-bold text-num">
                          {b.quantity} pkts
                        </td>
                        <td className="py-3 px-4">
                          {isExpired ? (
                            <Badge variant="error">EXPIRED ({Math.abs(daysLeft)}d ago)</Badge>
                          ) : isNear ? (
                            <Badge variant="warning">FEFO Priority: {daysLeft} days left</Badge>
                          ) : (
                            <Badge variant="success">Fresh ({daysLeft} days left)</Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      <Modal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        title="Post Audited Stock Adjustment"
        subtitle="Record physical count difference, damaged cartons or write-offs"
      >
        <form onSubmit={handlePostAdjustment} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-ink-primary mb-1">Select Product *</label>
            <select
              value={adjustProductId}
              onChange={e => setAdjustProductId(e.target.value)}
              className="w-full p-2 border border-divider rounded bg-white text-xs"
            >
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.sku}) — Available: {p.availableStock}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-ink-primary mb-1">Adjustment Type *</label>
              <select
                value={adjustType}
                onChange={e => setAdjustType(e.target.value as any)}
                className="w-full p-2 border border-divider rounded bg-white text-xs"
              >
                <option value="DAMAGE_ADJUSTMENT">Damaged Stock Deduction (-)</option>
                <option value="EXPIRED_WRITE_OFF">Expired Stock Write-Off (-)</option>
                <option value="PHYSICAL_AUDIT_ADJUSTMENT">Physical Audit Discrepancy (+/-)</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-ink-primary mb-1">Quantity Units *</label>
              <input
                type="number"
                min="1"
                required
                value={adjustQty}
                onChange={e => setAdjustQty(Number(e.target.value))}
                className="w-full p-2 border border-divider rounded text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-ink-primary mb-1">Reason / Investigation Note *</label>
            <textarea
              required
              rows={3}
              value={adjustNotes}
              onChange={e => setAdjustNotes(e.target.value)}
              className="w-full p-2 border border-divider rounded text-xs"
              placeholder="e.g. 5 packets torn during unloading from C&F delivery truck"
            />
          </div>

          <div className="pt-3 border-t border-divider flex justify-end gap-2">
            <Button variant="secondary" size="sm" type="button" onClick={() => setIsAdjustModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Post Adjustment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
