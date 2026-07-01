"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CartItem } from "@/types";
import { cartItemKey } from "@/lib/utils";

const CART_STORAGE_KEY = "solid-matbaa-cart";

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  total: number;
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (key: string) => void;
  updateQuantity: (key: string, quantity: number) => void;
  clearCart: () => void;
  getItemKey: (item: CartItem) => string;
}

const CartContext = createContext<CartContextValue | null>(null);

function loadCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(loadCart());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveCart(items);
  }, [items, hydrated]);

  const getItemKey = useCallback(
    (item: CartItem) => cartItemKey(item.productId, item.tierQuantity),
    []
  );

  const addItem = useCallback(
    (newItem: Omit<CartItem, "quantity"> & { quantity?: number }) => {
      setItems((prev) => {
        const key = cartItemKey(newItem.productId, newItem.tierQuantity);
        const existing = prev.find(
          (i) => cartItemKey(i.productId, i.tierQuantity) === key
        );

        if (existing) {
          return prev.map((i) =>
            cartItemKey(i.productId, i.tierQuantity) === key
              ? { ...i, quantity: i.quantity + (newItem.quantity ?? 1) }
              : i
          );
        }

        return [...prev, { ...newItem, quantity: newItem.quantity ?? 1 }];
      });
    },
    []
  );

  const removeItem = useCallback((key: string) => {
    setItems((prev) =>
      prev.filter((i) => cartItemKey(i.productId, i.tierQuantity) !== key)
    );
  }, []);

  const updateQuantity = useCallback((key: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) =>
        prev.filter((i) => cartItemKey(i.productId, i.tierQuantity) !== key)
      );
      return;
    }
    setItems((prev) =>
      prev.map((i) =>
        cartItemKey(i.productId, i.tierQuantity) === key
          ? { ...i, quantity }
          : i
      )
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const itemCount = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items]
  );

  const total = useMemo(
    () => items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [items]
  );

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        total,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        getItemKey,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
