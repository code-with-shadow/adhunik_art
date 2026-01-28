import { createSlice } from "@reduxjs/toolkit";

// Load initial state from LocalStorage if available
const loadCartFromStorage = () => {
  const savedCart = localStorage.getItem("cart");
  return savedCart ? JSON.parse(savedCart) : [];
};

const initialState = {
  cartItems: loadCartFromStorage(), 
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    // Action: Add Item
    addToCart: (state, action) => {
      const painting = action.payload;
      
      // Check if item already exists to prevent duplicates
      const exists = state.cartItems.find((item) => item.$id === painting.$id);
      
      if (!exists) {
        state.cartItems.push(painting);
        // Save to local storage
        localStorage.setItem("cart", JSON.stringify(state.cartItems));
      }
    },

    // Action: Remove Item
    removeFromCart: (state, action) => {
      const paintingId = action.payload;
      state.cartItems = state.cartItems.filter((item) => item.$id !== paintingId);
      localStorage.setItem("cart", JSON.stringify(state.cartItems));
    },

    // Action: Clear Cart (After payment success)
    clearCart: (state) => {
      state.cartItems = [];
      localStorage.removeItem("cart");
    },
  },
});

export const { addToCart, removeFromCart, clearCart } = cartSlice.actions;

export default cartSlice.reducer;