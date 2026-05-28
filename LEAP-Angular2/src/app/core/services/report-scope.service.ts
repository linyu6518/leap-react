import { Injectable, signal } from '@angular/core'
import { normaliseRegion, normaliseStoredSegments } from '../../shared/entity-tree/entity-data'

export interface ScopeState {
  region: string | null
  segments: string[]
}

const GLOBAL_KEY = 'leap_global_scope'
const PAGE_KEYS = ['deposits', 'lcr-detail', 'lcr-view', 'products']

function pageKey(routeKey: string): string {
  return `leap_page_scope_${routeKey}`
}

function loadScope(key: string): ScopeState | null {
  try {
    const s = sessionStorage.getItem(key)
    return s ? (JSON.parse(s) as ScopeState) : null
  } catch (_) {
    return null
  }
}

function saveScope(key: string, scope: ScopeState): void {
  try {
    sessionStorage.setItem(key, JSON.stringify(scope))
  } catch (_) {}
}

function normaliseScope(scope: ScopeState | null): ScopeState | null {
  if (!scope) return null
  const region = normaliseRegion(scope.region)
  return {
    region,
    segments: normaliseStoredSegments(region, scope.segments),
  }
}

@Injectable({ providedIn: 'root' })
export class ReportScopeService {
  private readonly _global = signal<ScopeState>(
    normaliseScope(loadScope(GLOBAL_KEY)) ?? { region: null, segments: [] },
  )

  readonly globalScope = this._global.asReadonly()

  setGlobal(region: string | null, segments: string[]): void {
    const s = normaliseScope({ region, segments }) ?? { region: null, segments: [] }
    this._global.set(s)
    saveScope(GLOBAL_KEY, s)
    // Clear all page overrides so every page inherits the new global scope
    PAGE_KEYS.forEach(k => {
      try { sessionStorage.removeItem(pageKey(k)) } catch (_) {}
    })
  }

  setPageOverride(routeKey: string, region: string | null, segments: string[]): void {
    saveScope(pageKey(routeKey), normaliseScope({ region, segments }) ?? { region: null, segments: [] })
  }

  clearPageOverride(routeKey: string): void {
    try {
      sessionStorage.removeItem(pageKey(routeKey))
    } catch (_) {}
  }

  effectiveScope(routeKey: string): ScopeState {
    return normaliseScope(loadScope(pageKey(routeKey))) ?? this._global()
  }

  isPageOverridden(routeKey: string): boolean {
    try {
      return sessionStorage.getItem(pageKey(routeKey)) !== null
    } catch (_) {
      return false
    }
  }
}
