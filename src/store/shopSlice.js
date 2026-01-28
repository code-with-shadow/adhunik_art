import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import service from '../backend/config';
import { Query } from 'appwrite';

// --- 1. EXISTING THUNK: Fetch specific categories (For Home Page) ---
export const fetchCategoryPaintings = createAsyncThunk(
  'shop/fetchCategoryPaintings',
  async ({ category, offset = 0 }, { rejectWithValue }) => {
    try {
        const queries = [
            Query.equal('category', category),
            Query.equal('isSold', false),
            Query.limit(6),
            Query.offset(offset),
            Query.orderDesc('$createdAt')
        ];
        const data = await service.getPaintings(queries);
        return { category, documents: data.documents, total: data.total };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// --- 2. NEW THUNK: Fetch with Filters & Sorting (For Shop Page) ---
export const fetchFilteredPaintings = createAsyncThunk(
  'shop/fetchFilteredPaintings',
  async ({ filters = {}, sort = 'newest', offset = 0, limit = 12 }, { rejectWithValue }) => {
    try {
      const queries = [];

      // A. Apply Filters
      if (filters.medium?.length > 0) {
        queries.push(Query.equal('medium', filters.medium));
      }
      
      // Map 'Subject' filter to 'category' database field
      if (filters.subject?.length > 0) {
        queries.push(Query.equal('category', filters.subject));
      }
      
      if (filters.style?.length > 0) {
        queries.push(Query.equal('style', filters.style));
      }
      
      if (filters.priceRange) {
        queries.push(Query.between('price', filters.priceRange[0], filters.priceRange[1]));
      }

      // Hide sold items
      queries.push(Query.equal('isSold', false));

      // B. Apply Sorting
      switch (sort) {
        case 'price-low-high':
          queries.push(Query.orderAsc('price'));
          break;
        case 'price-high-low':
          queries.push(Query.orderDesc('price'));
          break;
        case 'newest':
        default:
          queries.push(Query.orderDesc('$createdAt'));
          break;
      }

      // C. Pagination
      queries.push(Query.limit(limit));
      queries.push(Query.offset(offset));

      const response = await service.getPaintings(queries);
      return { documents: response.documents, total: response.total };

    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const shopSlice = createSlice({
  name: 'shop',
  initialState: {
    // We start with an empty object. Keys will be added dynamically.
    categories: {}, 
    // State for the main Shop Page
    shopPage: {
      items: [],
      total: 0,
      loading: false,
      error: null,
    },
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // --- DYNAMIC CATEGORY HANDLERS ---
      
      // 1. Pending: Create the category object if it doesn't exist
      .addCase(fetchCategoryPaintings.pending, (state, action) => {
        const { category } = action.meta.arg;
        if (!state.categories[category]) {
          state.categories[category] = { loading: true, items: [], total: 0, offset: 0, error: null };
        } else {
          state.categories[category].loading = true;
          state.categories[category].error = null;
        }
      })

      // 2. Fulfilled: Add data to the category
      .addCase(fetchCategoryPaintings.fulfilled, (state, action) => {
        const { category, documents, total } = action.payload;
        
        // Safety check (should exist from pending, but just in case)
        if (!state.categories[category]) {
          state.categories[category] = { loading: false, items: [], total: 0, offset: 0, error: null };
        }
        
        state.categories[category].loading = false;
        state.categories[category].total = total;

        // Prevent duplicates when appending
        const uniqueDocuments = documents.filter(
            (newDoc) => !state.categories[category].items.some((existingDoc) => existingDoc.$id === newDoc.$id)
        );

        state.categories[category].items = [...state.categories[category].items, ...uniqueDocuments];
        state.categories[category].offset += uniqueDocuments.length;
      })

      // 3. Rejected: Handle errors
      .addCase(fetchCategoryPaintings.rejected, (state, action) => {
        const { category } = action.meta.arg;
        if (!state.categories[category]) {
             state.categories[category] = { loading: false, items: [], total: 0, offset: 0, error: action.payload };
        } else {
             state.categories[category].loading = false;
             state.categories[category].error = action.payload;
        }
      })

      // --- SHOP PAGE HANDLERS (Unchanged) ---
      .addCase(fetchFilteredPaintings.pending, (state) => {
        state.shopPage.loading = true;
        state.shopPage.error = null;
      })
      .addCase(fetchFilteredPaintings.fulfilled, (state, action) => {
        state.shopPage.loading = false;
        state.shopPage.items = action.payload.documents;
        state.shopPage.total = action.payload.total;
      })
      .addCase(fetchFilteredPaintings.rejected, (state, action) => {
        state.shopPage.loading = false;
        state.shopPage.error = action.payload;
      });
  },
});

export default shopSlice.reducer;