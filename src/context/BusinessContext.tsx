import React, { createContext, useContext, useState, useEffect } from 'react';
import type { BusinessSettings } from '../types/auth';
import type { AppNotification } from '../types/notification';
import { dataService } from '../services/dataService';
import type { Product } from '../types/product';

export interface CartItem {
  product: Product;
  quantity: number;
}

interface BusinessContextType {
  settings: BusinessSettings;
  updateSettings: (newSettings: Partial<BusinessSettings>) => void;
  notifications: AppNotification[];
  unreadNotificationCount: number;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  // Shopping Cart for Panel C
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  cartCount: number;
  cartSubtotal: number;
  cartGstTotal: number;
  cartGrandTotal: number;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export const BusinessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<BusinessSettings>(dataService.getSettings());
  const [notifications, setNotifications] = useState<AppNotification[]>(dataService.getNotifications());
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    const unsubSettings = dataService.subscribe('k7_settings', () => {
      setSettings(dataService.getSettings());
    });
    const unsubNotes = dataService.subscribe('k7_notifications', () => {
      setNotifications(dataService.getNotifications());
    });
    return () => {
      unsubSettings();
      unsubNotes();
    };
  }, []);

  const updateSettings = (newSettings: Partial<BusinessSettings>) => {
    const users = dataService.getUsers();
    const admin = users.find(u => u.role === 'admin') || users[0];
    const updated = dataService.updateSettings(newSettings, admin);
    setSettings(updated);
  };

  const markNotificationRead = (id: string) => {
    dataService.markNotificationRead(id);
  };

  const markAllNotificationsRead = () => {
    dataService.markAllNotificationsRead();
  };

  // Cart operations
  const addToCart = (product: Product, quantity = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        const newQty = existing.quantity + quantity;
        if (newQty > product.availableStock) {
          alert(`Cannot add more than available stock (${product.availableStock} units).`);
          return prev;
        }
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: newQty } : item);
      } else {
        if (quantity > product.availableStock) {
          alert(`Requested quantity exceeds available stock (${product.availableStock} units).`);
          return prev;
        }
        return [...prev, { product, quantity }];
      }
    });
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        if (quantity > item.product.availableStock) {
          alert(`Maximum available stock is ${item.product.availableStock} units.`);
          return item;
        }
        return { ...item, quantity };
      }
      return item;
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Default to wholesale pricing for cart calculations
  const cartSubtotal = cart.reduce((sum, item) => sum + (item.product.sellingPriceWholesale * item.quantity), 0);
  const cartGstTotal = cart.reduce((sum, item) => {
    const lineTotal = item.product.sellingPriceWholesale * item.quantity;
    return sum + (lineTotal * item.product.gstPercent / 100);
  }, 0);
  const cartGrandTotal = Math.round((cartSubtotal + cartGstTotal) * 100) / 100;

  const unreadNotificationCount = notifications.filter(n => !n.isRead).length;

  return (
    <BusinessContext.Provider
      value={{
        settings,
        updateSettings,
        notifications,
        unreadNotificationCount,
        markNotificationRead,
        markAllNotificationsRead,
        cart,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        cartCount,
        cartSubtotal,
        cartGstTotal,
        cartGrandTotal
      }}
    >
      {children}
    </BusinessContext.Provider>
  );
};

export const useBusiness = () => {
  const context = useContext(BusinessContext);
  if (!context) {
    throw new Error('useBusiness must be used within a BusinessProvider');
  }
  return context;
};
