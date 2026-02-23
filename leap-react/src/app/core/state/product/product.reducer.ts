import { createReducer, on } from '@ngrx/store';
import * as ProductActions from './product.actions';
import { ProductData } from './product.actions';

export interface ProductState {
  products: ProductData[];
  loading: boolean;
  error: any;
  currentProductType: string | null;
  lastQueryParams: ProductActions.QueryParams | null;
}

export const initialState: ProductState = {
  products: [],
  loading: false,
  error: null,
  currentProductType: null,
  lastQueryParams: null
};

export const productReducer = createReducer(
  initialState,
  on(ProductActions.loadProducts, (state, { productType, params }) => ({
    ...state,
    loading: true,
    currentProductType: productType,
    lastQueryParams: params
  })),
  on(ProductActions.loadProductsSuccess, (state, { products }) => ({
    ...state,
    products,
    loading: false,
    error: null
  })),
  on(ProductActions.loadProductsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  on(ProductActions.adjustProductSuccess, (state, { id, field, value }) => ({
    ...state,
    products: state.products.map(p =>
      p.id === id ? { ...p, [field]: value } : p
    )
  })),
  on(ProductActions.addProductCommentarySuccess, (state, { productId, commentary }) => ({
    ...state,
    products: state.products.map(p =>
      p.id === productId ? { ...p, commentary } : p
    )
  })),
  on(ProductActions.clearProducts, () => initialState)
);
