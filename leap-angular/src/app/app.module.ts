import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';

import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CoreModule } from './core/core.module';
import { SharedModule } from './shared/shared.module';
import { LayoutModule } from './layout/layout.module';

import { environment } from '../environments/environment';

// State Management
import { workflowReducer } from './core/state/workflow/workflow.reducer';
import { productReducer } from './core/state/product/product.reducer';
import { authReducer } from './core/state/auth/auth.reducer';
import { WorkflowEffects } from './core/state/workflow/workflow.effects';
import { ProductEffects } from './core/state/product/product.effects';
import { AuthEffects } from './core/state/auth/auth.effects';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,

    // NgRx Store
    StoreModule.forRoot({
      workflow: workflowReducer,
      product: productReducer,
      auth: authReducer
    }, {
      runtimeChecks: {
        strictStateImmutability: true,
        strictActionImmutability: true
      }
    }),
    EffectsModule.forRoot([WorkflowEffects, ProductEffects, AuthEffects]),
    StoreDevtoolsModule.instrument({
      maxAge: 25,
      logOnly: environment.production,
      connectInZone: true
    }),

    // App Modules
    CoreModule,
    SharedModule,
    LayoutModule,
    AppRoutingModule
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
