import { createAction, props } from '@ngrx/store';

export interface ProductData {
  id: number;
  region: string;
  internalCategory: string;
  product: string;
  subProduct: string;
  pid: string;
  current: number;
  prev: number;
  variance: number;
  threshold: number;
  commentary?: string;
}

export interface QueryParams {
  region?: string[];
  segment?: string[];
  prevDate?: string;
  currDate?: string;
}

// Load products
export const loadProducts = createAction(
  '[Product] Load Products',
  props<{ productType: string; params: QueryParams }>()
);
export const loadProductsSuccess = createAction(
  '[Product] Load Products Success',
  props<{ products: ProductData[] }>()
);
export const loadProductsFailure = createAction(
  '[Product] Load Products Failure',
  props<{ error: any }>()
);

// Adjust product data
export const adjustProduct = createAction(
  '[Product] Adjust Product',
  props<{ id: number; field: string; value: any; reason: string }>()
);
export const adjustProductSuccess = createAction(
  '[Product] Adjust Product Success',
  props<{ id: number; field: string; value: any }>()
);
export const adjustProductFailure = createAction(
  '[Product] Adjust Product Failure',
  props<{ error: any }>()
);

// Add product commentary
export const addProductCommentary = createAction(
  '[Product] Add Commentary',
  props<{ productId: number; commentary: string }>()
);
export const addProductCommentarySuccess = createAction(
  '[Product] Add Commentary Success',
  props<{ productId: number; commentary: string }>()
);
export const addProductCommentaryFailure = createAction(
  '[Product] Add Commentary Failure',
  props<{ error: any }>()
);

// Export products
export const exportProducts = createAction(
  '[Product] Export Products',
  props<{ format: 'excel' | 'csv' }>()
);
export const exportProductsSuccess = createAction(
  '[Product] Export Products Success'
);
export const exportProductsFailure = createAction(
  '[Product] Export Products Failure',
  props<{ error: any }>()
);

// Clear product data
export const clearProducts = createAction('[Product] Clear Products');
