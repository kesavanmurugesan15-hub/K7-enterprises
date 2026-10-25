import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useBusiness } from '../../context/BusinessContext';
import { dataService } from '../../services/dataService';
import type { Product, ProductCategory } from '../../types/product';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { formatINR } from '../../utils/currency';
import { ShoppingCart, Plus, Minus, Search, Check, Image as ImageIcon } from 'lucide-react';

interface RetailerCatalogProps {
  onGoToCart: () => void;
}

export const RetailerCatalog: React.FC<RetailerCatalogProps> = ({ onGoToCart }) => {
  const { currentUser, isRetailer } = useAuth();
  const { cart, addToCart, cartCount, cartGrandTotal } = useBusiness();
  const [products, setProducts] = useState<Product[]>(dataService.getProducts());
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [quantities, setQuantities] = useState<Record<string, number>>({});

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

  const handleQtyChange = (productId: string, delta: number, maxStock: number) => {
    const current = quantities[productId] || 1;
    const next = Math.max(1, Math.min(maxStock, current + delta));
    setQuantities({ ...quantities, [productId]: next });
  };

  const handleAdd = (product: Product) => {
    const qty = quantities[product.id] || 1;
    addToCart(product, qty);
    // Reset quantity
    setQuantities({ ...quantities, [product.id]: 1 });
  };

  const filteredProducts = products.filter(p => {
    if (!p.isActive || p.isArchived) return false;
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.tamilName && p.tamilName.includes(searchQuery)) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-surface p-4 rounded-lg border border-divider shadow-enterprise flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-ink-primary">Aachi Masala Wholesale Ordering Portal</h2>
          <p className="text-xs text-ink-secondary mt-0.5">
            Order authentic Aachi spices, blended masalas and ready pastes at official distributor wholesale rates.
          </p>
        </div>

        {cartCount > 0 && (
          <Button
            variant="primary"
            size="md"
            icon={ShoppingCart}
            onClick={onGoToCart}
            className="animate-in fade-in"
          >
            Review Cart ({cartCount} items • {formatINR(cartGrandTotal)})
          </Button>
        )}
      </div>

      {/* Category Pills and Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-divider pb-3">
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

        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 text-ink-muted absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search Aachi masala, தமிழ்..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-1.5 bg-surface border border-divider rounded-md focus:outline-none focus:border-brand"
          />
        </div>
      </div>

      {/* Product Cards Grid */}
      {filteredProducts.length === 0 ? (
        <div className="p-12 bg-surface rounded-lg border border-divider text-center shadow-enterprise">
          <ImageIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-ink-primary">No Products Available</h3>
          <p className="text-xs text-ink-secondary mt-1">
            {searchQuery
              ? `No Aachi masala products matched "${searchQuery}". Try a different keyword.`
              : 'No products listed in this category.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredProducts.map(prod => {
          const qty = quantities[prod.id] || 1;
          const isOutOfStock = prod.availableStock <= 0;
          const cartItem = cart.find(c => c.product.id === prod.id);

          return (
            <div
              key={prod.id}
              className="bg-surface border border-divider rounded-lg overflow-hidden shadow-enterprise flex flex-col justify-between hover:border-brand-border transition-all"
            >
              <div>
                {/* Product Image */}
                <div className="relative h-44 bg-slate-50 border-b border-divider flex items-center justify-center overflow-hidden">
                  {prod.imageUrl ? (
                    <img
                      src={prod.imageUrl}
                      alt={prod.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-ink-muted">
                      <ImageIcon className="w-8 h-8 text-slate-300" />
                      <span className="text-[10px] mt-1 text-slate-400">Aachi Masala</span>
                    </div>
                  )}

                  {/* Pack Size badge */}
                  <div className="absolute top-2 left-2">
                    <span className="px-2 py-0.5 rounded bg-black/70 text-white text-[11px] font-bold backdrop-blur-[2px]">
                      {prod.packSize}
                    </span>
                  </div>

                  {/* Stock status pill */}
                  <div className="absolute top-2 right-2">
                    {isOutOfStock ? (
                      <span className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-bold">
                        Out of Stock
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-emerald-700 text-white text-[10px] font-bold">
                        {prod.availableStock} in Stock
                      </span>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="p-4 space-y-2">
                  <div>
                    <span className="text-[10px] font-semibold text-brand uppercase tracking-wider">
                      {prod.category}
                    </span>
                    <h3 className="text-sm font-bold text-ink-primary leading-tight mt-0.5">{prod.name}</h3>
                    {prod.tamilName && (
                      <p className="text-xs text-ink-muted mt-0.5">{prod.tamilName}</p>
                    )}
                    {prod.description && (
                      <p className="text-[11px] text-ink-secondary mt-1 line-clamp-2 leading-relaxed">
                        {prod.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-divider/60 flex items-baseline justify-between">
                    <div>
                      <p className="text-[10px] text-ink-secondary">Wholesale Rate</p>
                      <p className="text-lg font-black text-brand text-num">
                        {formatINR(prod.sellingPriceWholesale)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-ink-secondary">MRP</p>
                      <p className="text-xs font-semibold text-ink-muted line-through text-num">
                        {formatINR(prod.mrp)}
                      </p>
                    </div>
                  </div>

                  <div className="text-[11px] text-ink-secondary flex items-center justify-between">
                    <span>GST: {prod.gstPercent}% (HSN {prod.hsnCode})</span>
                    <span>Outer: {prod.caseSize} / Case</span>
                  </div>
                </div>
              </div>

              {/* Order Quantity & Add to Cart Action */}
              <div className="p-4 pt-0">
                {isOutOfStock ? (
                  <Button variant="secondary" size="sm" className="w-full opacity-60" disabled>
                    Temporarily Unavailable
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between bg-slate-50 border border-divider rounded p-1">
                      <span className="text-xs text-ink-secondary pl-2 font-medium">Quantity:</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleQtyChange(prod.id, -10, prod.availableStock)}
                          className="w-6 h-6 rounded bg-white border border-divider flex items-center justify-center text-xs font-bold hover:bg-slate-100"
                        >
                          -10
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQtyChange(prod.id, -1, prod.availableStock)}
                          className="w-6 h-6 rounded bg-white border border-divider flex items-center justify-center text-xs font-bold hover:bg-slate-100"
                        >
                          -
                        </button>
                        <span className="w-10 text-center font-bold text-xs text-num">{qty}</span>
                        <button
                          type="button"
                          onClick={() => handleQtyChange(prod.id, 1, prod.availableStock)}
                          className="w-6 h-6 rounded bg-white border border-divider flex items-center justify-center text-xs font-bold hover:bg-slate-100"
                        >
                          +
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQtyChange(prod.id, 10, prod.availableStock)}
                          className="w-6 h-6 rounded bg-white border border-divider flex items-center justify-center text-xs font-bold hover:bg-slate-100"
                        >
                          +10
                        </button>
                      </div>
                    </div>

                    <Button
                      variant={cartItem ? 'outline' : 'primary'}
                      size="sm"
                      icon={cartItem ? Check : ShoppingCart}
                      onClick={() => handleAdd(prod)}
                      className="w-full"
                    >
                      {cartItem ? `In Cart (${cartItem.quantity}) • Add ${qty} More` : `Add ${qty} Pkts to Cart`}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
};
