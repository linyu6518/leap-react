import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-main-layout',
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss']
})
export class MainLayoutComponent implements OnDestroy {
  sidebarOpened = true;
  private destroy$ = new Subject<void>();

  constructor(private breakpointObserver: BreakpointObserver) {
    // Sidebar always visible, no toggle needed
  }

  onSidebarToggle(): void {
    this.sidebarOpened = !this.sidebarOpened;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
