import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, catchError, switchMap, tap } from 'rxjs/operators';
import { MockDataService } from '@shared/services/mock-data.service';
import * as ProductActions from './product.actions';

@Injectable()
export class ProductEffects {
  // Load products effect
  loadProducts$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProductActions.loadProducts),
      switchMap(({ productType, params }) =>
        this.mockDataService.getProductData(productType, params).pipe(
          map(products => ProductActions.loadProductsSuccess({ products })),
          catchError(error => of(ProductActions.loadProductsFailure({ error })))
        )
      )
    )
  );

  // Adjust product effect
  adjustProduct$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProductActions.adjustProduct),
      switchMap(({ id, field, value, reason }) =>
        this.mockDataService.adjustProductData(id, field, value, reason).pipe(
          map(() => ProductActions.adjustProductSuccess({ id, field, value })),
          catchError(error => of(ProductActions.adjustProductFailure({ error })))
        )
      )
    )
  );

  // Add commentary effect
  addProductCommentary$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProductActions.addProductCommentary),
      switchMap(({ productId, commentary }) =>
        this.mockDataService.addProductCommentary(productId, commentary).pipe(
          map(() => ProductActions.addProductCommentarySuccess({ productId, commentary })),
          catchError(error => of(ProductActions.addProductCommentaryFailure({ error })))
        )
      )
    )
  );

  // Export products effect
  exportProducts$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProductActions.exportProducts),
      switchMap(({ format }) =>
        this.mockDataService.exportProductData(format).pipe(
          map(() => ProductActions.exportProductsSuccess()),
          catchError(error => of(ProductActions.exportProductsFailure({ error })))
        )
      )
    )
  );

  // Log errors
  logError$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(
          ProductActions.loadProductsFailure,
          ProductActions.adjustProductFailure,
          ProductActions.addProductCommentaryFailure,
          ProductActions.exportProductsFailure
        ),
        tap(({ error }) => console.error('Product Error:', error))
      ),
    { dispatch: false }
  );

  constructor(
    private actions$: Actions,
    private mockDataService: MockDataService
  ) {}
}
