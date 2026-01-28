import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { mockDataService } from '@services/mockDataService'

export interface ProductData {
  id: number
  region: string
  internalCategory: string
  product: string
  subProduct: string
  pid: string
  current: number
  prev: number
  variance: number
  threshold: number
  commentary?: string
}

export interface QueryParams {
  region?: string[]
  segment?: string[]
  prevDate?: string
  currDate?: string
}

interface ProductState {
  products: ProductData[]
  loading: boolean
  error: any
  currentProductType: string | null
  lastQueryParams: QueryParams | null
}

const initialState: ProductState = {
  products: [],
  loading: false,
  error: null,
  currentProductType: null,
  lastQueryParams: null,
}

// Async thunks
export const loadProductsAsync = createAsyncThunk(
  'product/loadProducts',
  async ({ productType, params }: { productType: string; params?: QueryParams }, { rejectWithValue }) => {
    try {
      const products = await mockDataService.getProductData(productType, params)
      return { products: products || [] }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to load products')
    }
  }
)

export const adjustProductAsync = createAsyncThunk(
  'product/adjustProduct',
  async ({ id, field, value, reason }: { id: number; field: string; value: any; reason: string }, { rejectWithValue }) => {
    try {
      await mockDataService.adjustProductData(id, field, value, reason)
      return { id, field, value }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to adjust product')
    }
  }
)

export const addProductCommentaryAsync = createAsyncThunk(
  'product/addCommentary',
  async ({ productId, commentary }: { productId: number; commentary: string }, { rejectWithValue }) => {
    try {
      await mockDataService.addProductCommentary(productId, commentary)
      return { productId, commentary }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to add commentary')
    }
  }
)

const productSlice = createSlice({
  name: 'product',
  initialState,
  reducers: {
    clearProducts: (state) => {
      state.products = []
      state.currentProductType = null
      state.lastQueryParams = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Load products
      .addCase(loadProductsAsync.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(loadProductsAsync.fulfilled, (state, action) => {
        state.loading = false
        state.products = action.payload.products
        state.error = null
      })
      .addCase(loadProductsAsync.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Adjust product
      .addCase(adjustProductAsync.fulfilled, (state, action) => {
        const { id, field, value } = action.payload
        state.products = state.products.map((p) =>
          p.id === id ? { ...p, [field]: value } : p
        )
      })
      // Add commentary
      .addCase(addProductCommentaryAsync.fulfilled, (state, action) => {
        const { productId, commentary } = action.payload
        state.products = state.products.map((p) =>
          p.id === productId ? { ...p, commentary } : p
        )
      })
  },
})

export const { clearProducts } = productSlice.actions
export default productSlice.reducer
