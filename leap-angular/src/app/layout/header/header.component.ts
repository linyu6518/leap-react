import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { selectCurrentUser } from '@core/state/auth/auth.selectors';
import { logout } from '@core/state/auth/auth.actions';
import { User } from '@core/state/auth/auth.actions';

interface Breadcrumb {
  label: string;
  url: string;
}

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  currentUser = {
    name: 'Yu Lin',
    role: 'Maker',
    avatar: 'YL'
  };

  user$: Observable<User | null>;
  breadcrumbs: Breadcrumb[] = [];

  constructor(
    private router: Router,
    private store: Store
  ) {
    this.user$ = this.store.select(selectCurrentUser);
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        map(() => this.createBreadcrumbs())
      )
      .subscribe(breadcrumbs => {
        this.breadcrumbs = breadcrumbs;
      });
  }

  private createBreadcrumbs(): Breadcrumb[] {
    const url = this.router.url;
    const segments = url.split('/').filter(segment => segment);

    const breadcrumbs: Breadcrumb[] = [{ label: 'Home', url: '/dashboard' }];

    if (segments.length > 0) {
      if (segments[0] === 'dashboard') {
        breadcrumbs.push({ label: 'Dashboard', url: '/dashboard' });
      } else if (segments[0] === 'product') {
        breadcrumbs.push({ label: 'Product Analysis', url: '/product' });
        if (segments[1]) {
          breadcrumbs.push({
            label: this.formatLabel(segments[1]),
            url: `/product/${segments[1]}`
          });
        }
      } else if (segments[0] === 'regulatory') {
        breadcrumbs.push({ label: 'Regulatory Views', url: '/regulatory' });
        if (segments[1]) {
          breadcrumbs.push({
            label: segments[1].toUpperCase(),
            url: `/regulatory/${segments[1]}`
          });
        }
      } else if (segments[0] === 'maker') {
        breadcrumbs.push({ label: 'Maker Workspace', url: '/maker/review' });
      } else if (segments[0] === 'checker') {
        breadcrumbs.push({ label: 'Checker Workspace', url: '/checker/approve' });
      }
    }

    return breadcrumbs;
  }

  private formatLabel(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).replace(/-/g, ' ');
  }

  ngOnInit(): void {
    // Subscribe to user changes
    this.user$.subscribe(user => {
      if (user) {
        this.currentUser = {
          name: user.fullName || user.username,
          role: user.role.charAt(0).toUpperCase() + user.role.slice(1),
          avatar: this.getInitials(user.fullName || user.username)
        };
      }
    });
  }

  private getInitials(name: string): string {
    return name
      .split(' ')
      .map(n => n.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  logout(): void {
    this.store.dispatch(logout());
  }

  switchToChecker(): void {
    // Switch role to Checker
    this.currentUser.role = 'Checker';
    // You can add navigation logic here if needed
    // this.router.navigate(['/checker/approve']);
  }
}
