import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core'
import { provideRouter } from '@angular/router'
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async'
import { provideNzI18n, en_US } from 'ng-zorro-antd/i18n'
import { provideEcharts } from 'ngx-echarts'
import { routes } from './app.routes'
import { iconsProvider } from './icons-provider'

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimationsAsync(),
    provideNzI18n(en_US),
    provideEcharts(),
    iconsProvider,
  ],
}
