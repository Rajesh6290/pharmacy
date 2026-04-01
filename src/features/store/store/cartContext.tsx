"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export interface CartBatch {
  batchNumber: string;
  expiryDate: string;
  sellingPrice: number;
  gst: number;
  quantity: number; // available stock
}

export interface CartMedicine {
  _id: string;
  name: string;
  genericName?: string;
  sku: string;
  unit: string;
  requiresPrescription: boolean;
  photo?: string;
}

export interface CartItem {
  medicine: CartMedicine;
  batch: CartBatch;
  qty: number;
  prescriptionUrl?: string; // required if medicine.requiresPrescription
}

interface CartContextValue {
  items: CartItem[];
  addItem: (medicine: CartMedicine, batch: CartBatch) => void;
  removeItem: (medicineId: string, batchNumber: string) => void;
  updateQty: (medicineId: string, batchNumber: string, delta: number) => void;
  setPrescription: (
    medicineId: string,
    batchNumber: string,
    url: string
  ) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  totalGst: number;
  grandTotal: number;
}

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "ph_cart";

function getStoredCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(getStoredCart);

  // Persist on every change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore storage errors
    }
  }, [items]);

  const addItem = useCallback((medicine: CartMedicine, batch: CartBatch) => {
    setItems((prev) => {
      const existing = prev.findIndex(
        (i) =>
          i.medicine._id === medicine._id &&
          i.batch.batchNumber === batch.batchNumber
      );
      if (existing >= 0) {
        const updated = [...prev];
        const item = { ...updated[existing] };
        if (item.qty < item.batch.quantity) item.qty += 1;
        updated[existing] = item;
        return updated;
      }
      return [...prev, { medicine, batch, qty: 1, prescriptionUrl: undefined }];
    });
  }, []);

  const removeItem = useCallback((medicineId: string, batchNumber: string) => {
    setItems((prev) =>
      prev.filter(
        (i) =>
          !(
            i.medicine._id === medicineId && i.batch.batchNumber === batchNumber
          )
      )
    );
  }, []);

  const updateQty = useCallback(
    (medicineId: string, batchNumber: string, delta: number) => {
      setItems(
        (prev) =>
          prev
            .map((i) => {
              if (
                i.medicine._id !== medicineId ||
                i.batch.batchNumber !== batchNumber
              )
                return i;
              const newQty = i.qty + delta;
              if (newQty < 1) return null;
              if (newQty > i.batch.quantity) return i;
              return { ...i, qty: newQty };
            })
            .filter(Boolean) as CartItem[]
      );
    },
    []
  );

  const setPrescription = useCallback(
    (medicineId: string, batchNumber: string, url: string) => {
      setItems((prev) =>
        prev.map((i) =>
          i.medicine._id === medicineId && i.batch.batchNumber === batchNumber
            ? { ...i, prescriptionUrl: url }
            : i
        )
      );
    },
    []
  );

  const clearCart = useCallback(() => {
    setItems([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  const totalItems = items.reduce((s, i) => s + i.qty, 0);
  const subtotal = items.reduce((s, i) => s + i.batch.sellingPrice * i.qty, 0);
  const totalGst = items.reduce(
    (s, i) => s + i.batch.sellingPrice * i.qty * (i.batch.gst / 100),
    0
  );
  const grandTotal = parseFloat((subtotal + totalGst).toFixed(2));

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQty,
        setPrescription,
        clearCart,
        totalItems,
        subtotal,
        totalGst,
        grandTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
