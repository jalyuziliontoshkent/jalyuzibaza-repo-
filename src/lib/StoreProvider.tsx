'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  getBlocks, getProducts, getSales,
  postBlock, putBlock, deleteBlock,
  postProduct, putProduct, deleteProduct,
  recordSale as apiRecordSale,
  clearSales as apiClearSales,
} from './api';

export interface UIBlock {
  _id: string;
  name: string;
  description: string;
  priority: string;
  color: string;
}

export interface UIProduct {
  _id: string;
  name: string;
  code: string;
  quantity: number;
  unit: string;
  block: string;
  location_note: string;
}

export interface UISale {
  _id: string;
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  sellerName: string;
  date: string;
}

interface Toast {
  title: string;
  message: string;
  type: 'success' | 'error' | 'info' | null;
}

interface State {
  loading: boolean;
  blocks: UIBlock[];
  products: UIProduct[];
  sales: UISale[];
  selectedBlock: string;
  query: string;
  role: 'admin' | 'seller';
  user: { name: string };
  toast: Toast;
}

interface StoreContextType {
  state: State;
  setQuery: (query: string) => void;
  setSelectedBlock: (block: string) => void;
  setRole: (role: 'admin' | 'seller') => void;
  showToast: (title: string, message: string, type?: 'success' | 'error' | 'info') => void;
  refresh: () => Promise<void>;
  // Block actions
  addBlock: (payload: { name: string; description: string; priority: string; color: string }) => Promise<void>;
  editBlock: (id: string, payload: { name?: string; description?: string; priority?: string; color?: string }) => Promise<void>;
  removeBlock: (id: string) => Promise<void>;
  // Product actions
  addProduct: (payload: { name: string; code: string; quantity: number; unit: string; block: string; location_note: string }) => Promise<void>;
  editProduct: (id: string, payload: { name?: string; code?: string; quantity?: number; unit?: string; block?: string; location_note?: string }) => Promise<void>;
  removeProduct: (id: string) => Promise<void>;
  // Sale actions
  recordSale: (productId: string, quantity: number, sellerName: string) => Promise<void>;
  clearSales: () => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<State>({
    loading: true,
    blocks: [],
    products: [],
    sales: [],
    selectedBlock: 'ALL',
    query: '',
    role: 'admin',
    user: { name: 'Admin' },
    toast: { title: '', message: '', type: null },
  });

  const showToast = (title: string, message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setState(prev => ({ ...prev, toast: { title, message, type } }));
    setTimeout(() => setState(prev => ({ ...prev, toast: { title: '', message: '', type: null } })), 3500);
  };

  const refresh = async () => {
    setState(prev => ({ ...prev, loading: true }));
    try {
      const [blocks, products, sales] = await Promise.all([getBlocks(), getProducts(), getSales()]);
      setState(prev => ({ ...prev, blocks, products, sales, loading: false }));
    } catch (e: any) {
      showToast('Xatolik', e.message || 'Yuklashda xatolik', 'error');
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  // ── Block actions ──────────────────────────────────────────────
  const addBlock = async (payload: { name: string; description: string; priority: string; color: string }) => {
    setState(prev => ({ ...prev, loading: true }));
    try {
      await postBlock(payload);
      await refresh();
      showToast('Muvaffaqiyatli', `"${payload.name}" bloki qo'shildi`, 'success');
    } catch (e: any) {
      setState(prev => ({ ...prev, loading: false }));
      showToast('Xatolik', e.message || 'Blok qo\'shishda xatolik', 'error');
      throw e;
    }
  };

  const editBlock = async (id: string, payload: { name?: string; description?: string; priority?: string; color?: string }) => {
    setState(prev => ({ ...prev, loading: true }));
    try {
      await putBlock(id, payload);
      await refresh();
      showToast('Yangilandi', 'Blok muvaffaqiyatli yangilandi', 'success');
    } catch (e: any) {
      setState(prev => ({ ...prev, loading: false }));
      showToast('Xatolik', e.message || 'Tahrirlashda xatolik', 'error');
      throw e;
    }
  };

  const removeBlock = async (id: string) => {
    setState(prev => ({ ...prev, loading: true }));
    try {
      await deleteBlock(id);
      await refresh();
      showToast('O\'chirildi', 'Blok va uning mahsulotlari o\'chirildi', 'success');
    } catch (e: any) {
      setState(prev => ({ ...prev, loading: false }));
      showToast('Xatolik', e.message || 'O\'chirishda xatolik', 'error');
    }
  };

  // ── Product actions ────────────────────────────────────────────
  const addProduct = async (payload: { name: string; code: string; quantity: number; unit: string; block: string; location_note: string }) => {
    setState(prev => ({ ...prev, loading: true }));
    try {
      await postProduct(payload);
      await refresh();
      showToast('Muvaffaqiyatli', `"${payload.name}" mahsuloti qo'shildi`, 'success');
    } catch (e: any) {
      setState(prev => ({ ...prev, loading: false }));
      showToast('Xatolik', e.message || 'Mahsulot qo\'shishda xatolik', 'error');
      throw e;
    }
  };

  const editProduct = async (id: string, payload: { name?: string; code?: string; quantity?: number; unit?: string; block?: string; location_note?: string }) => {
    setState(prev => ({ ...prev, loading: true }));
    try {
      await putProduct(id, payload);
      await refresh();
      showToast('Yangilandi', 'Mahsulot muvaffaqiyatli yangilandi', 'success');
    } catch (e: any) {
      setState(prev => ({ ...prev, loading: false }));
      showToast('Xatolik', e.message || 'Tahrirlashda xatolik', 'error');
      throw e;
    }
  };

  const removeProduct = async (id: string) => {
    setState(prev => ({ ...prev, loading: true }));
    try {
      await deleteProduct(id);
      await refresh();
      showToast('O\'chirildi', 'Mahsulot o\'chirildi', 'success');
    } catch (e: any) {
      setState(prev => ({ ...prev, loading: false }));
      showToast('Xatolik', e.message || 'O\'chirishda xatolik', 'error');
    }
  };

  // ── Sale actions ───────────────────────────────────────────────
  const recordSale = async (productId: string, quantity: number, sellerName: string) => {
    setState(prev => ({ ...prev, loading: true }));
    try {
      await apiRecordSale(productId, quantity, sellerName);
      await refresh();
      showToast('Sotuv amalga oshdi', `${quantity} dona sotildi`, 'success');
    } catch (e: any) {
      setState(prev => ({ ...prev, loading: false }));
      showToast('Xatolik', e.message || 'Sotishda xatolik', 'error');
      throw e;
    }
  };

  const clearSales = async () => {
    setState(prev => ({ ...prev, loading: true }));
    try {
      await apiClearSales();
      await refresh();
      showToast('Tozalandi', 'Barcha sotuvlar o\'chirildi', 'success');
    } catch (e: any) {
      setState(prev => ({ ...prev, loading: false }));
      showToast('Xatolik', e.message || 'Tozalashda xatolik', 'error');
    }
  };

  useEffect(() => { refresh(); }, []);

  return (
    <StoreContext.Provider value={{
      state,
      setQuery: (query) => setState(prev => ({ ...prev, query })),
      setSelectedBlock: (selectedBlock) => setState(prev => ({ ...prev, selectedBlock })),
      setRole: (role) => setState(prev => ({ ...prev, role })),
      showToast, refresh,
      addBlock, editBlock, removeBlock,
      addProduct, editProduct, removeProduct,
      recordSale, clearSales,
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within StoreProvider');
  return context;
};
