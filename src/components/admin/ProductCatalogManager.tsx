import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { dataService } from '../../services/dataService';
import type { Product, ProductCategory, ProductBatch } from '../../types/product';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { formatINR } from '../../utils/currency';
import { Plus, Upload, Image as ImageIcon, Search, Tag, AlertCircle, Trash2, Edit2, CheckCircle2, Archive } from 'lucide-react';

export const ProductCatalogManager: React.FC = () => {
  const { currentUser } = useAuth();
  const [products, setProducts] = useState<Product[]>(dataService.getProducts());
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);

  // Image upload state
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadError, setUploadError] = useState<string>('');

  useEffect(() => {
    return dataService.subscribe('k7_products', () => {
      setProducts(dataService.getProducts());
    });
  }, []);

  const categories: ('All' | ProductCategory)[] = [
    'All',
    'Pure Spices',
    'Blended Masalas',
    'Paste & Ready Mixes',
    'Pickles & Condiments',
    'Snacks & Flours',
    'Beverages & Syrups'
  ];

  const handleOpenAddModal = () => {
    setEditingProduct({
      name: '',
      tamilName: '',
      sku: '',
      barcode: '',
      category: 'Blended Masalas',
      brand: 'Aachi Masala',
      packSize: '100g',
      unitOfMeasure: 'PKT',
      caseSize: 50,
      purchaseRate: 35.00,
      mrp: 50.00,
      sellingPriceWholesale: 42.00,
      sellingPriceRetail: 46.00,
      gstPercent: 5,
      hsnCode: '2103',
      reorderLevel: 40,
      stockOnHand: 100,
      stockReserved: 0,
      availableStock: 100,
      description: '',
      isActive: true,
      isArchived: false,
      batches: []
    });
    setImagePreview('');
    setUploadError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (prod: Product) => {
    setEditingProduct(prod);
    setImagePreview(prod.imageUrl || '');
    setUploadError('');
    setIsModalOpen(true);
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError('');
    // 1. Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Invalid image type. Please select a JPG, PNG, or WebP image.');
      return;
    }

    // 2. Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image size exceeds 5MB limit. Please upload a smaller compressed image.');
      return;
    }

    // Simulate upload progress
    setUploadProgress(20);
    const reader = new FileReader();
    reader.onload = () => {
      setTimeout(() => setUploadProgress(60), 100);
      setTimeout(() => {
        setUploadProgress(100);
        setImagePreview(reader.result as string);
        setEditingProduct(prev => prev ? { ...prev, imageUrl: reader.result as string } : null);
      }, 250);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImagePreview('');
    setEditingProduct(prev => prev ? { ...prev, imageUrl: '' } : null);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct?.name || !editingProduct?.sku) {
      alert('Product Name and SKU are mandatory.');
      return;
    }

    const available = Number(editingProduct.stockOnHand || 0) - Number(editingProduct.stockReserved || 0);

    const productToSave: Product = {
      id: editingProduct.id || `prod_${Date.now()}`,
      name: editingProduct.name,
      tamilName: editingProduct.tamilName || '',
      sku: editingProduct.sku,
      barcode: editingProduct.barcode || '',
      category: editingProduct.category as ProductCategory,
      brand: editingProduct.brand || 'Aachi Masala',
      packSize: editingProduct.packSize || '100g',
      unitOfMeasure: editingProduct.unitOfMeasure || 'PKT',
      caseSize: Number(editingProduct.caseSize || 50),
      purchaseRate: Number(editingProduct.purchaseRate || 0),
      mrp: Number(editingProduct.mrp || 0),
      sellingPriceWholesale: Number(editingProduct.sellingPriceWholesale || 0),
      sellingPriceRetail: Number(editingProduct.sellingPriceRetail || 0),
      gstPercent: Number(editingProduct.gstPercent || 5) as any,
      hsnCode: editingProduct.hsnCode || '2103',
      reorderLevel: Number(editingProduct.reorderLevel || 30),
      stockOnHand: Number(editingProduct.stockOnHand || 0),
      stockReserved: Number(editingProduct.stockReserved || 0),
      availableStock: Math.max(0, available),
      imageUrl: imagePreview || editingProduct.imageUrl || '',
      description: editingProduct.description || '',
      isActive: editingProduct.isActive ?? true,
      isArchived: editingProduct.isArchived ?? false,
      batches: editingProduct.batches || [],
      createdAt: editingProduct.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    dataService.saveProduct(productToSave, currentUser);
    setIsModalOpen(false);
  };

  const handleArchiveProduct = (prod: Product) => {
    if (confirm(`Are you sure you want to archive product "${prod.name}" (${prod.sku})? This deactivates it safely without corrupting historical orders or accounting records.`)) {
      const res = dataService.archiveProduct(prod.id, currentUser);
      if (!res.success) alert(res.message);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.tamilName && p.tamilName.includes(searchQuery)) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface p-4 rounded-lg border border-divider shadow-enterprise">
        <div>
          <h2 className="text-lg font-bold text-ink-primary">Product Catalogue & Price Management</h2>
          <p className="text-xs text-ink-secondary mt-0.5">
            Aachi Masala official product listings, wholesale/retail rates, GST/HSN, and live image assets.
          </p>
        </div>

        <Button variant="primary" size="sm" icon={Plus} onClick={handleOpenAddModal}>
          Add Aachi Product
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-divider pb-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          {categories.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-brand text-white shadow-sm'
                  : 'bg-surface text-ink-secondary hover:bg-slate-100 border border-divider'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 text-ink-muted absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search Aachi product, Tamil name, SKU..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-1.5 bg-surface border border-divider rounded-md focus:outline-none focus:border-brand"
          />
        </div>
      </div>

      {/* Product Table */}
      <div className="bg-surface border border-divider rounded-lg shadow-enterprise overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-divider text-ink-secondary uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Product Details</th>
                <th className="py-3 px-4">SKU / HSN</th>
                <th className="py-3 px-4">Pack Size</th>
                <th className="py-3 px-4 text-right">Purchase Rate</th>
                <th className="py-3 px-4 text-right">Wholesale Rate</th>
                <th className="py-3 px-4 text-right">MRP</th>
                <th className="py-3 px-4 text-right">GST %</th>
                <th className="py-3 px-4 text-right">Available Stock</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-divider/70 text-ink-primary">
              {filteredProducts.map(prod => (
                <tr key={prod.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      {prod.imageUrl ? (
                        <img
                          src={prod.imageUrl}
                          alt={prod.name}
                          className="w-10 h-10 object-cover rounded border border-divider shrink-0 bg-slate-50"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded border border-divider bg-slate-100 flex items-center justify-center text-ink-muted shrink-0">
                          <ImageIcon className="w-5 h-5 text-slate-400" />
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-ink-primary">{prod.name}</div>
                        {prod.tamilName && (
                          <div className="text-[11px] text-ink-muted">{prod.tamilName}</div>
                        )}
                        <span className="text-[10px] text-brand font-medium">{prod.category}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-mono font-medium">{prod.sku}</div>
                    <div className="text-[11px] text-ink-muted">HSN: {prod.hsnCode}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-medium bg-slate-100 px-2 py-0.5 rounded text-[11px] border border-slate-200">
                      {prod.packSize}
                    </span>
                    <div className="text-[10px] text-ink-muted mt-0.5">{prod.caseSize} / Case</div>
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-num">
                    {formatINR(prod.purchaseRate)}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-num text-brand">
                    {formatINR(prod.sellingPriceWholesale)}
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-num text-ink-secondary">
                    {formatINR(prod.mrp)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Badge variant={prod.gstPercent === 5 ? 'info' : 'brand'}>{prod.gstPercent}%</Badge>
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-num">
                    <span className={prod.availableStock <= prod.reorderLevel ? 'text-rose-600 font-extrabold' : 'text-emerald-700'}>
                      {prod.availableStock} {prod.unitOfMeasure}
                    </span>
                    {prod.stockReserved > 0 && (
                      <div className="text-[10px] text-amber-700 font-normal">
                        ({prod.stockReserved} reserved)
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2 ml-auto">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(prod)}
                        className="text-brand hover:underline font-semibold flex items-center gap-1"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                      {!prod.isArchived ? (
                        <button
                          type="button"
                          onClick={() => handleArchiveProduct(prod)}
                          className="p-1 hover:bg-slate-200 rounded text-ink-muted hover:text-rose-600 transition-colors"
                          title="Archive Product"
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <Badge variant="brand">Archived</Badge>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct?.id ? 'Edit Aachi Product' : 'Add New Product to Catalogue'}
        subtitle="Manage product metadata, image asset, tiered pricing, and tax configuration"
        maxWidth="2xl"
      >
        <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
          {/* Image Upload Box */}
          <div className="p-3 border border-divider rounded-lg bg-slate-50">
            <label className="block font-semibold text-ink-primary mb-2">Product Image Asset</label>
            <div className="flex items-center gap-4">
              {imagePreview ? (
                <div className="relative w-20 h-20 rounded-md overflow-hidden border border-divider bg-white shrink-0">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-1 right-1 bg-black/60 text-white rounded p-1 hover:bg-rose-600 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="w-20 h-20 rounded-md border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-ink-muted bg-white shrink-0">
                  <ImageIcon className="w-6 h-6 text-slate-400" />
                  <span className="text-[10px] mt-1">No Image</span>
                </div>
              )}

              <div className="flex-1 space-y-1.5">
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleImageFileChange}
                  className="text-xs file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand hover:file:bg-brand-100"
                />
                <p className="text-[11px] text-ink-secondary">
                  PNG, JPG or WebP up to 5MB. Stored securely and propagated instantly to ordering panels.
                </p>
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-brand h-full transition-all" style={{ width: `${uploadProgress}%` }} />
                  </div>
                )}
                {uploadError && <p className="text-rose-600 text-[11px] font-semibold">{uploadError}</p>}
              </div>
            </div>
          </div>

          {/* Product Names */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-ink-primary mb-1">Product Name (English) *</label>
              <input
                type="text"
                required
                value={editingProduct?.name || ''}
                onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })}
                className="w-full p-2 border border-divider rounded focus:border-brand focus:outline-none"
                placeholder="e.g. Aachi Chicken Masala"
              />
            </div>
            <div>
              <label className="block font-semibold text-ink-primary mb-1">Tamil Name (Optional)</label>
              <input
                type="text"
                value={editingProduct?.tamilName || ''}
                onChange={e => setEditingProduct({ ...editingProduct, tamilName: e.target.value })}
                className="w-full p-2 border border-divider rounded focus:border-brand focus:outline-none"
                placeholder="e.g. ஆச்சி சிக்கன் மசாலா"
              />
            </div>
          </div>

          {/* Description & Packaging Notes */}
          <div>
            <label className="block font-semibold text-ink-primary mb-1">Product Description & Packaging Notes</label>
            <textarea
              rows={2}
              value={editingProduct?.description || ''}
              onChange={e => setEditingProduct({ ...editingProduct, description: e.target.value })}
              className="w-full p-2 border border-divider rounded focus:border-brand focus:outline-none"
              placeholder="e.g. Pure authentic ground red chilli powder with rich red colour and pungency. Official 3-layer laminated pack."
            />
          </div>

          {/* SKU, Barcode, Category */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-ink-primary mb-1">SKU / Item Code *</label>
              <input
                type="text"
                required
                value={editingProduct?.sku || ''}
                onChange={e => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                className="w-full p-2 border border-divider rounded focus:border-brand focus:outline-none font-mono"
                placeholder="AACHI-CHK-100G"
              />
            </div>
            <div>
              <label className="block font-semibold text-ink-primary mb-1">Barcode (EAN-13)</label>
              <input
                type="text"
                value={editingProduct?.barcode || ''}
                onChange={e => setEditingProduct({ ...editingProduct, barcode: e.target.value })}
                className="w-full p-2 border border-divider rounded focus:border-brand focus:outline-none font-mono"
                placeholder="8901725201012"
              />
            </div>
            <div>
              <label className="block font-semibold text-ink-primary mb-1">Category *</label>
              <select
                value={editingProduct?.category || 'Blended Masalas'}
                onChange={e => setEditingProduct({ ...editingProduct, category: e.target.value as any })}
                className="w-full p-2 border border-divider rounded focus:border-brand focus:outline-none bg-white"
              >
                {categories.filter(c => c !== 'All').map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Pack Size, Unit, Case Size */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-ink-primary mb-1">Pack Size *</label>
              <input
                type="text"
                required
                value={editingProduct?.packSize || '100g'}
                onChange={e => setEditingProduct({ ...editingProduct, packSize: e.target.value })}
                className="w-full p-2 border border-divider rounded focus:border-brand focus:outline-none"
                placeholder="50g, 100g, 200g, 500g, 1kg"
              />
            </div>
            <div>
              <label className="block font-semibold text-ink-primary mb-1">UOM</label>
              <select
                value={editingProduct?.unitOfMeasure || 'PKT'}
                onChange={e => setEditingProduct({ ...editingProduct, unitOfMeasure: e.target.value as any })}
                className="w-full p-2 border border-divider rounded focus:border-brand focus:outline-none bg-white"
              >
                <option value="PKT">Packet (PKT)</option>
                <option value="BOX">Box (BOX)</option>
                <option value="PCS">Piece (PCS)</option>
                <option value="KG">Kilogram (KG)</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-ink-primary mb-1">Units per Outer Case</label>
              <input
                type="number"
                value={editingProduct?.caseSize || 50}
                onChange={e => setEditingProduct({ ...editingProduct, caseSize: Number(e.target.value) })}
                className="w-full p-2 border border-divider rounded focus:border-brand focus:outline-none"
              />
            </div>
          </div>

          {/* Pricing Structure */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-lg border border-divider">
            <div>
              <label className="block font-semibold text-ink-primary mb-1">Purchase Rate (₹)</label>
              <input
                type="number"
                step="0.01"
                required
                value={editingProduct?.purchaseRate || 0}
                onChange={e => setEditingProduct({ ...editingProduct, purchaseRate: Number(e.target.value) })}
                className="w-full p-2 border border-divider rounded focus:border-brand focus:outline-none bg-white font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-ink-primary mb-1">Wholesale Rate (₹) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={editingProduct?.sellingPriceWholesale || 0}
                onChange={e => setEditingProduct({ ...editingProduct, sellingPriceWholesale: Number(e.target.value) })}
                className="w-full p-2 border border-divider rounded focus:border-brand focus:outline-none bg-white font-mono font-bold text-brand"
              />
            </div>
            <div>
              <label className="block font-semibold text-ink-primary mb-1">Retail Rate (₹)</label>
              <input
                type="number"
                step="0.01"
                value={editingProduct?.sellingPriceRetail || 0}
                onChange={e => setEditingProduct({ ...editingProduct, sellingPriceRetail: Number(e.target.value) })}
                className="w-full p-2 border border-divider rounded focus:border-brand focus:outline-none bg-white font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-ink-primary mb-1">MRP (₹) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={editingProduct?.mrp || 0}
                onChange={e => setEditingProduct({ ...editingProduct, mrp: Number(e.target.value) })}
                className="w-full p-2 border border-divider rounded focus:border-brand focus:outline-none bg-white font-mono"
              />
            </div>
          </div>

          {/* GST, HSN & Stock Thresholds */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-ink-primary mb-1">GST Rate (%) *</label>
              <select
                value={editingProduct?.gstPercent || 5}
                onChange={e => setEditingProduct({ ...editingProduct, gstPercent: Number(e.target.value) as any })}
                className="w-full p-2 border border-divider rounded focus:border-brand focus:outline-none bg-white"
              >
                <option value={0}>0% (Exempt)</option>
                <option value={5}>5% (Spices & Blends)</option>
                <option value={12}>12% (Pickles & Pastes)</option>
                <option value={18}>18% (Standard FMCG)</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-ink-primary mb-1">HSN Code *</label>
              <input
                type="text"
                required
                value={editingProduct?.hsnCode || '2103'}
                onChange={e => setEditingProduct({ ...editingProduct, hsnCode: e.target.value })}
                className="w-full p-2 border border-divider rounded focus:border-brand focus:outline-none font-mono"
                placeholder="0910 or 2103"
              />
            </div>
            <div>
              <label className="block font-semibold text-ink-primary mb-1">Reorder Point Level</label>
              <input
                type="number"
                value={editingProduct?.reorderLevel || 30}
                onChange={e => setEditingProduct({ ...editingProduct, reorderLevel: Number(e.target.value) })}
                className="w-full p-2 border border-divider rounded focus:border-brand focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-divider flex justify-end gap-2">
            <Button variant="secondary" size="sm" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Save Product & Rates
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
