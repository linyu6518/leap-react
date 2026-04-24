import { Injectable, signal } from '@angular/core'

export type ViewMode = 'maker' | 'checker'

@Injectable({ providedIn: 'root' })
export class ViewModeService {
  readonly viewMode = signal<ViewMode>('maker')

  toggle(): void {
    this.viewMode.update(v => (v === 'maker' ? 'checker' : 'maker'))
  }

  setMode(mode: ViewMode): void {
    this.viewMode.set(mode)
  }
}
