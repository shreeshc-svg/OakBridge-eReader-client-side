import { create } from 'zustand';
import { cart_api, type CartItem } from '../features/cart/api/cart.api';

interface CartState {
     items: CartItem[];
     savedItems: CartItem[];
     cartCount: number;
     isLoading: boolean;
     cartBookIds: Set<string>;

     fetchCart: () => Promise<void>;
     addToCart: (bookId: string) => Promise<void>;
     removeFromCart: (bookId: string) => Promise<void>;
     clearCart: () => Promise<void>;
     moveToSaved: (bookId: string) => Promise<void>;
     moveToActive: (bookId: string) => Promise<void>;
     fetchCartCount: () => Promise<void>;
     resetCart: () => void;
}

export const useCartStore = create<CartState>()((set, get) => ({
     items: [],
     savedItems: [],
     cartCount: 0,
     isLoading: false,
     cartBookIds: new Set<string>(),

     fetchCart: async () => {
          try {
               set({ isLoading: true });
               const data = await cart_api.getCart();
               const bookIds = new Set(data.active.map((item) => item.book_id));
               set({
                    items: data.active,
                    savedItems: data.saved,
                    cartCount: data.active.length,
                    cartBookIds: bookIds,
                    isLoading: false,
               });
          } catch {
               set({ isLoading: false });
          }
     },

     addToCart: async (bookId: string) => {
          try {
               await cart_api.addToCart(bookId);
               await get().fetchCart();
          } catch (error) {
               throw error;
          }
     },

     removeFromCart: async (bookId: string) => {
          try {
               await cart_api.removeFromCart(bookId);
               await get().fetchCart();
          } catch (error) {
               throw error;
          }
     },

     clearCart: async () => {
          try {
               await cart_api.clearCart();
               set({
                    items: [],
                    cartCount: 0,
                    cartBookIds: new Set<string>(),
               });
          } catch (error) {
               throw error;
          }
     },

     moveToSaved: async (bookId: string) => {
          try {
               await cart_api.moveToSaved(bookId);
               await get().fetchCart();
          } catch (error) {
               throw error;
          }
     },

     moveToActive: async (bookId: string) => {
          try {
               await cart_api.moveToCart(bookId);
               await get().fetchCart();
          } catch (error) {
               throw error;
          }
     },

     fetchCartCount: async () => {
          try {
               const count = await cart_api.getCartCount();
               set({ cartCount: count });
          } catch {
               // Silently fail - cart count is not critical
          }
     },

     resetCart: () => {
          set({
               items: [],
               savedItems: [],
               cartCount: 0,
               cartBookIds: new Set<string>(),
               isLoading: false,
          });
     },
}));
