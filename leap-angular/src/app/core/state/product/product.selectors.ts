import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ProductState } from './product.reducer';

// Feature selector
export const selectProductState = createFeatureSelector<ProductState>('product');

// Basic selectors
export const selectAllProducts = createSelector(
  selectProductState,
  (state: ProductState) => state.products
);

export const selectProductsLoading = createSelector(
  selectProductState,
  (state: ProductState) => state.loading
);

export const selectProductsError = createSelector(
  selectProductState,
  (state: ProductState) => state.error
);

export const selectCurrentProductType = createSelector(
  selectProductState,
  (state: ProductState) => state.currentProductType
);

export const selectLastQueryParams = createSelector(
  selectProductState,
  (state: ProductState) => state.lastQueryParams
);

// Get product by ID
export const selectProductById = (id: number) =>
  createSelector(selectAllProducts, products =>
    products.find(p => p.id === id)
  );

// Get products with variance exceeding threshold
export const selectProductsExceedingThreshold = createSelector(
  selectAllProducts,
  products => products.filter(p => Math.abs(p.variance) > p.threshold)
);

// Get top N products by variance (absolute value)
export const selectTopProductsByVariance = (limit: number = 10) =>
  createSelector(selectAllProducts, products =>
    [...products]
      .sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance))
      .slice(0, limit)
  );

// Get products by region
export const selectProductsByRegion = (region: string) =>
  createSelector(selectAllProducts, products =>
    products.filter(p => p.region === region)
  );

// Get products with commentary
export const selectProductsWithCommentary = createSelector(
  selectAllProducts,
  products => products.filter(p => p.commentary && p.commentary.length > 0)
);

// Get variance statistics
export const selectVarianceStatistics = createSelector(
  selectAllProducts,
  products => {
    if (products.length === 0) {
      return {
        total: 0,
        exceedingThreshold: 0,
        avgVariance: 0,
        maxVariance: 0,
        minVariance: 0
      };
    }

    const variances = products.map(p => p.variance);
    const exceedingThreshold = products.filter(p => Math.abs(p.variance) > p.threshold).length;

    return {
      total: products.length,
      exceedingThreshold,
      avgVariance: variances.reduce((sum, v) => sum + v, 0) / products.length,
      maxVariance: Math.max(...variances),
      minVariance: Math.min(...variances)
    };
  }
);

// Group products by region
export const selectProductsGroupedByRegion = createSelector(
  selectAllProducts,
  products => {
    const grouped: { [key: string]: any[] } = {};
    products.forEach(product => {
      if (!grouped[product.region]) {
        grouped[product.region] = [];
      }
      grouped[product.region].push(product);
    });
    return grouped;
  }
);
