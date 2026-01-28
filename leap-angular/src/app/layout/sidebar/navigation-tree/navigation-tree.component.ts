import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';

interface NavItem {
  label: string;
  icon?: string;
  route?: string;
  children?: NavItem[];
  expanded?: boolean;
}

@Component({
  selector: 'app-navigation-tree',
  templateUrl: './navigation-tree.component.html',
  styleUrls: ['./navigation-tree.component.scss']
})
export class NavigationTreeComponent {
  @Input() sidebarOpened = true;
  navItems: NavItem[] = [
    {
      label: 'Dashboard',
      icon: 'dashboard',
      route: '/dashboard'
    },
    {
      label: 'Products',
      icon: 'inventory_2',
      route: '/product',
      expanded: false,
      children: [
        {
          label: 'Deposit',
          route: '/product/deposits'
        },
        {
          label: 'Commitments'
        },
        {
          label: 'Loans'
        },
        {
          label: 'Derivatives'
        },
        {
          label: 'Unsecured'
        },
        {
          label: 'Interaffiliate Funding'
        },
        {
          label: 'Secured Funding'
        },
        {
          label: 'Other Risks'
        },
        {
          label: 'Prime Services'
        },
        {
          label: 'HQLA'
        }
      ]
    },
    {
      label: 'Regulatory',
      icon: 'gavel',
      expanded: false,
      children: [
        {
          label: 'Metrics',
          expanded: false,
          children: [
            {
              label: 'LCR',
              route: '/regulatory/lcr'
            },
            {
              label: 'NSFR',
              route: '/regulatory/nsfr'
            },
            {
              label: 'NCCF',
              route: '/regulatory/nccf'
            }
          ]
        },
        {
          label: 'Reporting',
          expanded: false
        },
        {
          label: 'Templates',
          expanded: false
        },
        {
          label: 'Others',
          expanded: false
        }
      ]
    },
    {
      label: 'Internal',
      icon: 'account_circle',
      expanded: false
    }
  ];

  constructor(private router: Router) {}

  isActive(route?: string): boolean {
    if (!route) return false;
    return this.router.url.includes(route);
  }

  toggleExpand(item: NavItem): void {
    if (item.children) {
      item.expanded = !item.expanded;
    }
  }

  navigate(item: NavItem): void {
    if (item.children) {
      this.toggleExpand(item);
    }
    if (item.route) {
      this.router.navigate([item.route]);
    }
  }
}
